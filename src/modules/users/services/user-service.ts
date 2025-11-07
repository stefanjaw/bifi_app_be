import { ContactDocument, RoleDocument, UserDocument } from "@mongodb-types";
import {
  BaseService,
  GridFSBucketService,
  isValidFileUpload,
  runTransaction,
} from "../../../system";
import { userModel } from "../models/user.model";
import mongoose from "mongoose";
import admin from "firebase-admin";
import { PaginateModel } from "mongoose";
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
          getModel: () => mongoose.model("Role") as PaginateModel<RoleDocument>,
          isArray: true,
        },
        {
          path: "contactId",
          getModel: () =>
            mongoose.model("Contact") as PaginateModel<ContactDocument>,
          isArray: false,
        },
      ],
    });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  /**
   * Creates a new user. If contact information is provided without an _id, a new contact will be created.
   * If contact information with an _id is provided, the existing contact will be updated.
   * And the contactId field of the user will be set to the created/updated contact's _id.
   *
   * @param data The user data to create. If contact information is provided without an _id, a new contact will be created.
   * @param session
   * @returns The created user document.
   */
  override async create(
    data: UserDTO,
    session?: mongoose.ClientSession | undefined
  ): Promise<UserDocument> {
    return await runTransaction<UserDocument>(session, async (newSession) => {
      let contactId: string | undefined = data.contactId;

      // If contact information is provided without an _id, create a new contact
      if (data.contactInformation && !data.contactInformation._id) {
        const newContact = await this.contactService.create(
          data.contactInformation,
          newSession
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
          newSession
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

  override async update(
    data: UpdateUserDTO,
    session?: mongoose.ClientSession | undefined
  ): Promise<UserDocument> {
    return await runTransaction<UserDocument>(session, async (newSession) => {
      // Prevent updating authId through this method
      if (data.authId) delete data.authId;

      let contactId: string | undefined = data.contactId;

      // If contact information is provided without an _id, create a new contact
      if (data.contactInformation && !data.contactInformation._id) {
        const newContact = await this.contactService.create(
          data.contactInformation,
          newSession
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
          newSession
        );
        contactId = updatedContact._id.toString();
      }

      if (isValidFileUpload(data.uploadedPictureId)) {
        const fileId = await this.gridFSBucket.uploadFile(
          data.uploadedPictureId as Express.Multer.File
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
}
