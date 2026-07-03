import { BaseService } from "../../../system";
import {
  userShortcutsModel,
  UserShortcutsDocument,
} from "../models/user-shortcuts.model";
import { ShortcutItemDTO } from "../models/user-shortcuts.dto";
import mongoose from "mongoose";

export class UserShortcutsService extends BaseService<UserShortcutsDocument> {
  constructor() {
    super({ model: userShortcutsModel });
  }

  async getMyShortcuts(
    userId: mongoose.Types.ObjectId,
  ): Promise<UserShortcutsDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOne({ userId });
  }

  async upsertMyShortcuts(
    userId: mongoose.Types.ObjectId,
    shortcuts: ShortcutItemDTO[],
  ): Promise<UserShortcutsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findOneAndUpdate(
      { userId },
      { $set: { userId, shortcuts } },
      { upsert: true, new: true },
    ) as Promise<UserShortcutsDocument>;
  }
}
