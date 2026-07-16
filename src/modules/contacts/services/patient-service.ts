import { BaseService, runTransaction } from "../../../system";
import { patientModel } from "../models/patient.model";
import { PatientDTO, UpdatePatientDTO } from "../models/patient.dto";
import { ClientSession } from "mongoose";

/** Business logic service for patient operations with cross-model reference filtering */
export class PatientService extends BaseService<any> {
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
  ): Promise<any> {
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
  ): Promise<any> {
    return await runTransaction(session, async (newSession) => {
      return await super.update(data, newSession);
    });
  }
}
