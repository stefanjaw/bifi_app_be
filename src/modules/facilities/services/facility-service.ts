import { ClientSession } from "mongoose";
import { BaseService } from "../../../utils";
import { facility, facilityModel } from "../models/facility";
import { RoomService } from "./room-service";
import { room } from "../models/room";

export class FacilityService extends BaseService<facility> {
  private roomService: RoomService = new RoomService();

  constructor() {
    super(facilityModel);
  }

  override async create(
    data: Record<string, any>,
    session?: ClientSession | undefined
  ): Promise<facility> {
    const newSession = await super.startSession(session);

    try {
      if (!session) newSession.startTransaction();

      // create rooms if they exist in the data
      if (data.rooms && data.rooms.length > 0) {
        const newRooms: room[] = await Promise.all(
          data.rooms.map(async (room: room) => {
            return await this.roomService.create(room, newSession);
          })
        );

        data.rooms = newRooms.map((room) => room._id);
      }

      const facility = await super.create(data, newSession);

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

      // create, update or delete rooms if they exist in the data
      if (data.rooms && data.rooms.length > 0) {
        // Get the existing facility to check for rooms
        const existingFacility = (
          (await super.get(
            { _id: data._id },
            undefined,
            newSession
          )) as facility[]
        )[0];

        if (!existingFacility) {
          throw new Error("Facility not found");
        }

        // Create or update rooms
        const newRooms: room[] = await Promise.all(
          data.rooms.map(async (room: room) =>
            room._id
              ? await this.roomService.update(room, newSession)
              : await this.roomService.create(room, newSession)
          )
        );

        // Delete rooms that are not in the new list
        await Promise.all(
          existingFacility.rooms
            .filter(
              (existingRoom) =>
                !newRooms.some((newRoom) =>
                  newRoom._id.equals(existingRoom._id)
                )
            )
            .map(
              async (roomToDelete) =>
                await this.roomService.delete(
                  roomToDelete._id.toString(),
                  newSession
                )
            )
        );

        // Update the facility's rooms with the new or updated rooms
        data.rooms = newRooms.map((room) => room._id);
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
