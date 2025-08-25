import { ClientSession } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { productComissioningModel } from "../models/product-comissioning.model";
import { ProductComissioningDocument } from "../../../types/mongoose.gen";
import { ProductStatusService } from "../../products/services/product-status-service";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";
import { ProductService } from "../../products/services/product-service";
import { UpdateProductComissioningDTO } from "../models/product-comissioning.dto";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";

export class ProductComissioningService extends BaseService<ProductComissioningDocument> {
  private productStatusService = new ProductStatusService();
  private productService = new ProductService();
  private activityHistoryService = new ActivityHistoryService();

  constructor() {
    super({ model: productComissioningModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  /**
   * Creates a product comissioning with the given data and returns the created document.
   * Before creating, it checks that no other comission was issued for the product and is active.
   * It also handles file uploads and updates the product's status accordingly.
   * @param data The data to create the product comissioning with.
   * @param session The optional client session to use for the transaction.
   * @returns The created product comissioning document.
   */
  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductComissioningDocument> {
    return runTransaction<ProductComissioningDocument>(
      session,
      async (newSession) => {
        // CHECK THAT NO OTHER COMISSION WAS ISSUED FOR THE PRODUCT AND IS ACTIVE
        if (
          await this.productStatusService.productHasActiveComissioning(
            data.productId,
            newSession
          )
        ) {
          throw new ValidationException(
            "A commissioning already exists for this product and has passed."
          );
        }

        // HANDLE FILES IF PROVIDED
        if (isValidFileUpload(data.attachments)) {
          data.attachments = await this.gridFSBucket.upload(data.attachments);
        }

        // GET ALL COMISSIONS FOR THE PRODUCT
        const comissions = await this.get(
          { productId: data.productId },
          undefined,
          undefined,
          false,
          newSession
        );

        // SET ALL COMISSIONS AS INACTIVE EXCEPT THE ONE BEING CREATED
        await Promise.all(
          comissions.map(async (comission) => {
            comission.active = false;
            await comission.save({ session: newSession });
          })
        );

        // SAVE COMISSION
        const comission = await super.create(data, newSession);

        // HANDLE PRODUCT STATUS
        await this.productStatusService.updateProductStatus(
          comission.productId._id,
          newSession
        );

        // ADD ACTIVITY HISTORY
        await this.activityHistoryService.create(
          {
            title:
              comission.outcome === "pass" ? "Comissioned" : "Comission Failed",
            details: `Comissioned. Notes: ${
              comission.outcome === "pass"
                ? "OK to enter service"
                : "comission failed"
            }`,
            performDate: new Date(),
            model: "ProductComissioning",
            modelId: comission._id,
            metadata: { productId: comission.productId._id.toString() },
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
    data: UpdateProductComissioningDTO,
    session?: ClientSession | undefined
  ): Promise<ProductComissioningDocument> {
    return runTransaction<ProductComissioningDocument>(
      session,
      async (newSession) => {
        // HANDLE FILES IF PROVIDED
        if (isValidFileUpload(data.attachments)) {
          data.attachments = await this.gridFSBucket.upload(data.attachments);
        }

        // SAVE COMISSION
        const comission = await super.update(data, newSession);

        // HANDLE PRODUCT STATUS
        await this.productStatusService.updateProductStatus(
          comission.productId._id,
          newSession
        );

        return comission;
      }
    );
  }

  /**
   * Updates a product comissioning with the given data and marks it as decommissioned.
   * It also updates the product's status to "decommissioned".
   * Additionally, it adds an activity history record for the decomissioning event.
   * @param data The data to update the product comissioning with.
   * @param session The optional client session to use for the transaction.
   * @returns The updated product comissioning document.
   */
  async updateDecomission(
    data: UpdateProductComissioningDTO,
    session?: ClientSession | undefined
  ) {
    return runTransaction<ProductComissioningDocument>(
      session,
      async (newSession) => {
        const comission = await this.update(
          { ...data, active: false },
          newSession
        );

        await this.productService.update(
          { _id: comission.productId._id, status: "decomissioned" },
          newSession
        );

        // ADD ACTIVITY HISTORY
        await this.activityHistoryService.create(
          {
            title: "Decomissioned",
            details: "Decomissioned. Notes: All actions are disabled",
            performDate: new Date(),
            model: "ProductComissioning",
            modelId: comission._id,
            metadata: { productId: comission.productId._id.toString() },
          },
          newSession
        );

        return comission;
      }
    );
  }

  /**
   * Deletes a product commissioning record by its ID and updates the product's status.
   *
   * This function performs a soft delete of the commissioning record and updates the
   * status of the associated product accordingly. It runs within a transaction.
   *
   * @param _id - The ID of the commissioning record to delete.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise that resolves to a boolean indicating if the deletion was successful.
   */

  override async delete(
    _id: string,
    session?: ClientSession | undefined
  ): Promise<boolean> {
    return runTransaction<boolean>(session, async (newSession) => {
      const comission = (
        await super.get({ _id }, undefined, undefined, false, newSession)
      )[0];

      const deleted = await super.delete(_id, newSession);

      await this.productStatusService.updateProductStatus(
        comission.productId._id,
        newSession
      );

      return deleted;
    });
  }
}
