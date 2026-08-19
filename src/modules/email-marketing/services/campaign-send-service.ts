import {
  BaseService,
  NotFoundException,
  ValidationException,
  userStorage,
} from "../../../system";
import {
  emailCampaignModel,
  EmailCampaignDocument,
} from "../models/email-campaign.model";
import {
  subscriberModel,
  SubscriberDocument,
} from "../models/subscriber.model";
import { emailEventModel } from "../models/email-event.model";
import { EmailSettingsService } from "./email-settings-service";
import { createSender } from "../senders/sender-factory";
import { EmailSettingsDocument } from "../models/email-settings.model";
import {
  createUnsubscribeToken,
  signValue,
} from "../libraries/unsubscribe-token";

export interface SendSummary {
  recipients: number;
  sent: number;
  failed: number;
}

export class CampaignSendService extends BaseService<EmailCampaignDocument> {
  private settingsService = new EmailSettingsService();

  constructor() {
    super({
      model: emailCampaignModel,
    });
  }

  resolveBaseUrl(settings: EmailSettingsDocument | null): string {
    const fromSettings = settings?.publicBaseUrl?.trim();
    if (fromSettings) return fromSettings.replace(/\/$/, "");
    const env =
      process.env.PUBLIC_BASE_URL ||
      (process.env.REPLIT_DEV_DOMAIN
        ? `https://${process.env.REPLIT_DEV_DOMAIN}`
        : "");
    return env.replace(/\/$/, "");
  }

  /**
   * Injects unsubscribe link, open-tracking pixel and click-tracking into the
   * campaign HTML for a specific subscriber.
   */
  personalize(
    html: string,
    opts: {
      baseUrl: string;
      campaignId: string;
      subscriber: SubscriberDocument;
      trackOpens: boolean;
      trackClicks: boolean;
      /** Tenant DB name — embedded in signed tokens/URLs for public route resolution. (H11) */
      dbName?: string;
    },
  ): string {
    const { baseUrl, campaignId, subscriber, trackOpens, trackClicks, dbName } =
      opts;
    const sid = String(subscriber._id);
    const token = createUnsubscribeToken({
      subscriberId: sid,
      campaignId,
      dbName,
    });
    const unsubscribeUrl = `${baseUrl}/api/email-marketing/unsubscribe?token=${encodeURIComponent(
      token,
    )}`;

    let out = html || "";

    // Replace common merge tags.
    out = out
      .replace(/{{\s*unsubscribe_url\s*}}/gi, unsubscribeUrl)
      .replace(/{{\s*email\s*}}/gi, subscriber.email || "")
      .replace(/{{\s*name\s*}}/gi, subscriber.name || "");

    if (baseUrl && trackClicks) {
      out = out.replace(
        /<a\b([^>]*?)href=["']((?:https?:)\/\/[^"']+)["']/gi,
        (match, pre, url) => {
          if (url.includes("/api/email-marketing/")) return match;
          // Sign the destination URL (H13) and the DB name (H11).
          const dbSig = dbName
            ? `&db=${encodeURIComponent(dbName)}&dsig=${encodeURIComponent(signValue(`${dbName}:${campaignId}:${url}`))}`
            : "";
          const urlSig = signValue(url);
          const tracked = `${baseUrl}/api/email-marketing/track/click?c=${campaignId}&s=${sid}${dbSig}&u=${encodeURIComponent(
            url,
          )}&usig=${encodeURIComponent(urlSig)}`;
          return `<a ${pre}href="${tracked}"`;
        },
      );
    }

    // Ensure an unsubscribe footer link exists.
    if (!/unsubscribe/i.test(out)) {
      const footer = `<div style="font-size:12px;color:#888;text-align:center;padding:16px;">If you no longer wish to receive these emails you can <a href="${unsubscribeUrl}">unsubscribe</a>.</div>`;
      out = /<\/body>/i.test(out)
        ? out.replace(/<\/body>/i, `${footer}</body>`)
        : out + footer;
    }

    if (baseUrl && trackOpens) {
      // Open pixel also carries the signed DB name (H11).
      const dbParam = dbName
        ? `&db=${encodeURIComponent(dbName)}&dsig=${encodeURIComponent(signValue(`${dbName}:${campaignId}:open`))}`
        : "";
      const pixel = `<img src="${baseUrl}/api/email-marketing/track/open?c=${campaignId}&s=${sid}${dbParam}" width="1" height="1" alt="" style="display:none" />`;
      out = /<\/body>/i.test(out)
        ? out.replace(/<\/body>/i, `${pixel}</body>`)
        : out + pixel;
    }

    return out;
  }

