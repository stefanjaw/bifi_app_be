import { AssetMaintenanceDocument } from "@mongodb-types";
import {
  BaseService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { assetMaintenanceModel } from "../models/asset-maintenance.model";
import { ClientSession } from "mongoose";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";
import {
  AssetMaintenanceDTO,
  UpdateAssetMaintenanceDTO,
} from "../models/asset-maintenance.dto";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import dayjs from "dayjs";
import { AssetRosterStatusService } from "../../asset-roster/services/asset-roster-status-service";

export class AssetMaintenanceService extends BaseService<AssetMaintenanceDocument> {
  private assetRosterStatusService = new AssetRosterStatusService();
  private activityHistoryService = new ActivityHistoryService();

  constructor() {
    super({ model: assetMaintenanceModel });
  }

  /**
   * Creates a new asset maintenance.
   * This function checks that a commissioning has been issued for the asset roster and has been approved.
   * If the asset roster is not yet due for preventive maintenance, it throws a ValidationException.
   * If maintenance is not created, it throws a ValidationException.
   * It also handles asset roster status and adds activity history.
   * @param {AssetMaintenanceDTO} data - The asset maintenance data to create.
   * @param {ClientSession} [session] - The client session to use for the create.
   * @returns {Promise<AssetMaintenanceDocument>} - The created asset maintenance document.
   * @throws {ValidationException} - If the assetRoster does not exist, is not commissioned or the maintenance dates are not valid.
   */
  override async create(
    data: AssetMaintenanceDTO,
    session?: ClientSession | undefined
  ): Promise<AssetMaintenanceDocument> {
    return runTransaction<AssetMaintenanceDocument>(
      session,
      async (newSession) => {
        const bucket = this.connectionManager.bindBucketToDb();

        // CHECK THAT THE ASSET ROSTER HAS A COMMISSION ISSUED AND IT SUCCEED
        if (
          !(await this.assetRosterStatusService.assetRosterHasActiveCommissioning(
            data.assetRosterId,
            newSession
          ))
        ) {
          throw new ValidationException(
            "A commissioning must be issued for this asset roster and approved."
          );
        }

        if (
          data.type === "preventive-maintenance" &&
          (await this.assetRosterStatusService.assetRosterIsBeforeDueForMaintenance(
            data.assetRosterId,
            newSession
          ))
        ) {
          throw new ValidationException(
            "The asset roster is not yet due for preventive maintenance."
          );
        }

        // HANDLE FILES IF PROVIDED
        if (
          isValidFileUpload(data.attachments) &&
          Array.isArray(data.attachments) &&
          data.attachments.length > 0
        ) {
          data.attachments = await Promise.all(
            data.attachments.map(async (file) => ({
              fileId: await bucket.uploadFile(file),
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            }))
          );
        }

        // SAVE MAINTENANCE
        const maintenance = await super.create(data, newSession);

        // HANDLE ASSET ROSTER STATUS
        await this.assetRosterStatusService.updateAssetRosterStatus(
          maintenance.assetRosterId._id,
          newSession
        );

        // HANDLE NEXT MAINTENANCE DATES ONLY WHEN IT IS A PM, IS ACTIVE AND IS NOT MANUAL
        if (
          maintenance.type === "preventive-maintenance" &&
          maintenance.active
        ) {
          await this.assetRosterStatusService.updateNextAssetRosterMaintenanceDates(
            maintenance.assetRosterId._id,
            newSession
          );
        }

        return maintenance;
      }
    );
  }

  /**
   * Updates an existing asset maintenance.
   * This function updates the asset maintenance data and handles file uploads if provided.
   * It also handles asset roster status and adds activity history if the maintenance is disabled.
   * @param {UpdateAssetMaintenanceDTO} data - The asset maintenance data to update.
   * @param {ClientSession} [session] - The client session to use for the update.
   * @returns {Promise<AssetMaintenanceDocument>} - The updated asset maintenance document.
   */
  override async update(
    data: UpdateAssetMaintenanceDTO,
    session?: ClientSession | undefined
  ): Promise<AssetMaintenanceDocument> {
    return runTransaction<AssetMaintenanceDocument>(
      session,
      async (newSession) => {
        const bucket = this.connectionManager.bindBucketToDb();

        // HANDLE FILES IF PROVIDED
        if (
          isValidFileUpload(data.attachments) &&
          Array.isArray(data.attachments) &&
          data.attachments.length > 0
        ) {
          data.attachments = await Promise.all(
            data.attachments.map(async (file) => ({
              fileId: await bucket.uploadFile(file),
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            }))
          );
        }

        // UPDATE MAINTENANCE
        const maintenance = await super.update(data, newSession);

        // HANDLE ASSET ROSTER STATUS
        await this.assetRosterStatusService.updateAssetRosterStatus(
          maintenance.assetRosterId._id,
          newSession
        );

        // ADD ACTIVITY HISTORY IF DISABLED
        if (data.active && data.active === "false") {
          await this.activityHistoryService.create(
            {
              title:
                maintenance.type === "preventive-maintenance"
                  ? "PM"
                  : maintenance.name
                      .split("-")
                      .map(
                        (w) => `${w.charAt(0).toUpperCase()}${w.substring(1)}`
                      )
                      .join(" "),
              details: `Finished (${dayjs(maintenance.dateStart).format(
                "DD MMM YYYY"
              )} - ${dayjs(maintenance.dateEnd).format(
                "DD MMM YYYY"
              )}). Notes: ${
                maintenance.notes ? maintenance.notes : "No notes provided."
              } ${maintenance.manual ? "(Manual)" : ""}`,
              performDate: new Date(),
              model: "AssetMaintenance",
              modelId: maintenance._id,
              metadata: {
                assetRosterId: maintenance.assetRosterId._id.toString(),
              },
            },
            newSession
          );
        }

        return maintenance;
      }
    );
  }

  /**
   * Deletes an existing asset maintenance.
   * This function deletes the asset maintenance data and handles updating the asset roster status.
   * It also adds activity history if the maintenance is deleted.
   * @param {string} _id - The ID of the asset maintenance to delete.
   * @param {ClientSession} [session] - The client session to use for the deletion.
   * @returns {Promise<boolean>} - A promise resolving to a boolean indicating whether the deletion was successful.
   */
  override async delete(
    _id: string,
    session?: ClientSession | undefined
  ): Promise<boolean> {
    return runTransaction<boolean>(session, async (newSession) => {
      // GET MAINTENANCE TO CHECK ASSET ROSTER ID
      const maintenance = (
        await super.get({ _id }, undefined, undefined, false, newSession)
      )[0];

      const deleted = await super.delete(_id, newSession);

      await this.assetRosterStatusService.updateAssetRosterStatus(
        maintenance.assetRosterId._id,
        newSession
      );

      await this.activityHistoryService.create(
        {
          title: `${
            maintenance.type === "preventive-maintenance"
              ? "PM"
              : maintenance.name
                  .split("-")
                  .map((w) => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
                  .join(" ")
          } Finished`,
          details: `Finished (${dayjs(maintenance.dateStart).format(
            "DD MMM YYYY"
          )} - ${dayjs(maintenance.dateEnd).format("DD MMM YYYY")}). Notes: ${
            maintenance.type === "preventive-maintenance" ? "PM" : "Service"
          } has concluded`,
          performDate: new Date(),
          model: "AssetMaintenance",
          modelId: maintenance._id,
          metadata: { assetRosterId: maintenance.assetRosterId._id.toString() },
        },
        newSession
      );

      return deleted;
    });
  }
}
