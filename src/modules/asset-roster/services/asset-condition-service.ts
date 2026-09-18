import { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import { assetConditionModel } from "../models/asset-condition.model";
import { AssetConditionDocument } from "@mongodb-types";

export class AssetConditionService extends BaseService<AssetConditionDocument> {
  constructor() {
    super({ model: assetConditionModel });
  }

  /**
   * Soft-deletes an asset condition and clears its reference from any asset
   * rosters that currently reference it via conditionId.
   */
  override async delete(
    _id: string,
    session?: ClientSession | undefined,
  ): Promise<boolean> {
    return runTransaction<boolean>(session, async (newSession) => {
      const AssetRoster = this.connectionManager.getModel("AssetRoster");
      await AssetRoster.updateMany(
        { conditionId: _id, active: true },
        { $unset: { conditionId: "" } },
        { session: newSession },
      );

      return await super.delete(_id, newSession);
    });
  }
}
