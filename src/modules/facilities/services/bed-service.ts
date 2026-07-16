import { BaseService, runTransaction, userStorage } from "../../../system";
import { bedModel } from "../models/bed.model";
import { bedHistoryModel } from "../models/bed-history.model";
import { BedDTO, UpdateBedDTO } from "../models/bed.dto";
import { ClientSession } from "mongoose";

export class BedService extends BaseService<any> {
  constructor() {
    super({
      model: bedModel,
      refFields: [
        {
          path: "roomId",
          getModel: () => this.connectionManager.getModel("Room"),
          isArray: false,
        },
        {
          path: "patientId",
          getModel: () => this.connectionManager.getModel("Patient"),
          isArray: false,
        },
        {
          path: "reservationId",
          getModel: () => this.connectionManager.getModel("Contact"),
          isArray: false,
        },
        {
          path: "createdBy",
          getModel: () => this.connectionManager.getModel("User"),
          isArray: false,
        },
        {
          path: "updatedBy",
          getModel: () => this.connectionManager.getModel("User"),
          isArray: false,
        },
      ],
    });
  }

  override async create(data: BedDTO, session?: ClientSession): Promise<any> {
    return await runTransaction(session, async (newSession) => {
      const actorId = userStorage.getStore()?.user?._id?.toString();
      const bed = await super.create(
        { ...data, createdBy: actorId },
        newSession,
      );

      await bedHistoryModel.create(
        [
          {
            action: "Created",
            description: `Bed ${bed.name} created`,
            bedId: bed._id,
            effective: true,
            createdBy: actorId,
          },
        ],
        { session: newSession },
      );

      return bed;
    });
  }

  override async update(
    data: UpdateBedDTO,
    session?: ClientSession,
  ): Promise<any> {
    return await runTransaction(session, async (newSession) => {
      const actorId = userStorage.getStore()?.user?._id?.toString();
      const oldBed = await this.getById(data._id, newSession);
      const updated = await super.update(
        { ...data, updatedBy: actorId },
        newSession,
      );

      if (data.state && data.state !== oldBed?.state) {
        await bedHistoryModel.create(
          [
            {
              action: `State changed: ${oldBed?.state} → ${data.state}`,
              description: `Bed ${data._id} state changed`,
              bedId: data._id,
              effective: true,
              createdBy: actorId,
            },
          ],
          { session: newSession },
        );
      }

      return updated;
    });
  }
}
