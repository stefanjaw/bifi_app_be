import { BaseService } from "../../../system";
import {
  emailCampaignModel,
  EmailCampaignDocument,
} from "../models/email-campaign.model";

export class EmailCampaignService extends BaseService<EmailCampaignDocument> {
  constructor() {
    super({
      model: emailCampaignModel,
    });
  }

  async setSchedule(
    campaignId: string,
    scheduledAt: Date,
  ): Promise<EmailCampaignDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findByIdAndUpdate(
      campaignId,
      { status: "scheduled", scheduledAt },
      { new: true },
    );
  }

  async cancel(campaignId: string): Promise<EmailCampaignDocument | null> {
    const model = this.connectionManager.bindModelToDb(this.model);
    return model.findByIdAndUpdate(
      campaignId,
      { status: "cancelled" },
      { new: true },
    );
  }

  /**
   * Aggregated KPIs for the email marketing dashboard.
   */
  async dashboard(): Promise<Record<string, any>> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const campaigns = await model.find({ active: true }).lean();

    const totals = {
      campaigns: campaigns.length,
      sentCampaigns: 0,
      recipients: 0,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
    };

    for (const c of campaigns as any[]) {
      if (c.status === "sent") totals.sentCampaigns++;
      const s = c.stats || {};
      totals.recipients += s.recipients || 0;
      totals.sent += s.sent || 0;
      totals.delivered += s.delivered || 0;
      totals.opened += s.opened || 0;
      totals.clicked += s.clicked || 0;
      totals.bounced += s.bounced || 0;
      totals.unsubscribed += s.unsubscribed || 0;
    }

    const openRate = totals.sent > 0 ? (totals.opened / totals.sent) * 100 : 0;
    const clickRate =
      totals.sent > 0 ? (totals.clicked / totals.sent) * 100 : 0;

    const recent = (campaigns as any[])
      .sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime(),
      )
      .slice(0, 5)
      .map((c) => ({
        _id: c._id,
        name: c.name,
        subject: c.subject,
        status: c.status,
        sentAt: c.sentAt,
        stats: c.stats,
      }));

    return {
      ...totals,
      openRate: Math.round(openRate * 10) / 10,
      clickRate: Math.round(clickRate * 10) / 10,
      recentCampaigns: recent,
    };
  }
}
