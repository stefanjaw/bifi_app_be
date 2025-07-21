import { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import { facilityModel } from "../models/facility.model";
import { RoomService } from "./room-service";
import { FacilityDocument } from "../../../types/mongoose.gen";

export class FacilityService extends BaseService<FacilityDocument> {
  private roomService: RoomService = new RoomService();

  constructor() {
    super({ model: facilityModel });
    // super.setPopulatingFields = ["rooms"];
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<FacilityDocument> {
    return runTransaction<FacilityDocument>(session, async (newSession) => {
      // create facility first
      const facility = await super.create(data, newSession);

      // create, update rooms if they exist in the data
      if (data.rooms && data.rooms.length > 0) {
        // Ensure each room has the facilityId set to the current facility's _id
        data.rooms.forEach((room: any) => {
          room.facilityId = facility._id; // Use the _id from the data object
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

      return facility;
    });
  }

  override async update(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<FacilityDocument> {
    return runTransaction<FacilityDocument>(session, async (newSession) => {
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

      return await super.update(data, newSession);
    });
  }
}
