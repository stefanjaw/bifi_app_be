import { Router } from "express";
import { EmailMarketingPublicController } from "../controllers/email-marketing-public-controller";

/**
 * Public, unauthenticated routes for email marketing: open/click tracking,
 * unsubscribe landing page and ESP webhooks. This router MUST be mounted before
 * the global authenticate middleware in app.ts.
 */
export class EmailMarketingPublicRouter {
  private router = Router();
  private controller = new EmailMarketingPublicController();

  constructor() {
    this.initRoutes();
  }

  get getRouter() {
    return this.router;
  }

  private initRoutes() {
    this.router.get("/email-marketing/track/open", this.controller.trackOpen);
    this.router.get("/email-marketing/track/click", this.controller.trackClick);
    this.router.get(
      "/email-marketing/unsubscribe",
      this.controller.unsubscribe,
    );
    this.router.post(
      "/email-marketing/webhooks/:provider",
      this.controller.webhook,
    );
  }
}
