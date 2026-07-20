import { BaseService, runTransaction, userStorage } from "../../../../system";
import { careContinuumModel } from "../models/care-continuum.model";
import { CareContinuumDocument } from "../models/care-continuum.model";
import {
  CareContinuumDTO,
  UpdateCareContinuumDTO,
} from "../models/care-continuum.dto";
import { ClientSession } from "mongoose";

/** Business logic service for care continuum operations */
export class CareContinuumService extends BaseService<CareContinuumDocument> {
  constructor() {
    super({
      model: careContinuumModel,
      refFields: [
        {
          path: "patientId",
          getModel: () => this.connectionManager.getModel("Patient"),
          isArray: false,
        },
        {
          path: "careContinuumLevelId",
          getModel: () => this.connectionManager.getModel("CareContinuumLevel"),
          isArray: false,
        },
        {
          path: "transferPoint",
          getModel: () => this.connectionManager.getModel("Contact"),
          isArray: false,
        },
        {
          path: "assignedCaregiver",
          getModel: () => this.connectionManager.getModel("Contact"),
          isArray: false,
        },
        {
          path: "assignedNurse",
          getModel: () => this.connectionManager.getModel("Contact"),
          isArray: false,
        },
        {
          path: "unitId",
          getModel: () => this.connectionManager.getModel("Facility"),
          isArray: false,
        },
        {
          path: "bedId",
          getModel: () => this.connectionManager.getModel("Bed"),
          isArray: false,
        },
        {
          path: "roomId",
          getModel: () => this.connectionManager.getModel("Room"),
          isArray: false,
        },
        {
          path: "genderAtBirth",
          getModel: () => this.connectionManager.getModel("Gender"),
          isArray: false,
        },
        {
          path: "genderAtPresent",
          getModel: () => this.connectionManager.getModel("Gender"),
          isArray: false,
        },
        {
          path: "race",
          getModel: () => this.connectionManager.getModel("CareContinuumRace"),
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

  /**
   * Creates a new care continuum record, auto-assigning the requesting user as creator
   * @param data - The care continuum creation DTO
   * @param session - Optional Mongoose client session for transactions
   * @returns The created care continuum document
   */
  override async create(
    data: CareContinuumDTO,
    session?: ClientSession,
  ): Promise<any> {
    return await runTransaction(session, async (newSession) => {
      const actorId = userStorage.getStore()?.user?._id?.toString();
      return await super.create({ ...data, createdBy: actorId }, newSession);
    });
  }

  /**
   * Updates an existing care continuum record, auto-assigning the requesting user as updater
   * @param data - The care continuum update DTO
   * @param session - Optional Mongoose client session for transactions
   * @returns The updated care continuum document
   */
  override async update(
    data: UpdateCareContinuumDTO,
    session?: ClientSession,
  ): Promise<any> {
    return await runTransaction(session, async (newSession) => {
      const actorId = userStorage.getStore()?.user?._id?.toString();
      return await super.update({ ...data, updatedBy: actorId }, newSession);
    });
  }
}
