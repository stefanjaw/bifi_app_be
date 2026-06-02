import { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import {
  subscriberModel,
  SubscriberDocument,
} from "../models/subscriber.model";
import { contactModel } from "../../contacts/models/contact.model";

export class SubscriberService extends BaseService<SubscriberDocument> {
  constructor() {
    super({
      model: subscriberModel,
    });
  }

  /**
   * Imports the given contacts into a mailing list as subscribers.
   * Skips contacts without an email and de-duplicates by (email, listId).
   * Does NOT mutate the Contact model — only references it via contactId.
   */
  async importFromContacts(
    listId: string,
    contactIds: string[] | undefined,
    session?: ClientSession
  ): Promise<{ imported: number; skipped: number }> {
    return await runTransaction(session, async (newSession) => {
      const subModel = this.connectionManager.bindModelToDb(this.model);
      const cModel = this.connectionManager.bindModelToDb(contactModel);

      const filter: Record<string, any> = {};
      if (contactIds && contactIds.length > 0) {
        filter._id = { $in: contactIds };
      }

      const contacts = await cModel.find(filter).session(newSession);

      let imported = 0;
      let skipped = 0;

      for (const contact of contacts as any[]) {
        const email = contact.email;
        if (!email) {
          skipped++;
          continue;
        }
        const exists = await subModel
          .findOne({ email: email.toLowerCase(), listId })
          .session(newSession);
        if (exists) {
          skipped++;
          continue;
        }
        const name = [contact.name, contact.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        await subModel.create(
          [
            {
              email,
              name,
              listId,
              contactId: contact._id,
              status: "subscribed",
            },
          ],
          { session: newSession }
        );
        imported++;
      }

      return { imported, skipped };
    });
  }
}
