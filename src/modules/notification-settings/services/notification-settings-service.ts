import { BaseService } from "../../../system";
import {
  notificationSettingsModel,
  NotificationEventSettingsDocument,
} from "../models/notification-settings.model";
import { UpdateNotificationSettingsDTO } from "../models/notification-settings.dto";
import { GET_DEFAULT_EVENTS } from "../constants/event-catalog";

export class NotificationEventSettingsService extends BaseService<NotificationEventSettingsDocument> {
  constructor() {
    super({ model: notificationSettingsModel });
  }

  async getSettings(): Promise<{
    events: Array<{ type: string; enabled: boolean; recipients: string[] }>;
  }> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const doc = await model.findOne().lean();
    if (!doc || !doc.events || doc.events.length === 0) {
      return { events: GET_DEFAULT_EVENTS() };
    }
    return { events: (doc as any).events };
  }

  async upsertSettings(
    data: UpdateNotificationSettingsDTO
  ): Promise<NotificationEventSettingsDocument> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const existing = await model.findOne();
    if (existing) {
      existing.set({ events: data.events });
      return existing.save();
    }
    return (await model.create([data]))[0];
  }
}
