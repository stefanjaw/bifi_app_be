import { ClientSession } from "mongoose";
import { ProductDocument } from "@mongodb-types";
import {
  BaseService,
  GridFSBucketService,
  ValidationException,
} from "../../../system";
import { productComissioningModel } from "../models/product-comissioning.model";
import { ProductComissioningDocument } from "../../../types/mongoose.gen";
import { ProductService } from "../../products/services/product-service";
import { productStatus } from "../../products/models/product-status.type";

export class ProductComissioningService extends BaseService<ProductComissioningDocument> {
  private productService = new ProductService();

  constructor() {
    super({ model: productComissioningModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  /**
   * Creates a new product commissioning document.
   * Ensures that no other active commissioning exists for the product.
   * Handles file uploads and associates them with the commissioning document.
   * Updates the product's status based on the commissioning outcome.
   *
   * @param data The data used to create the product commissioning document.
   * @param session Optional. The client session to use for the transaction.
   * @returns The newly created product commissioning document.
   * @throws ValidationException if a commissioning already exists for the product.
   */

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductComissioningDocument> {
    return super.runTransaction<ProductComissioningDocument>(
      session,
      async (newSession) => {
        // CHECK THAT NO OTHER COMISSION WAS ISSUED FOR THE PRODUCT AND IS ACTIVE
        const product = (
          (await this.productService.get(
            { productId: data.productId, active: true },
            undefined,
            undefined,
            newSession!
          )) as ProductDocument[]
        )?.[0];

        if (product.productComission) {
          throw new ValidationException(
            "A commissioning already exists for this product."
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

        // SAVE COMISSION
        const comission = await super.create(data, newSession);

        // HANDLE PRODUCT STATUS
        const productStatus: productStatus =
          comission.outcome === "fail" || !comission.active
            ? "awaiting-comissioning"
            : "active";

        await this.productService.update(
          {
            _id: comission.productId,
            status: productStatus,
          },
          newSession
        );

        return comission;
      }
    );
  }

  /**
   * Updates a product comissioning with the given data and returns the updated document.
   * Before updating, it checks that no other comission was issued for the product.
   * It also handles file uploads and updates the product's status accordingly.
   * @param data The data to update the product comissioning with.
   * @param session The optional client session to use for the transaction.
   * @returns The updated product comissioning document.
   */
  override async update(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductComissioningDocument> {
    return super.runTransaction<ProductComissioningDocument>(
      session,
      async (newSession) => {
        // CHECK THAT NO OTHER COMISSION WAS ISSUED FOR THE PRODUCT
        const product = (
          (await this.productService.get(
            { productId: data.productId, active: true },
            undefined,
            undefined,
            newSession!
          )) as ProductDocument[]
        )?.[0];

        if (
          product.productComission &&
          product.productComission._id.toString() !== data._id
        ) {
          throw new ValidationException(
            "A commissioning already exists for this product."
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

        // SAVE COMISSION
        const comission = await super.update(data, newSession);

        // HANDLE PRODUCT STATUS
        const productStatus: productStatus =
          comission.outcome === "fail" || !comission.active
            ? "awaiting-comissioning"
            : "active";

        await this.productService.update(
          {
            _id: comission.productId,
            status: productStatus,
          },
          newSession
        );

        return comission;
      }
    );
  }

  /**
   * Deletes a product comissioning with the given ID and returns a boolean indicating if the deletion was successful.
   * Before deleting, it checks that the comissioning exists.
   * It also updates the product's status to "awaiting-comissioning" after deletion.
   * @param _id The ID of the comissioning to delete.
   * @param session The optional client session to use for the transaction.
   * @returns A boolean indicating if the deletion was successful.
   */
  override async delete(
    _id: string,
    session?: ClientSession | undefined
  ): Promise<boolean> {
    return super.runTransaction<boolean>(session, async (newSession) => {
      const comission = (
        (await super.get(
          { _id },
          undefined,
          undefined,
          newSession
        )) as ProductComissioningDocument[]
      )[0];

      const deleted = await super.delete(_id, newSession);

      await this.productService.update(
        {
          _id: comission.productId,
          status: "awaiting-comissioning",
        },
        newSession
      );

      return deleted;
    });
  }
}
