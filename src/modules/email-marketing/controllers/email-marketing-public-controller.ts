import { NextFunction, Request, Response } from "express";
import { ConnectionManager } from "../../../system";
import { emailEventModel } from "../models/email-event.model";
import { emailCampaignModel } from "../models/email-campaign.model";
import { subscriberModel } from "../models/subscriber.model";
import { emailSettingsModel } from "../models/email-settings.model";
import { verifyUnsubscribeToken } from "../libraries/unsubscribe-token";

const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64",
);

// type -> stats field map
const STAT_FIELD: Record<string, string> = {
  delivered: "delivered",
  open: "opened",
  click: "clicked",
  bounce: "bounced",
  complaint: "complained",
  unsubscribe: "unsubscribed",
};

export class EmailMarketingPublicController {
  private connectionManager = new ConnectionManager();

  private async incrementStat(campaignId: any, type: string) {
    const field = STAT_FIELD[type];
    if (!campaignId || !field) return;
    const campaigns = this.connectionManager.bindModelToDb(emailCampaignModel);
    await campaigns.findByIdAndUpdate(campaignId, {
      $inc: { [`stats.${field}`]: 1 },
    });
  }

  private async recordEvent(data: Record<string, any>) {
    const events = this.connectionManager.bindModelToDb(emailEventModel);
    await events.create([data]);
    await this.incrementStat(data.campaignId, data.type);
  }

  trackOpen = async (req: Request, res: Response) => {
    try {
      const campaignId = req.query.c as string;
      const subscriberId = req.query.s as string;
      if (campaignId && subscriberId) {
        await this.recordEvent({
          campaignId,
          subscriberId,
          type: "open",
        });
      }
    } catch {
      // never fail a tracking pixel
    }
    res.setHeader("Content-Type", "image/gif");
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
    res.end(TRANSPARENT_GIF);
  };

  trackClick = async (req: Request, res: Response) => {
    const url = (req.query.u as string) || "";
    try {
      const campaignId = req.query.c as string;
      const subscriberId = req.query.s as string;
      if (campaignId && subscriberId) {
        await this.recordEvent({
          campaignId,
          subscriberId,
          type: "click",
          url,
        });
      }
    } catch {
      // ignore
    }
    if (url && /^https?:\/\//i.test(url)) {
      res.redirect(url);
    } else {
      res.status(400).send("Invalid link");
    }
  };

  unsubscribe = async (req: Request, res: Response) => {
    const token = req.query.token as string;
    const payload = verifyUnsubscribeToken(token);
    if (!payload) {
      res
        .status(400)
        .send(
          this.htmlPage(
            "Invalid link",
            "This unsubscribe link is invalid or has expired.",
          ),
        );
      return;
    }
    try {
      const subscribers = this.connectionManager.bindModelToDb(subscriberModel);
      const sub = await subscribers.findByIdAndUpdate(payload.subscriberId, {
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      });
      await this.recordEvent({
        campaignId: payload.campaignId,
        subscriberId: payload.subscriberId,
        email: (sub as any)?.email,
        type: "unsubscribe",
      });
      res.send(
        this.htmlPage(
          "You're unsubscribed",
          "You have been removed from this mailing list and will no longer receive these emails.",
        ),
      );
    } catch {
      res
        .status(500)
        .send(this.htmlPage("Something went wrong", "Please try again later."));
    }
  };

  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const provider = req.params.provider;
      const events = this.normalizeWebhook(provider, req.body);
      for (const ev of events) {
        await this.handleNormalizedEvent(ev);
      }
      res.status(200).json({ received: events.length });
    } catch (error) {
      next(error);
    }
  };

  private async handleNormalizedEvent(ev: {
    type: string;
    email?: string;
    messageId?: string;
  }) {
    if (!ev.type) return;
    const events = this.connectionManager.bindModelToDb(emailEventModel);

    // Try to link to the original "sent" event to recover campaign/subscriber.
    let campaignId: any;
    let subscriberId: any;
    if (ev.messageId) {
      const origin = await events.findOne({
        providerMessageId: ev.messageId,
        type: "sent",
      });
      if (origin) {
        campaignId = (origin as any).campaignId;
        subscriberId = (origin as any).subscriberId;
      }
    }

    await this.recordEvent({
      campaignId,
      subscriberId,
      email: ev.email,
      type: ev.type,
      providerMessageId: ev.messageId || "",
    });

    if ((ev.type === "bounce" || ev.type === "complaint") && subscriberId) {
      const subscribers = this.connectionManager.bindModelToDb(subscriberModel);
      await subscribers.findByIdAndUpdate(subscriberId, {
        status: ev.type === "bounce" ? "bounced" : "complained",
        bouncedAt: new Date(),
      });
    }
    if (ev.type === "unsubscribe" && subscriberId) {
      const subscribers = this.connectionManager.bindModelToDb(subscriberModel);
      await subscribers.findByIdAndUpdate(subscriberId, {
        status: "unsubscribed",
        unsubscribedAt: new Date(),
      });
    }
  }

  private normalizeWebhook(
    provider: string,
    body: any,
  ): { type: string; email?: string; messageId?: string }[] {
    const out: { type: string; email?: string; messageId?: string }[] = [];
    if (!body) return out;

    if (provider === "resend") {
      const map: Record<string, string> = {
        "email.delivered": "delivered",
        "email.opened": "open",
        "email.clicked": "click",
        "email.bounced": "bounce",
        "email.complained": "complaint",
      };
      const type = map[body.type];
      if (type) {
        out.push({
          type,
          email: body.data?.to?.[0] || body.data?.to,
          messageId: body.data?.email_id,
        });
      }
    } else if (provider === "sendgrid") {
      const map: Record<string, string> = {
        delivered: "delivered",
        open: "open",
        click: "click",
        bounce: "bounce",
        dropped: "failed",
        spamreport: "complaint",
        unsubscribe: "unsubscribe",
        group_unsubscribe: "unsubscribe",
      };
      const arr = Array.isArray(body) ? body : [body];
      for (const e of arr) {
        const type = map[e.event];
        if (type)
          out.push({
            type,
            email: e.email,
            messageId: (e.sg_message_id || "").split(".")[0],
          });
      }
    } else if (provider === "mailgun") {
      const data = body["event-data"] || body;
      const map: Record<string, string> = {
        delivered: "delivered",
        opened: "open",
        clicked: "click",
        failed: "bounce",
        complained: "complaint",
        unsubscribed: "unsubscribe",
      };
      const type = map[data.event];
      if (type)
        out.push({
          type,
          email: data.recipient,
          messageId: data.message?.headers?.["message-id"],
        });
    } else if (provider === "ses") {
      // Amazon SES via SNS
      let message = body;
      if (typeof body.Message === "string") {
        try {
          message = JSON.parse(body.Message);
        } catch {
          message = body;
        }
      }
      const map: Record<string, string> = {
        Delivery: "delivered",
        Open: "open",
        Click: "click",
        Bounce: "bounce",
        Complaint: "complaint",
      };
      const type = map[message.eventType || message.notificationType];
      if (type)
        out.push({
          type,
          email: message.mail?.destination?.[0],
          messageId: message.mail?.messageId,
        });
    }

    return out;
  }

  private htmlPage(title: string, message: string): string {
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title><style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#1e293b;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}.card{background:#fff;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.08);padding:40px;max-width:440px;text-align:center}h1{font-size:20px;margin:0 0 12px}p{color:#64748b;line-height:1.5;margin:0}</style></head><body><div class="card"><h1>${title}</h1><p>${message}</p></div></body></html>`;
  }
}
