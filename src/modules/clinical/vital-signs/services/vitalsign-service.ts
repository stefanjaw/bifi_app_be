import { VitalSignDocument } from "@mongodb-types";
import { BaseService, runTransaction, userStorage } from "../../../../system";
import { vitalSignModel } from "../models/vitalsign.model";
import { VitalSignDTO } from "../models/vitalsign.dto";
import { PatientDocument } from "@mongodb-types";
import { UserDocument } from "@mongodb-types";
import { ClientSession } from "mongoose";

/** Business logic service for vital sign operations */
export class VitalSignService extends BaseService<VitalSignDocument> {
  constructor() {
    super({
      model: vitalSignModel,
      refFields: [
        {
          path: "patientId",
          getModel: () =>
            this.connectionManager.getModel<PatientDocument>("Patient"),
          isArray: false,
        },
        {
          path: "createdBy",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () => this.connectionManager.getModel<UserDocument>("User"),
          isArray: false,
        },
      ],
    });
  }

  /**
   * Creates multiple vital sign records in a single batch transaction.
   * @param records - Array of vital sign creation DTOs
   * @param session - Optional Mongoose client session
   */
  async createMany(
    records: VitalSignDTO[],
    session?: ClientSession,
  ): Promise<VitalSignDocument[]> {
    return await runTransaction(session, async (newSession) => {
      const actorId = userStorage.getStore()?.user?._id?.toString();
      const created: VitalSignDocument[] = [];

      for (const data of records) {
        const record = await vitalSignModel.create(
          [{ ...data, createdBy: actorId }],
          { session: newSession },
        );
        created.push(record[0]);
      }

      return created;
    });
  }
}