  async sendTest(
    campaignId: string,
    toEmail: string,
  ): Promise<{ success: boolean; error?: string }> {
    const campaignModelBound = this.connectionManager.bindModelToDb(this.model);
    const campaign = await campaignModelBound.findById(campaignId);
    if (!campaign) return { success: false, error: "Campaign not found." };

    const settings = await this.settingsService.getSettings();
    if (!settings)
      return { success: false, error: "Email settings are not configured." };

    const sender = createSender(settings);
    const fromEmail = campaign.fromEmail || settings.fromEmail || "";
    const fromName = campaign.fromName || settings.fromName || "";
    if (!fromEmail)
      return { success: false, error: "A from email address is required." };

    const html = this.personalize(campaign.html || "", {
      baseUrl: this.resolveBaseUrl(settings),
      campaignId: String(campaign._id),
      subscriber: { _id: "test", email: toEmail } as any,
      trackOpens: false,
      trackClicks: false,
      dbName: userStorage.getStore()?.dbName,
    });

    const result = await sender.send({
      to: toEmail,
      fromEmail,
      fromName,
      replyTo: campaign.replyTo || settings.replyTo,
      subject: `[TEST] ${campaign.subject || ""}`,
      html,
    });

    return { success: result.success, error: result.error };
  }

  /**
   * Sends a campaign to all subscribed members of its lists. Updates stats and
   * records per-recipient events.
   * @param campaignId - The ID of the campaign to send.
   * @returns A promise resolving to a SendSummary with success/error info.
   */
  async sendNow(campaignId: string): Promise<SendSummary> {
    const campaignModelBound = this.connectionManager.bindModelToDb(this.model);
    const subModelBound = this.connectionManager.bindModelToDb(subscriberModel);
    const eventModelBound =
      this.connectionManager.bindModelToDb(emailEventModel);

    const campaign = await campaignModelBound.findById(campaignId);
    if (!campaign) throw new NotFoundException("Campaign not found.");
    if (campaign.status === "sending" || campaign.status === "sent")
      throw new ValidationException(`Campaign is already ${campaign.status}.`);

    const settings = await this.settingsService.getSettings();
    if (!settings)
      throw new NotFoundException("Email settings are not configured.");

    const fromEmail = campaign.fromEmail || settings.fromEmail || "";
    const fromName = campaign.fromName || settings.fromName || "";
    if (!fromEmail)
      throw new ValidationException("A from email address is required.");

    const sender = createSender(settings);
    const baseUrl = this.resolveBaseUrl(settings);

    const listIds = (campaign.listIds || []).map((l: any) => l?._id || l);
    const subscribers = (await subModelBound.find({
      listId: { $in: listIds },
      status: "subscribed",
      active: true,
    })) as SubscriberDocument[];

    // De-duplicate by email across overlapping lists.
    const seen = new Set<string>();
    const recipients = subscribers.filter((s) => {
      const key = (s.email || "").toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    campaign.status = "sending";
    campaign.stats = {
      ...(campaign.stats || {}),
      recipients: recipients.length,
      sent: 0,
      failed: 0,
    };
    await campaign.save();

    let sent = 0;
    let failed = 0;

    for (const subscriber of recipients) {
      const target = settings.testMode
        ? settings.testRecipient || subscriber.email
        : subscriber.email;
      if (!target) {
        failed++;
        continue;
      }

      const html = this.personalize(campaign.html || "", {
        baseUrl,
        campaignId: String(campaign._id),
        subscriber,
        trackOpens: settings.trackOpens !== false,
        trackClicks: settings.trackClicks !== false,
        dbName: userStorage.getStore()?.dbName,
      });

      const result = await sender.send({
        to: target,
        fromEmail,
        fromName,
        replyTo: campaign.replyTo || settings.replyTo,
        subject: campaign.subject || "",
        html,
      });

      await eventModelBound.create([
        {
          campaignId: campaign._id,
          subscriberId: subscriber._id,
          email: subscriber.email,
          type: result.success ? "sent" : "failed",
          providerMessageId: result.messageId || "",
          meta: result.success ? {} : { error: result.error },
        },
      ]);

      if (result.success) sent++;
      else failed++;
    }

    campaign.stats = {
      ...(campaign.stats || {}),
      recipients: recipients.length,
      sent,
      failed,
    };
    campaign.status = failed > 0 && sent === 0 ? "failed" : "sent";
    campaign.sentAt = new Date();
    await campaign.save();

    return { recipients: recipients.length, sent, failed };
  }

  /**
   * Processes any campaigns whose scheduled time has passed. Safe to call on an
   * interval; failures are swallowed per-campaign so the loop never crashes.
   */
  async processScheduled(): Promise<void> {
    const campaignModelBound = this.connectionManager.bindModelToDb(this.model);
    const due = await campaignModelBound.find({
      status: "scheduled",
      scheduledAt: { $lte: new Date() },
      active: true,
    });
    for (const campaign of due) {
      try {
        await this.sendNow(String(campaign._id));
      } catch (err) {
        console.error(
          `[email-marketing] failed to send scheduled campaign ${campaign._id}:`,
          err,
        );
      }
    }
  }
}

let schedulerStarted = false;

/**
 * Starts a lightweight in-process scheduler that dispatches due campaigns once
 * per minute. Defensive: never throws into the caller.
 */
export function startCampaignScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  const service = new CampaignSendService();
  setInterval(() => {
    service.processScheduled().catch((err) => {
      console.error("[email-marketing] scheduler error:", err);
    });
  }, 60 * 1000);
}
