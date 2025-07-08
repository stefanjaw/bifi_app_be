import { ClientSession } from "mongoose";
import { BaseService } from "../../../utils";
import { facility, facilityModel } from "../models/facility";
import { RoomService } from "./room-service";

export class FacilityService extends BaseService<facility> {
  private roomService: RoomService = new RoomService();

  constructor() {
    super(facilityModel);
    super.setPopulatingFields = ["rooms"];
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<facility> {
    const newSession = await super.startSession(session);

    try {
      if (!session) newSession.startTransaction();

      // create facility first
      const facility = await super.create(data, newSession);

      // create rooms if they dont exist in the DB
      if (data.rooms && data.rooms.length > 0) {
        // Ensure each room has the facilityId set to the new facility's _id
        data.rooms.forEach((room: any) => {
          room.facilityId = facility._id;
        });

        for (const room of data.rooms) {
          await this.roomService.create(room, newSession);
        }
      }

      if (!session) await newSession.commitTransaction();
      return facility;
    } catch (error) {
      if (!session) await newSession.abortTransaction();
      throw error;
    } finally {
      if (!session) await newSession.endSession();
    }
  }

  override async update(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<facility> {
    const newSession = await super.startSession(session);

    try {
      if (!session) newSession.startTransaction();

      // create, update rooms if they exist in the data
      if (data.rooms && data.rooms.length > 0) {
        // Ensure each room has the facilityId set to the current facility's _id
        data.rooms.forEach((room: any) => {
          room.facilityId = data._id; // Use the _id from the data object
        });

        for (const room of data.rooms) {
          // If room has an _id, update it; otherwise, create a new room
          if (room._id) {
            await this.roomService.update(room, newSession);
          } else {
            // Create a new room without _id
            await this.roomService.create(room, newSession);
          }
        }
      }

      const facility = await super.update(data, newSession);

      if (!session) await newSession.commitTransaction();
      return facility;
    } catch (error) {
      if (!session) await newSession.abortTransaction();
      throw error;
    } finally {
      if (!session) await newSession.endSession();
    }
  }
}
