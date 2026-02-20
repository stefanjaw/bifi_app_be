import { ClientSession } from "mongoose";
import { BaseService, runTransaction } from "../../../system";
import { facilityModel } from "../models/facility.model";
import { RoomService } from "./room-service";
import { ContactDocument, FacilityDocument } from "@mongodb-types";
import { FacilityDTO, UpdateFacilityDTO } from "../models/facility.dto";

export class FacilityService extends BaseService<FacilityDocument> {
  private roomService: RoomService = new RoomService();

  constructor() {
    super({
      model: facilityModel,
      refFields: [
        {
          path: "contactId",
          getModel: () =>
            this.connectionManager.getModelByDB<ContactDocument>("Contact"),
          isArray: false,
        },
      ],
    });
    // super.setPopulatingFields = ["rooms"];
  }

  /**
   * Creates a new facility, creates or updates rooms if they exist in the data.
   * @param {FacilityDTO} data - The data to create the facility with.
   * @param {ClientSession} [session] - The session to perform the transaction in.
   * @returns {Promise<FacilityDocument>} - The created facility document.
   */
  override async create(
    data: FacilityDTO,
    session?: ClientSession | undefined,
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

  /**
   * Updates a facility, updates or creates rooms if they exist in the data.
   * If a room has an _id, it is updated; otherwise, a new room is created.
   * @param {UpdateFacilityDTO} data - The data to update the facility with.
   * @param {ClientSession} [session] - The session to perform the transaction in.
   * @returns {Promise<FacilityDocument>} - The updated facility document.
   */
  override async update(
    data: UpdateFacilityDTO,
    session?: ClientSession | undefined,
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
