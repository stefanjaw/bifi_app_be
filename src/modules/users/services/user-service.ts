import { ContactDocument, RoleDocument, UserDocument } from "@mongodb-types";
import {
  BaseService,
  isValidFileUpload,
  runTransaction,
  userStorage,
  ValidationException,
} from "../../../system";
import { userModel } from "../models/user.model";
import mongoose, { ClientSession } from "mongoose";
import admin from "firebase-admin";
import { UpdateUserDTO, UserDTO } from "../models/user.dto";
import { ContactService } from "../../contacts/services/contact-service";

export class UserService extends BaseService<UserDocument> {
  private contactService = new ContactService();

  constructor() {
    super({
      model: userModel,
      refFields: [
        {
          path: "roles",
          getModel: () => this.connectionManager.getModel<RoleDocument>("Role"),
          isArray: true,
        },
        {
          path: "contactId",
          getModel: () =>
            this.connectionManager.getModel<ContactDocument>("Contact"),
          isArray: false,
        },
      ],
    });
  }

  /**
   * Explicitly populates roles and their nested policyId references on one
   * or many UserDocuments. Called after every direct UserService query because
   * roles autopopulate is disabled on the schema — this prevents roles from
   * being pulled in when User is loaded as a nested ref inside tasks/tickets.
   */
  private async _populateRoles(
    users: UserDocument | UserDocument[],
  ): Promise<void> {
    const arr = Array.isArray(users) ? users : [users];
    if (arr.length === 0) return;
    await userModel.populate(arr, {
      path: "roles",
      populate: { path: "policies.policyId" },
    });
  }

  /**
   * Retrieves a user by id and explicitly populates roles+policies.
   */
  override async getById(
    id: string,
    session: ClientSession | undefined,
  ): Promise<UserDocument | undefined> {
    const user = await super.getById(id, session);
    if (user) await this._populateRoles(user);
    return user;
  }

  /**
   * Creates a new user.
   * If contact information is provided without an _id, creates a new contact.
   * If contact information with an _id is provided, updates the existing contact.
   * If authId is not provided, and email and password are provided, creates user in firebase auth.
   * @param data The user data to create.
   * @param session The optional client session to use for the transaction.
   * @returns A promise resolving to the created user document.
   */
  override async create(
    data: UserDTO,
    session?: mongoose.ClientSession | undefined,
  ): Promise<UserDocument> {
    return await runTransaction<UserDocument>(session, async (newSession) => {
      let contactId: string | undefined = data.contactId;

      // If contact information is provided without an _id, create a new contact
      if (data.contactInformation && !data.contactInformation._id) {
        const newContact = await this.contactService.create(
          data.contactInformation,
          newSession,
        );

        contactId = newContact._id.toString();
      } else if (data.contactInformation && data.contactInformation._id) {
        // If contact information with an _id is provided, update the existing contact
        const updatedContact = await this.contactService.update(
          {
            ...data.contactInformation,
            type: "individual",
            _id: data.contactInformation._id,
          },
          newSession,
        );
        contactId = updatedContact._id.toString();
      }

      // create user is no authId is provided, and email and password are provided, create user in firebase auth
      if (!data.authId && data.email && data.password) {
        const userRecord = await admin.auth().createUser({
          email: data.email,
          password: data.password,
          displayName: data.username,
          photoURL: data.picture,
          // phoneNumber: data.contactInformation?.phoneNumber,
        });

        data.authId = userRecord.uid;
      }

      const userData: UserDTO = {
        ...data,
        contactId: contactId,
      };

      return await super.create(userData, newSession);
    });
  }

  /**
   * Updates an existing user.
   * If contact information is provided without an _id, creates a new contact.
   * If contact information with an _id is provided, updates the existing contact.
   * If a file is provided for uploadedPictureId, uploads it and stores the file ID in the user data.
   * @param data The user data to update.
   * @param session The optional client session to use for the transaction.
   * @returns A promise resolving to the updated user document.
   */
  override async update(
    data: UpdateUserDTO,
    session?: mongoose.ClientSession | undefined,
  ): Promise<UserDocument> {
    return await runTransaction<UserDocument>(session, async (newSession) => {
      const bucket = this.connectionManager.bindBucketToDb();

      // Prevent updating authId through this method
      if (data.authId) delete data.authId;

      let contactId: string | undefined = data.contactId;

      // If contact information is provided without an _id, create a new contact
      if (data.contactInformation && !data.contactInformation._id) {
        const newContact = await this.contactService.create(
          data.contactInformation,
          newSession,
        );

        contactId = newContact._id.toString();
      } else if (data.contactInformation && data.contactInformation._id) {
        // If contact information with an _id is provided, update the existing contact
        const updatedContact = await this.contactService.update(
          {
            ...data.contactInformation,
            type: "individual",
            _id: data.contactInformation._id,
          },
          newSession,
        );
        contactId = updatedContact._id.toString();
      }

      if (isValidFileUpload(data.uploadedPictureId)) {
        const fileId = await bucket.uploadFile(
          data.uploadedPictureId as Express.Multer.File,
        );

        data.uploadedPictureId = fileId;
      } else {
        delete data.uploadedPictureId;
      }

      const userData: UpdateUserDTO = {
        ...data,
        contactId: contactId,
      };

      return await super.update(userData, newSession);
    });
  }

  /**
   * Updates the profile of the logged user.
   * @param data The user data to update.
   * @param session The optional client session to use for the transaction.
   * @returns A promise resolving to the updated user document.
   * @throws ValidationException If the logged user tries to update a different user's profile.
   */
  /**
   * Updates the language preference of a user by ID.
   * @param userId - The user ID.
   * @param language - The new language/locale string.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to the updated user document.
   */
  async updateLanguage(
    userId: string,
    language: string,
    session?: mongoose.ClientSession | undefined,
  ): Promise<UserDocument> {
    return runTransaction<UserDocument>(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);
      const updated = await model.findByIdAndUpdate(
        userId,
        { $set: { language } },
        { new: true, session: newSession },
      );
      if (!updated) throw new ValidationException("User not found");
      return updated;
    });
  }

  async updateProfile(
    data: UpdateUserDTO,
    session?: mongoose.ClientSession | undefined,
  ): Promise<UserDocument> {
    return await runTransaction<UserDocument>(session, async (newSession) => {
      if (data._id !== userStorage.getStore()?.user?._id.toString())
        throw new ValidationException(
          "The logged user can update only the own profile",
        );

      return this.update(data, newSession);
    });
  }
}
