import { BaseService } from "../../../system";
import {
  mailingListModel,
  MailingListDocument,
} from "../models/mailing-list.model";
import { subscriberModel } from "../models/subscriber.model";

export class MailingListService extends BaseService<MailingListDocument> {
  constructor() {
    super({
      model: mailingListModel,
    });
  }

  /**
   * Recomputes the cached subscriber count (status subscribed) for a list.
   */
  async refreshSubscriberCount(listId: string): Promise<number> {
    const listModelBound = this.connectionManager.bindModelToDb(this.model);
    const subModelBound = this.connectionManager.bindModelToDb(subscriberModel);
    const count = await subModelBound.countDocuments({
      listId,
      status: "subscribed",
      active: true,
    });
    await listModelBound.findByIdAndUpdate(listId, {
      subscriberCount: count,
    });
    return count;
  }
}
