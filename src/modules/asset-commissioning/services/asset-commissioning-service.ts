import { ClientSession } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
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

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  override async create(
    data: AssetCommissioningDTO,
    session?: ClientSession | undefined
  ): Promise<AssetCommissioningDocument> {
    return runTransaction<AssetCommissioningDocument>(
      session,
      async (newSession) => {
        // CHECK THAT NO OTHER COMMISSION WAS ISSUED FOR THE ASSET ROSTER AND IS ACTIVE
        if (
          await this.assetRosterStatusService.assetRosterHasActiveCommissioning(
            data.assetRosterId,
            newSession
          )
        ) {
          throw new ValidationException(
            "A commissioning already exists for this asset roster and has passed."
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

        // GET ALL COMMISSIONS FOR THE ASSET ROSTER
        const commissions = await this.get(
          { assetRosterId: data.assetRosterId },
          undefined,
          undefined,
          false,
          newSession
        );

        // SET ALL COMMISSIONS AS INACTIVE EXCEPT THE ONE BEING CREATED
        await Promise.all(
          commissions.map(async (commission) => {
            commission.active = false;
            await commission.save({ session: newSession });
          })
        );

        // SAVE COMMISSION
        const commission = await super.create(data, newSession);

        // HANDLE ASSET ROSTER STATUS
        await this.assetRosterStatusService.updateAssetRosterStatus(
          commission.assetRosterId._id,
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
            model: "AssetCommissioning",
            modelId: commission._id,
            metadata: {
              assetRosterId: commission.assetRosterId._id.toString(),
            },
          },
          newSession
        );

        return commission;
      }
    );
  }

  override async update(
    data: UpdateAssetCommissioningDTO,
    session?: ClientSession | undefined
  ): Promise<AssetCommissioningDocument> {
    return runTransaction<AssetCommissioningDocument>(
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

        // SAVE COMMISSION
        const commission = await super.update(data, newSession);

        // HANDLE ASSET ROSTER STATUS
        await this.assetRosterStatusService.updateAssetRosterStatus(
          commission.assetRosterId._id,
          newSession
        );

        return commission;
      }
    );
  }

  async updateDecommission(
    data: UpdateAssetCommissioningDTO,
    session?: ClientSession | undefined
  ) {
    return runTransaction<AssetCommissioningDocument>(
      session,
      async (newSession) => {
        const commission = await this.update(
          { ...data, active: false },
          newSession
        );

        await this.assetRosterService.update(
          { _id: commission.assetRosterId._id, status: "decommissioned" },
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
            model: "AssetCommissioning",
            modelId: commission._id,
            metadata: {
              assetRosterId: commission.assetRosterId._id.toString(),
            },
          },
          newSession
        );

        return commission;
      }
    );
  }

  override async delete(
    _id: string,
    session?: ClientSession | undefined
  ): Promise<boolean> {
    return runTransaction<boolean>(session, async (newSession) => {
      const commission = (
        await super.get({ _id }, undefined, undefined, false, newSession)
      )[0];

      const deleted = await super.delete(_id, newSession);

      await this.assetRosterStatusService.updateAssetRosterStatus(
        commission.assetRosterId._id,
        newSession
      );

      return deleted;
    });
  }
}
