import { BaseService } from "../../../system";
import {
  notificationModel,
  NotificationDocument,
} from "../models/notification.model";
import mongoose from "mongoose";
import { NotificationEventSettingsService } from "../../notification-settings/services/notification-settings-service";

interface CachedSettings {
  events: Array<{ type: string; enabled: boolean; recipients: string[] }>;
}

let _settingsCache: CachedSettings | null = null;
let _settingsCacheAt = 0;
const CACHE_TTL_MS = 60_000;

async function getEventConfig(
  type: string
): Promise<{ enabled: boolean; recipients: string[] } | null> {
  const now = Date.now();
  if (!_settingsCache || now - _settingsCacheAt > CACHE_TTL_MS) {
    try {
      const svc = new NotificationEventSettingsService();
      _settingsCache = await svc.getSettings();
    } catch {
      return { enabled: true, recipients: [] };
    }
    _settingsCacheAt = now;
  }
  const entry = _settingsCache.events.find((e) => e.type === type);
  return entry ?? null;
}

export class NotificationService extends BaseService<NotificationDocument> {
  constructor() {
    super({ model: notificationModel });
  }

  async getMyNotifications(
    userId: mongoose.Types.ObjectId,
    limit = 20
  ): Promise<NotificationDocument[]> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model
      .find({ userId, active: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean() as unknown as NotificationDocument[];
  }

  async getUnreadCount(
    userId: mongoose.Types.ObjectId
  ): Promise<{ total: number; byModule: Record<string, number> }> {
    const model = this.connectionManager.bindModelToDb(this.model);

    // `total` = unseen count → drives the bell badge
    const unseen = await model
      .countDocuments({ userId, seen: false, active: true });

    // `byModule` = unread (read:false) count per module → drives tile badges
    const unread = await model
      .find({ userId, read: false, active: true })
      .select("module")
      .lean();

    const byModule: Record<string, number> = {};
    for (const n of unread) {
      const m = (n as any).module as string;
      if (m) byModule[m] = (byModule[m] ?? 0) + 1;
    }

    return { total: unseen, byModule };
  }

  async markAllSeen(userId: mongoose.Types.ObjectId): Promise<void> {
    const model = this.connectionManager.bindModelToDb(this.model);
    await model.updateMany({ userId, seen: false }, { seen: true });
  }

  async markAllRead(userId: mongoose.Types.ObjectId): Promise<void> {
    const model = this.connectionManager.bindModelToDb(this.model);
    await model.updateMany({ userId, read: false }, { read: true, seen: true });
  }

  async markRead(id: string): Promise<void> {
    const model = this.connectionManager.bindModelToDb(this.model);
    await model.findByIdAndUpdate(id, { read: true, seen: true });
  }
}

const _notificationServiceSingleton = new NotificationService();

/**
 * Fire-and-forget helper. Resolves which users to notify based on configured
 * recipients per event type, then creates one notification per unique userId.
 * Errors are swallowed so they never break the caller.
 *
 * @param payload.context - Map of recipientRoleId → userId for this event.
 *   e.g. { salesperson: '...', creator: '...' }
 *   The function picks roles listed in the event's saved recipients[] config.
 */
export async function fireNotification(payload: {
  type: string;
  context: Record<string, any>;
  title: string;
  body: string;
  link: string;
  module: string;
}): Promise<void> {
  try {
    const config = await getEventConfig(payload.type);
    // Default: enabled, notify the first context value if no config stored
    const enabled = config ? config.enabled : true;
    if (!enabled) return;

    const recipients = config?.recipients ?? [];
    let userIds: any[];

    if (recipients.length === 0) {
      // No recipient config — fall back to all non-null context values
      userIds = Object.values(payload.context).filter(Boolean);
    } else {
      userIds = recipients
        .map((roleId) => payload.context[roleId])
        .filter(Boolean);
    }

    // Deduplicate by string representation
    const seen = new Set<string>();
    const unique = userIds.filter((uid) => {
      const key = uid?.toString?.() ?? String(uid);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    await Promise.all(
      unique.map((userId) =>
        _notificationServiceSingleton.create({
          userId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          link: payload.link,
          module: payload.module,
          read: false,
          active: true,
        })
      )
    );
  } catch (e) {
    console.error("[Notification] Failed to create:", e);
  }
}
