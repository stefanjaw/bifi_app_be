import { ClientSession } from "mongoose";
import {
  BaseService,
  NotFoundException,
  runTransaction,
} from "../../../system";
import { contactModel } from "../models/contact.model";
import { ContactDTO, UpdateContactDTO } from "../models/contact.dto";
import { ContactDocument, CountryDocument } from "@mongodb-types";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";

/** Business logic service for contact operations, including photo upload and child-parent relationship management */
export class ContactService extends BaseService<ContactDocument> {
  constructor() {
    super({
      model: contactModel,
      refFields: [
        {
          path: "parentId",
          getModel: () =>
            this.connectionManager.getModel<ContactDocument>("Contact"),
          isArray: false,
        },
        {
          path: "countryId",
          getModel: () =>
            this.connectionManager.getModel<CountryDocument>("Country"),
          isArray: false,
        },
      ],
    });
  }

  /**
   * Creates a new contact. If childIds are provided, updates the parentId of those contacts.
   * Handles photo file upload if provided.
   * @param data The contact data to create.
   * @param session The optional client session to use for the transaction.
   * @returns A promise resolving to the created contact document.
   */
  override async create(
    data: ContactDTO,
    session?: ClientSession | undefined,
  ): Promise<ContactDocument> {
    return await runTransaction<ContactDocument>(session, async (session) => {
      const model = this.connectionManager.bindModelToDb(this.model);
      const bucket = this.connectionManager.bindBucketToDb();

      if (isValidFileUpload(data.photo)) {
        const fileId = await bucket.uploadFile(
          Array.isArray(data.photo) ? data.photo[0] : data.photo,
        );
        data.photo = fileId;
      } else {
        delete (data as any).photo;
      }

      const createdContact = await super.create(data, session);

      if (data.childIds && data.childIds.length > 0) {
        await model.updateMany(
          { _id: { $in: data.childIds } },
          { parentId: createdContact._id },
          { session },
        );
      }

      return createdContact;
    });
  }

  /**
   * Updates an existing contact. If childIds are provided, updates the parentId of those contacts.
   * Handles photo file upload if provided.
   * @param data The contact data to update.
   * @param session The optional client session to use for the transaction.
   * @returns A promise resolving to the updated contact document.
   */
  override async update(
    data: UpdateContactDTO,
    session?: ClientSession | undefined,
  ): Promise<ContactDocument> {
    return await runTransaction<ContactDocument>(session, async (session) => {
      const model = this.connectionManager.bindModelToDb(this.model);
      const bucket = this.connectionManager.bindBucketToDb();

      const existingContact = await this.getById(data._id, session);

      if (!existingContact) {
        throw new NotFoundException("Contact not found");
      }

      let photo = data.photo;

      if (isValidFileUpload(photo)) {
        const fileId = await bucket.uploadFile(
          Array.isArray(photo) ? photo[0] : photo,
        );
        photo = fileId;
      } else if (photo !== undefined) {
        photo = null;
      }

      data.photo = photo;

      if (data.childIds) {
        const removedChildIds =
          existingContact.childIds?.filter(
            (child: ContactDocument) =>
              !data.childIds?.includes(child._id.toString()),
          ) || [];

        if (removedChildIds.length > 0) {
          await model.updateMany(
            { _id: { $in: removedChildIds } },
            { parentId: null },
            { session },
          );
        }

        const newChildIds =
          data.childIds?.filter(
            (id) =>
              !existingContact.childIds?.some(
                (child) => child._id.toString() === id,
              ),
          ) || [];

        if (newChildIds.length > 0) {
          await model.updateMany(
            { _id: { $in: newChildIds } },
            { parentId: data._id },
            { session },
          );
        }
      }

      delete data.childIds;

      if (data.parentId === '') {
        (data as any).parentId = null;
      }

      const updatedContact = await super.update(data, session);
      return updatedContact;
    });
  }
}
