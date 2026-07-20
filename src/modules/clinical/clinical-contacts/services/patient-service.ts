import { BaseService, runTransaction } from "../../../../system";
import { patientModel } from "../models/patient.model";
import { PatientDocument } from "../models/patient.model";
import { Patient, Contact } from "@mongodb-types";
import { PatientDTO, UpdatePatientDTO } from "../models/patient.dto";
import { ClientSession } from "mongoose";

/** Business logic service for patient operations with cross-model reference filtering */
export class PatientService extends BaseService<PatientDocument> {
  constructor() {
    super({
      model: patientModel,
      refFields: [
        {
          path: "contactId",
          getModel: () => this.connectionManager.getModel("Contact"),
          isArray: false,
        },
        {
          path: "maritalStatus",
          getModel: () => this.connectionManager.getModel("MaritalStatus"),
          isArray: false,
        },
      ],
    });
  }

  /**
   * Creates a new patient record within a transaction.
   * @param data - The patient data to create
   * @param session - Optional client session for the transaction
   * @returns Promise resolving to the created patient document
   */
  override async create(
    data: PatientDTO,
    session?: ClientSession,
  ): Promise<PatientDocument> {
    return await runTransaction(session, async (newSession) => {
      return await super.create(data, newSession);
    });
  }

  /**
   * Updates an existing patient record within a transaction.
   * @param data - The patient data to update
   * @param session - Optional client session for the transaction
   * @returns Promise resolving to the updated patient document
   */
  override async update(
    data: UpdatePatientDTO,
    session?: ClientSession,
  ): Promise<PatientDocument> {
    return await runTransaction(session, async (newSession) => {
      return await super.update(data, newSession);
    });
  }

  /**
   * Gets contacts available for admission (patients not currently admitted).
   * @param session - Optional Mongoose client session
   */
  async getAvailableToAdmit(session?: ClientSession): Promise<Patient[]> {
    const CareContinuumModel = this.connectionManager.getModel("CareContinuum");

    const admittedPatientIds = await CareContinuumModel.find({
      state: { $ne: "Discharge" },
      active: true,
    })
      .session(session || null)
      .distinct("patientId")
      .lean();

    return patientModel
      .find({
        _id: { $nin: admittedPatientIds },
        active: true,
      })
      .session(session || null)
      .lean<Patient[]>();
  }

  /**
   * Gets contacts available to create users (contacts not yet linked to a user).
   * @param session - Optional Mongoose client session
   */
  async getAvailableToCreateUsers(session?: ClientSession): Promise<Patient[]> {
    const ContactModel = this.connectionManager.getModel("Contact");
    const UserModel = this.connectionManager.getModel("User");

    const userIds = await UserModel.find({ active: true })
      .session(session || null)
      .distinct("contactId")
      .lean();

    const contacts = await ContactModel.find({
      _id: { $nin: userIds },
      active: true,
    })
      .session(session || null)
      .lean<Contact[]>();

    const contactIds = contacts.map((c: Contact) => c._id);

    return patientModel
      .find({
        contactId: { $in: contactIds },
        active: true,
      })
      .session(session || null)
      .lean<Patient[]>();
  }
}
