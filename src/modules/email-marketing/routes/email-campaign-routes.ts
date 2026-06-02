import { BaseRoutes } from "../../../system";
import { authorizeMiddleware } from "../../../system";
import { EmailCampaignController } from "../controllers/email-campaign-controller";
import {
  EmailCampaignDTO,
  UpdateEmailCampaignDTO,
} from "../models/email-campaign.dto";
import { EmailCampaignDocument } from "../models/email-campaign.model";

const emailCampaignController = new EmailCampaignController();

export class EmailCampaignRouter extends BaseRoutes<EmailCampaignDocument> {
  constructor() {
    super({
      controller: emailCampaignController,
      endpoint: "/email-campaigns",
      dtoCreateClass: EmailCampaignDTO,
      dtoUpdateClass: UpdateEmailCampaignDTO,
    });
  }

  protected override initRoutes() {
    // Register specific routes before the generic /:id route.
    this.router.get(
      "/email-campaigns/dashboard",
      authorizeMiddleware("email-campaigns", "read"),
      emailCampaignController.dashboard
    );

    this.router.post(
      "/email-campaigns/:id/send-test",
      authorizeMiddleware("email-campaigns", "update"),
      emailCampaignController.sendTest
    );

    this.router.post(
      "/email-campaigns/:id/send-now",
      authorizeMiddleware("email-campaigns", "update"),
      emailCampaignController.sendNow
    );

    this.router.post(
      "/email-campaigns/:id/schedule",
      authorizeMiddleware("email-campaigns", "update"),
      emailCampaignController.schedule
    );

    this.router.post(
      "/email-campaigns/:id/cancel",
      authorizeMiddleware("email-campaigns", "update"),
      emailCampaignController.cancel
    );

    super.initRoutes();
  }
}
