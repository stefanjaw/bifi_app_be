import mongoose, { ClientSession, PaginateModel } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import { contactModel } from "../models/contact.model";
import { ContactDTO, UpdateContactDTO } from "../models/contact.dto";
import { ContactDocument, CountryDocument } from "@mongodb-types";

export class ContactService extends BaseService<ContactDocument> {
  constructor() {
    super({
      model: contactModel,
      refFields: [
        {
          path: "parentId",
          getModel: () => contactModel,
          isArray: false,
        },
        {
          path: "countryId",
          getModel: () =>
            mongoose.model("Country") as PaginateModel<CountryDocument>,
          isArray: false,
        },
      ],
    });
  }

  override async create(
    data: ContactDTO,
    session?: ClientSession | undefined
  ): Promise<ContactDocument> {
    return await runTransaction<ContactDocument>(session, async (session) => {
      // first create the contact
      const createdContact = await super.create(data, session);

      // if childIds are provided, update the parentId of those contacts
      if (data.childIds && data.childIds.length > 0) {
        await contactModel.updateMany(
          { _id: { $in: data.childIds } },
          { parentId: createdContact._id },
          { session }
        );
      }

      return createdContact;
    });
  }

  override async update(
    data: UpdateContactDTO,
    session?: ClientSession | undefined
  ): Promise<ContactDocument> {
    return await runTransaction<ContactDocument>(session, async (session) => {
      // first find the existing contact to get the current childIds
      const existingContact = await this.model
        .findById(data._id)
        .session(session);

      if (!existingContact) {
        throw new Error("Contact not found");
      }

      if (data.childIds) {
        // Find childIds that are being removed
        const removedChildIds =
          existingContact.childIds?.filter(
            (child: ContactDocument) =>
              !data.childIds?.includes(child._id.toString())
          ) || [];

        // Set parentId to null for removed childIds
        if (removedChildIds.length > 0) {
          await contactModel.updateMany(
            { _id: { $in: removedChildIds } },
            { parentId: null },
            { session }
          );
        }

        // Find new childIds that are being added
        const newChildIds =
          data.childIds?.filter(
            (id) => !existingContact.childIds?.includes(id)
          ) || [];

        // Set parentId to current contact's _id for new childIds
        if (newChildIds.length > 0) {
          await contactModel.updateMany(
            { _id: { $in: newChildIds } },
            { parentId: data._id },
            { session }
          );
        }
      }

      delete data.childIds; // Remove childIds from data to prevent direct update

      // Then update the contact itself
      const updatedContact = await super.update(data, session);
      return updatedContact;
    });
  }
}
