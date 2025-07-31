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

export class ProductComissioningService extends BaseService<ProductComissioningDocument> {
  private productStatusService = new ProductStatusService();
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
        if (data.attachments && Array.isArray(data.attachments)) {
          data.attachments = await this.gridFSBucket.uploadFiles(
            data.attachments
          );
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
              comission.outcome === "pass"
                ? "Comission"
                : "Re-attempt Comission",
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
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductComissioningDocument> {
    return runTransaction<ProductComissioningDocument>(
      session,
      async (newSession) => {
        // HANDLE FILES IF PROVIDED
        if (data.attachments && Array.isArray(data.attachments)) {
          data.attachments = await this.gridFSBucket.uploadFiles(
            data.attachments
          );
        }

        // SAVE COMISSION
        const comission = await super.update(data, newSession);

        // HANDLE PRODUCT STATUS
        await this.productStatusService.updateProductStatus(
          comission.productId._id,
          newSession
        );

        // ADD ACTIVITY HISTORY IF DISABLED
        if (comission.active === false) {
          await this.activityHistoryService.create(
            {
              title: "Comission",
              details: "Comissioned. Notes: Comission disabled",
              performDate: new Date(),
              model: "ProductComissioning",
              modelId: comission._id,
              metadata: { productId: comission.productId._id.toString() },
            },
            newSession
          );
        }

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

      // ADD ACTIVITY HISTORY
      await this.activityHistoryService.create(
        {
          title: "Comission",
          details: "Comissioned. Notes: Comission disabled",
          performDate: new Date(),
          model: "ProductComissioning",
          modelId: comission._id,
          metadata: { productId: comission.productId._id.toString() },
        },
        newSession
      );

      return deleted;
    });
  }
}
