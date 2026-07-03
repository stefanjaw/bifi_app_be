import { ClientSession } from "mongoose";
import {
  BaseService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { assetCommissioningModel } from "../models/asset-commissioning.model";
import { AssetCommissioningDocument } from "../../../types/mongoose.gen";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";
import {
  AssetCommissioningDTO,
  UpdateAssetCommissioningDTO,
} from "../models/asset-commissioning.dto";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import { InnerFile } from "../../../system/libraries/file-storage/file-upload.types";
import { AssetRosterStatusService } from "../../asset-roster/services/asset-roster-status-service";
import { AssetRosterService } from "../../asset-roster/services/asset-roster-service";

export class AssetCommissioningService extends BaseService<AssetCommissioningDocument> {
  private assetRosterStatusService = new AssetRosterStatusService();
  private assetRosterService = new AssetRosterService();
  private activityHistoryService = new ActivityHistoryService();

  constructor() {
    super({ model: assetCommissioningModel });
  }

  /**
   * Creates a new asset commissioning. This will check if a commissioning already exists for the asset roster and is active.
   * If so, it will throw a ValidationException. It will also handle any file uploads and set all other commissionings for the asset roster as inactive except the one being created.
   * It will also handle asset roster status and add activity history.
   * @param {AssetCommissioningDTO} data - The asset commissioning data to create.
   * @param {ClientSession} [session] - The client session to use for the create.
   * @returns {Promise<AssetCommissioningDocument>} - The created asset commissioning document.
   * @throws {ValidationException} - If a commissioning already exists for the asset roster and has passed.
   */
  override async create(
    data: AssetCommissioningDTO,
    session?: ClientSession | undefined,
  ): Promise<AssetCommissioningDocument> {
    return runTransaction<AssetCommissioningDocument>(
      session,
      async (newSession) => {
        const bucket = this.connectionManager.bindBucketToDb();

        // CHECK THAT NO OTHER COMMISSION WAS ISSUED FOR THE ASSET ROSTER AND IS ACTIVE
        if (
          await this.assetRosterStatusService.assetRosterHasActiveCommissioning(
            data.assetRosterId,
            newSession,
          )
        ) {
          throw new ValidationException(
            "A commissioning already exists for this asset roster and has passed.",
          );
        }

        // HANDLE FILES IF PROVIDED
        if (
          isValidFileUpload(data.attachments) &&
          Array.isArray(data.attachments)
        ) {
          data.attachments = await Promise.all(
            data.attachments.map<Promise<InnerFile>>(async (file) => ({
              fileId: await bucket.uploadFile(file),
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            })),
          );
        }

        // GET ALL COMMISSIONS FOR THE ASSET ROSTER
        const commissions = await this.get(
          { assetRosterId: data.assetRosterId },
          undefined,
          undefined,
          false,
          newSession,
        );

        // SET ALL COMMISSIONS AS INACTIVE EXCEPT THE ONE BEING CREATED
        await Promise.all(
          commissions.map(async (commission) => {
            commission.active = false;
            await commission.save({ session: newSession });
          }),
        );

        // SAVE COMMISSION
        const commission = await super.create(data, newSession);

        // HANDLE ASSET ROSTER STATUS
        await this.assetRosterStatusService.updateAssetRosterStatus(
          commission.assetRosterId._id,
          newSession,
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
            model: "AssetCommissioning",
            modelId: commission._id,
            metadata: {
              assetRosterId: commission.assetRosterId._id.toString(),
            },
          },
          newSession,
        );

        return commission;
      },
    );
  }

  /**
   * Updates an existing asset commissioning record.
   * Handles file uploads if provided and updates the asset roster status.
   * @param {UpdateAssetCommissioningDTO} data - The data to update the asset commissioning record with.
   * @param {ClientSession} [session] - The client session to use for the update.
   * @returns {Promise<AssetCommissioningDocument>} - The updated asset commissioning record document.
   */
  override async update(
    data: UpdateAssetCommissioningDTO,
    session?: ClientSession | undefined,
  ): Promise<AssetCommissioningDocument> {
    return runTransaction<AssetCommissioningDocument>(
      session,
      async (newSession) => {
        const bucket = this.connectionManager.bindBucketToDb();

        // HANDLE FILES IF PROVIDED
        if (
          isValidFileUpload(data.attachments) &&
          Array.isArray(data.attachments)
        ) {
          data.attachments = await Promise.all(
            data.attachments.map<Promise<InnerFile>>(async (file) => ({
              fileId: await bucket.uploadFile(file),
              name: file.originalname,
              mimeType: file.mimetype,
              size: file.size,
            })),
          );
        }

        // SAVE COMMISSION
        const commission = await super.update(data, newSession);

        // HANDLE ASSET ROSTER STATUS
        await this.assetRosterStatusService.updateAssetRosterStatus(
          commission.assetRosterId._id,
          newSession,
        );

        return commission;
      },
    );
  }

  /**
   * Updates an existing asset commissioning record to decommissioned.
   * Sets the active field to false and updates the asset roster status to decommissioned.
   * Adds an activity history record with the details of the decommissioning.
   * @param {UpdateAssetCommissioningDTO} data - The data to update the asset commissioning record with.
   * @param {ClientSession} [session] - The client session to use for the update.
   * @returns {Promise<AssetCommissioningDocument>} - The updated asset commissioning record document.
   */
  async updateDecommission(
    data: UpdateAssetCommissioningDTO,
    session?: ClientSession | undefined,
  ) {
    return runTransaction<AssetCommissioningDocument>(
      session,
      async (newSession) => {
        const commission = await this.update(
          { ...data, active: false },
          newSession,
        );

        await this.assetRosterService.update(
          { _id: commission.assetRosterId._id, status: "decommissioned" },
          newSession,
        );

        // ADD ACTIVITY HISTORY
        await this.activityHistoryService.create(
          {
            title: "Decommissioned",
            details:
              "Decommissioned. Notes: All actions are disabled. Reason: " +
              data.details,
            performDate: new Date(),
            model: "AssetCommissioning",
            modelId: commission._id,
            metadata: {
              assetRosterId: commission.assetRosterId._id.toString(),
            },
          },
          newSession,
        );

        return commission;
      },
    );
  }

  /**
   * Deletes an existing asset commissioning record.
   * Handles the deletion of the asset commissioning record and updates the asset roster status.
   * @param {string} _id - The ID of the asset commissioning record to delete.
   * @param {ClientSession} [session] - The client session to use for the deletion.
   * @returns {Promise<boolean>} - A promise resolving to a boolean indicating whether the deletion was successful.
   */
  override async delete(
    _id: string,
    session?: ClientSession | undefined,
  ): Promise<boolean> {
    return runTransaction<boolean>(session, async (newSession) => {
      const commission = (
        await super.get({ _id }, undefined, undefined, false, newSession)
      )[0];

      const deleted = await super.delete(_id, newSession);

      await this.assetRosterStatusService.updateAssetRosterStatus(
        commission.assetRosterId._id,
        newSession,
      );

      return deleted;
    });
  }
}
