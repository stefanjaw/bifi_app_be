import { ProductMaintenanceDocument } from "@mongodb-types";
import {
  BaseService,
  GridFSBucketService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { productMaintenanceModel } from "../models/product-maintenance.model";
import { ClientSession } from "mongoose";
import { ProductStatusService } from "../../products/services/product-status-service";

export class ProductMaintenanceService extends BaseService<ProductMaintenanceDocument> {
  private productStatusService = new ProductStatusService();

  constructor() {
    super({ model: productMaintenanceModel });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  /**
   * Creates a product maintenance with the given data and returns the created document.
   * Before creating, it checks that the product has a comission issued and it succeed.
   * It also handles file uploads and updates the product's status accordingly.
   * If the maintenance is a preventive maintenance and it is active, it also updates
   * the next maintenance dates for the product.
   * @param data The data to create the product maintenance with.
   * @param session The optional client session to use for the transaction.
   * @returns The created product maintenance document.
   */
  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductMaintenanceDocument> {
    return runTransaction<ProductMaintenanceDocument>(
      session,
      async (newSession) => {
        // CHECK THAT THE PRODUCT HAS A COMISSION ISSUED AND IT SUCCEED
        if (
          !(await this.productStatusService.productHasActiveComissioning(
            data.productId,
            newSession
          ))
        ) {
          throw new ValidationException(
            "A commissioning must be issued for this product and approved."
          );
        }

        // HANDLE FILES IF PROVIDED
        if (data.attachments && Array.isArray(data.attachments)) {
          data.attachments = await this.gridFSBucket.uploadFiles(
            data.attachments
          );
        }

        // SAVE MAINTENANCE
        const maintenance = await super.create(data, newSession);

        // HANDLE PRODUCT STATUS
        await this.productStatusService.updateProductStatus(
          maintenance.productId._id,
          newSession
        );

        // HANDLE NEXT MAINTENANCE DATES
        if (
          maintenance.type === "preventive-maintenance" &&
          maintenance.active
        ) {
          await this.productStatusService.updateNextProductMaintenanceDates(
            maintenance.productId._id,
            newSession
          );
        }

        return maintenance;
      }
    );
  }

  /**
   * Updates a product maintenance with the given data and returns the updated document.
   * Validates that the product has an approved commissioning before updating.
   * Handles file uploads and updates the product's status based on maintenance activity.
   * @param data The data to update the product maintenance with.
   * @param session The optional client session to use for the transaction.
   * @returns The updated product maintenance document.
   * @throws ValidationException if the commissioning is not issued or not approved.
   */
  override async update(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<ProductMaintenanceDocument> {
    return runTransaction<ProductMaintenanceDocument>(
      session,
      async (newSession) => {
        // HANDLE FILES IF PROVIDED
        if (data.attachments && Array.isArray(data.attachments)) {
          data.attachments = await this.gridFSBucket.uploadFiles(
            data.attachments
          );
        }

        // UPDATE MAINTENANCE
        const maintenance = await super.update(data, newSession);

        // HANDLE PRODUCT STATUS
        await this.productStatusService.updateProductStatus(
          maintenance.productId._id,
          newSession
        );

        return maintenance;
      }
    );
  }

  /**
   * Deletes a product maintenance entry by its ID and updates the product's status.
   *
   * This method performs a soft delete on the specified product maintenance record,
   * which involves marking it as inactive. After deletion, it updates the associated
   * product's status to reflect the change in maintenance activity.
   *
   * @param _id - The ID of the product maintenance record to delete.
   * @param session - The optional client session to use for the transaction.
   * @returns A boolean indicating if the deletion was successful.
   */

  override async delete(
    _id: string,
    session?: ClientSession | undefined
  ): Promise<boolean> {
    return runTransaction<boolean>(session, async (newSession) => {
      // GET MAINTENANCE TO CHECK PRODUCT ID
      const maintenance = (
        await super.get({ _id }, undefined, undefined, newSession)
      )[0];

      const deleted = await super.delete(_id, newSession);

      await this.productStatusService.updateProductStatus(
        maintenance.productId._id,
        newSession
      );

      return deleted;
    });
  }
}
