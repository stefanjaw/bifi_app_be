import { ProductDocument, ProductMaintenanceDocument } from "@mongodb-types";
import {
  BaseService,
  GridFSBucketService,
  ValidationException,
} from "../../../system";
import { productMaintenanceModel } from "../models/product-maintenance.model";
import { ClientSession } from "mongoose";
import { ProductService } from "../../products/services/product-service";
import { productStatus } from "../../products/models/product-status.type";

export class ProductMaintenanceService extends BaseService<ProductMaintenanceDocument> {
  private productService = new ProductService();

  constructor() {
    super({ model: productMaintenanceModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  /**
   * Creates a new product maintenance entry and returns the created document.
   * Validates that the product has an approved commissioning before creation.
   * Handles file uploads and updates the product's status based on maintenance activity.
   * @param data The data to create the product maintenance with.
   * @param session The optional client session to use for the transaction.
   * @returns The created product maintenance document.
   * @throws ValidationException if the commissioning is not issued or not approved.
   */

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductMaintenanceDocument> {
    return super.runTransaction<ProductMaintenanceDocument>(
      session,
      async (newSession) => {
        // CHECK THAT THE PRODUCT HAS A COMISSION ISSUED AND IT SUCCEED
        const product = (
          (await this.productService.get(
            { productId: data.productId, active: true },
            undefined,
            undefined,
            newSession!
          )) as ProductDocument[]
        )?.[0];

        if (!product.productComission) {
          throw new ValidationException(
            "A commissioning must be issued for this product."
          );
        }

        if (product.productComission.outcome !== "pass") {
          throw new ValidationException(
            "The commissioning for this product has not been approved."
          );
        }

        // HANDLE FILES IF PROVIDED
        if (data.attachments && Array.isArray(data.attachments)) {
          for (const file of data.attachments) {
            if (file && typeof file === "object") {
              const fileId = await this.gridFSBucket.uploadFile(file, {
                encoding: file.encoding,
                mimetype: file.mimetype,
                originalname: file.originalname,
                size: file.size,
              });

              // Replace the file object with its ID
              const index = data.attachments.indexOf(file);
              if (index !== -1) {
                data.attachments[index] = fileId;
              }
            }
          }
        }

        // SAVE MAINTENANCE
        const maintenance = await super.create(data, newSession);

        // HANDLE PRODUCT STATUS
        const productComission: productStatus = maintenance.active
          ? "under-service"
          : product.productComission.outcome === "fail" ||
            !product.productComission.active
          ? "awaiting-comissioning"
          : "active";

        await this.productService.update(
          {
            _id: maintenance.productId,
            status: productComission,
          },
          newSession
        );

        return maintenance;
      }
    );
  }

  /**
   * Updates a product maintenance with the given data and returns the updated document.
   * Before updating, it checks that the product has a commissioning issued and it has been approved.
   * It also handles file uploads and updates the product's status accordingly.
   * @param data The data to update the product maintenance with.
   * @param session The optional client session to use for the transaction.
   * @returns The updated product maintenance document.
   */
  override async update(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductMaintenanceDocument> {
    return super.runTransaction<ProductMaintenanceDocument>(
      session,
      async (newSession) => {
        // GET PRODUCT PRODUCT
        const product = (
          (await this.productService.get(
            { productId: data.productId, active: true },
            undefined,
            undefined,
            newSession!
          )) as ProductDocument[]
        )?.[0];

        // HANDLE FILES IF PROVIDED
        if (data.attachments && Array.isArray(data.attachments)) {
          for (const file of data.attachments) {
            if (file && typeof file === "object") {
              const fileId = await this.gridFSBucket.uploadFile(file, {
                encoding: file.encoding,
                mimetype: file.mimetype,
                originalname: file.originalname,
                size: file.size,
              });

              // Replace the file object with its ID
              const index = data.attachments.indexOf(file);
              if (index !== -1) {
                data.attachments[index] = fileId;
              }
            }
          }
        }

        // UPDATE MAINTENANCE
        const maintenance = await super.update(data, newSession);

        // HANDLE PRODUCT STATUS
        const productComission: productStatus = maintenance.active
          ? "under-service"
          : product.productComission.outcome === "fail" ||
            !product.productComission.active
          ? "awaiting-comissioning"
          : "active";

        await this.productService.update(
          {
            _id: maintenance.productId,
            status: productComission,
          },
          newSession
        );

        return maintenance;
      }
    );
  }

  /**
   * Deletes a product maintenance entry by its ID and updates the associated product's status.
   *
   * This method runs within a transaction to ensure atomicity of operations. It first retrieves
   * the maintenance entry to determine the associated product ID. Then, it fetches the product
   * to assess its commissioning status. The maintenance entry is then marked as deleted, and
   * the product's status is updated based on the commissioning outcome and activity status.
   *
   * @param {string} _id - The ID of the maintenance entry to delete.
   * @param {ClientSession} [session] - Optional session for transactional operations.
   * @returns {Promise<boolean>} - A promise resolving to a boolean indicating if the deletion was successful.
   */

  override async delete(
    _id: string,
    session?: ClientSession | undefined
  ): Promise<boolean> {
    return super.runTransaction<boolean>(session, async (newSession) => {
      // GET MAINTENANCE TO CHECK PRODUCT ID
      const maintenance = (
        (await super.get(
          { _id },
          undefined,
          undefined,
          newSession
        )) as ProductMaintenanceDocument[]
      )[0];

      // GET PRODUCT PRODUCT
      const product = (
        (await this.productService.get(
          { productId: maintenance.productId._id, active: true },
          undefined,
          undefined,
          newSession!
        )) as ProductDocument[]
      )?.[0];

      const deleted = await super.delete(_id, newSession);

      const productStatus: productStatus =
        product.productComission.outcome === "fail" ||
        !product.productComission.active
          ? "awaiting-comissioning"
          : "active";

      await this.productService.update(
        {
          _id: maintenance.productId._id,
          status: productStatus,
        },
        newSession
      );

      return deleted;
    });
  }
}
