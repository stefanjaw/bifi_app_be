import { BaseRoutes } from "../../../system";
import { authorizeMiddleware } from "../../../system";
import { SubscriberController } from "../controllers/subscriber-controller";
import { SubscriberDTO, UpdateSubscriberDTO } from "../models/subscriber.dto";
import { SubscriberDocument } from "../models/subscriber.model";

const subscriberController = new SubscriberController();

export class SubscriberRouter extends BaseRoutes<SubscriberDocument> {
  constructor() {
    super({
      controller: subscriberController,
      endpoint: "/subscribers",
      dtoCreateClass: SubscriberDTO,
      dtoUpdateClass: UpdateSubscriberDTO,
    });
  }

  protected override initRoutes() {
    this.router.post(
      "/subscribers/import-from-contacts",
      authorizeMiddleware("subscribers", "create"),
      subscriberController.importFromContacts,
    );
    super.initRoutes();
  }
}
