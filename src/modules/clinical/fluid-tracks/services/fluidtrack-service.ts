import {
  FluidTrackDocument,
  FluidTrack,
  PatientDocument,
  UserDocument,
} from "@mongodb-types";
import {
  BaseService,
  NotFoundException,
  runTransaction,
  userStorage,
} from "../../../../system";
import { fluidTrackModel } from "../models/fluidtrack.model";
import { FluidTrackDTO } from "../models/fluidtrack.dto";
import { ClientSession } from "mongoose";

/** Business logic service for fluid track operations */
export class FluidTrackService extends BaseService<FluidTrackDocument> {
  constructor() {
    super({
      model: fluidTrackModel,
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
   * Adds a fluid track item to a fluid track record.
   * @param fluidTrackId - The fluid track ID
   * @param itemData - The item data to add
   * @param session - Optional Mongoose client session
   */
  async addItem(
    fluidTrackId: string,
    itemData: Record<string, any>,
    session?: ClientSession,
  ): Promise<FluidTrackDocument> {
    return await runTransaction(session, async (newSession) => {
      const track = await fluidTrackModel
        .findById(fluidTrackId)
        .session(newSession);
      if (!track) throw new NotFoundException("Fluid track not found");

      const actorId = userStorage.getStore()?.user?._id?.toString();
      const existingItems = track.get("items") || [];
      track.set("items", [
        ...existingItems,
        { ...itemData, createdBy: actorId },
      ]);
      track.updatedBy = actorId;
      await track.save({ session: newSession });

      return track;
    });
  }

  /**
   * Gets fluid tracks within a date range for a number of days.
   * @param patientId - The patient ID
   * @param days - Number of days to look back
   * @param session - Optional Mongoose client session
   */
  async getFromDateDays(
    patientId: string,
    days: number,
    session?: ClientSession,
  ): Promise<FluidTrack[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    return fluidTrackModel
      .find({
        patientId,
        createdAt: { $gte: since },
        active: true,
      })
      .session(session || null)
      .lean<FluidTrack[]>();
  }
}
