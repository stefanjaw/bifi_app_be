import { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import { AssetTypeDocument } from "../../../types/mongoose.gen";
import { assetTypeModel } from "../models/asset-type.model";

export class AssetTypeService extends BaseService<AssetTypeDocument> {
  constructor() {
    super({ model: assetTypeModel });
  }

  /**
   * Soft-deletes an asset type and removes its reference from any asset rosters
   * that reference it via assetTypeIds.
   * @param _id - The ID of the asset type to delete.
   * @param session - Optional client session for transaction.
   * @returns Whether the deletion was successful.
   */
  override async delete(
    _id: string,
    session?: ClientSession | undefined,
  ): Promise<boolean> {
    return runTransaction<boolean>(session, async (newSession) => {
      const AssetRoster = this.connectionManager.getModel("AssetRoster");
      await AssetRoster.updateMany(
        { assetTypeIds: _id, active: true },
        { $pull: { assetTypeIds: _id } },
        { session: newSession },
      );

      return await super.delete(_id, newSession);
    });
  }
}
