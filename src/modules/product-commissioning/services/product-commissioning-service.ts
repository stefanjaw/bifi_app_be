import { ClientSession } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { productCommissioningModel } from "../models/product-commissioning.model";
import { ProductCommissioningDocument } from "../../../types/mongoose.gen";
import { ProductStatusService } from "../../products/services/product-status-service";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";
import { ProductService } from "../../products/services/product-service";
import {
  ProductCommissioningDTO,
  UpdateProductCommissioningDTO,
} from "../models/product-commissioning.dto";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import { InnerFile } from "../../../system/libraries/file-storage/file-upload.types";

export class ProductCommissioningService extends BaseService<ProductCommissioningDocument> {
  private productStatusService = new ProductStatusService();
  private productService = new ProductService();
  private activityHistoryService = new ActivityHistoryService();

  constructor() {
    super({ model: productCommissioningModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  /**
   * Creates a product commissioning with the given data and returns the created document.
   * Before creating, it checks that no other commission was issued for the product and is active.
   * It also handles file uploads and updates the product's status accordingly.
   * @param data The data to create the product commissioning with.
   * @param session The optional client session to use for the transaction.
   * @returns The created product commissioning document.
   */
  override async create(
    data: ProductCommissioningDTO,
    session?: ClientSession | undefined
  ): Promise<ProductCommissioningDocument> {
    return runTransaction<ProductCommissioningDocument>(
      session,
      async (newSession) => {
        // CHECK THAT NO OTHER COMISSION WAS ISSUED FOR THE PRODUCT AND IS ACTIVE
        if (
          await this.productStatusService.productHasActiveCommissioning(
            data.productId,
            newSession
          )
        ) {
          throw new ValidationException(
            "A commissioning already exists for this product and has passed."
          );
        }

        // HANDLE FILES IF PROVIDED
        if (
          isValidFileUpload(data.attachments) &&
          Array.isArray(data.attachments)
        ) {
          data.attachments = await Promise.all(
            data.attachments.map<Promise<InnerFile>>(async (file) => ({
              fileId: await this.gridFSBucket.uploadFile(file),
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            }))
          );
        }

        // GET ALL COMISSIONS FOR THE PRODUCT
        const commissions = await this.get(
          { productId: data.productId },
          undefined,
          undefined,
          false,
          newSession
        );

        // SET ALL COMISSIONS AS INACTIVE EXCEPT THE ONE BEING CREATED
        await Promise.all(
          commissions.map(async (commission) => {
            commission.active = false;
            await commission.save({ session: newSession });
          })
        );

        // SAVE COMISSION
        const commission = await super.create(data, newSession);

        // HANDLE PRODUCT STATUS
        await this.productStatusService.updateProductStatus(
          commission.productId._id,
          newSession
        );

        // ADD ACTIVITY HISTORY
        await this.activityHistoryService.create(
          {
            title:
              commission.outcome === "pass"
                ? "Commissioned"
                : "Commission Failed",
            details: `Commissioned. Notes: ${
              commission.outcome === "pass"
                ? "OK to enter service"
                : "commission failed"
            }. Reason: ${commission.details}`,
            performDate: new Date(),
            model: "ProductCommissioning",
            modelId: commission._id,
            metadata: { productId: commission.productId._id.toString() },
          },
          newSession
        );

        return commission;
      }
    );
  }

  /**
   * Updates a product commissioning with the given data and returns the updated document.
   * Before updating, it checks that no other commission was issued for the product.
   * It also handles file uploads and updates the product's status accordingly.
   * @param data The data to update the product commissioning with.
   * @param session The optional client session to use for the transaction.
   * @returns The updated product commissioning document.
   */
  override async update(
    data: UpdateProductCommissioningDTO,
    session?: ClientSession | undefined
  ): Promise<ProductCommissioningDocument> {
    return runTransaction<ProductCommissioningDocument>(
      session,
      async (newSession) => {
        // HANDLE FILES IF PROVIDED
        if (
          isValidFileUpload(data.attachments) &&
          Array.isArray(data.attachments)
        ) {
          data.attachments = await Promise.all(
            data.attachments.map<Promise<InnerFile>>(async (file) => ({
              fileId: await this.gridFSBucket.uploadFile(file),
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            }))
          );
        }

        // SAVE COMISSION
        const commission = await super.update(data, newSession);

        // HANDLE PRODUCT STATUS
        await this.productStatusService.updateProductStatus(
          commission.productId._id,
          newSession
        );

        return commission;
      }
    );
  }

  /**
   * Updates a product commissioning with the given data and marks it as decommissioned.
   * It also updates the product's status to "decommissioned".
   * Additionally, it adds an activity history record for the decommissioning event.
   * @param data The data to update the product commissioning with.
   * @param session The optional client session to use for the transaction.
   * @returns The updated product commissioning document.
   */
  async updateDecommission(
    data: UpdateProductCommissioningDTO,
    session?: ClientSession | undefined
  ) {
    return runTransaction<ProductCommissioningDocument>(
      session,
      async (newSession) => {
        const commission = await this.update(
          { ...data, active: false },
          newSession
        );

        await this.productService.update(
          { _id: commission.productId._id, status: "decommissioned" },
          newSession
        );

        // ADD ACTIVITY HISTORY
        await this.activityHistoryService.create(
          {
            title: "Decommissioned",
            details:
              "Decommissioned. Notes: All actions are disabled. Reason: " +
              data.details,
            performDate: new Date(),
            model: "ProductCommissioning",
            modelId: commission._id,
            metadata: { productId: commission.productId._id.toString() },
          },
          newSession
        );

        return commission;
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
      const commission = (
        await super.get({ _id }, undefined, undefined, false, newSession)
      )[0];

      const deleted = await super.delete(_id, newSession);

      await this.productStatusService.updateProductStatus(
        commission.productId._id,
        newSession
      );

      return deleted;
    });
  }
}
