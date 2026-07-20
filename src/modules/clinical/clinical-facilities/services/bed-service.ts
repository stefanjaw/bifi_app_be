import {
  BaseService,
  runTransaction,
  userStorage,
  NotFoundException,
  ValidationException,
} from "../../../../system";
import { bedModel } from "../models/bed.model";
import { BedDocument } from "../models/bed.model";
import { Room, Facility, Bed } from "@mongodb-types";
import { bedHistoryModel } from "../models/bed-history.model";
import { BedDTO, UpdateBedDTO } from "../models/bed.dto";
import { ClientSession } from "mongoose";

/** Business logic service for bed management and bed history tracking */
export class BedService extends BaseService<BedDocument> {
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

  override async create(data: BedDTO, session?: ClientSession): Promise<BedDocument> {
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
  ): Promise<BedDocument> {
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

  /**
   * Reserves a bed to a contact with availability validation.
   * @param bedId - The bed ID to reserve
   * @param contactId - The contact ID making the reservation
   * @param session - Optional Mongoose client session for transactions
   */
  async reserve(
    bedId: string,
    contactId: string,
    session?: ClientSession,
  ): Promise<BedDocument> {
    return await runTransaction(session, async (newSession) => {
      const bed = await bedModel.findById(bedId).session(newSession);
      if (!bed) throw new NotFoundException("Bed not found");
      if (bed.state !== "Empty" && bed.stateCode !== "empty") {
        throw new ValidationException(
          `Bed is currently ${bed.state}. Cannot reserve.`,
        );
      }

      const actorId = userStorage.getStore()?.user?._id?.toString();
      bed.reservationId = contactId as any;
      bed.state = "Reserved";
      bed.stateCode = "reserved";
      bed.updatedBy = actorId as any;
      await bed.save({ session: newSession });

      await bedHistoryModel.create(
        [
          {
            action: "Reserved",
            description: `Bed ${bed.name} reserved to contact ${contactId}`,
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

  /**
   * Cancels a bed reservation.
   * @param bedId - The bed ID to cancel reservation for
   * @param session - Optional Mongoose client session for transactions
   */
  async cancelReservation(
    bedId: string,
    session?: ClientSession,
  ): Promise<BedDocument> {
    return await runTransaction(session, async (newSession) => {
      const bed = await bedModel.findById(bedId).session(newSession);
      if (!bed) throw new NotFoundException("Bed not found");
      if (bed.state !== "Reserved") {
        throw new ValidationException("Bed is not currently reserved.");
      }

      const actorId = userStorage.getStore()?.user?._id?.toString();
      bed.reservationId = undefined;
      bed.state = "Empty";
      bed.stateCode = "empty";
      bed.updatedBy = actorId as any;
      await bed.save({ session: newSession });

      await bedHistoryModel.create(
        [
          {
            action: "Reservation Cancelled",
            description: `Reservation for bed ${bed.name} cancelled`,
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

  /**
   * Assigns a bed to a patient with validation.
   * @param bedId - The bed ID to assign
   * @param patientId - The patient ID to assign to
   * @param session - Optional Mongoose client session for transactions
   */
  async assign(
    bedId: string,
    patientId: string,
    session?: ClientSession,
  ): Promise<BedDocument> {
    return await runTransaction(session, async (newSession) => {
      const bed = await bedModel.findById(bedId).session(newSession);
      if (!bed) throw new NotFoundException("Bed not found");
      if (bed.state === "Taken") {
        throw new ValidationException("Bed is already taken.");
      }

      const actorId = userStorage.getStore()?.user?._id?.toString();
      bed.patientId = patientId as any;
      bed.reservationId = undefined;
      bed.state = "Taken";
      bed.stateCode = "taken";
      bed.updatedBy = actorId as any;
      await bed.save({ session: newSession });

      await bedHistoryModel.create(
        [
          {
            action: "Assigned",
            description: `Bed ${bed.name} assigned to patient ${patientId}`,
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

  /**
   * Cancels a bed assignment and returns the bed to empty state.
   * @param bedId - The bed ID to cancel assignment for
   * @param session - Optional Mongoose client session for transactions
   */
  async cancelAssignment(
    bedId: string,
    session?: ClientSession,
  ): Promise<BedDocument> {
    return await runTransaction(session, async (newSession) => {
      const bed = await bedModel.findById(bedId).session(newSession);
      if (!bed) throw new NotFoundException("Bed not found");
      if (bed.state !== "Taken") {
        throw new ValidationException("Bed is not currently assigned.");
      }

      const actorId = userStorage.getStore()?.user?._id?.toString();
      bed.patientId = undefined;
      bed.state = "Empty";
      bed.stateCode = "empty";
      bed.updatedBy = actorId as any;
      await bed.save({ session: newSession });

      await bedHistoryModel.create(
        [
          {
            action: "Assignment Cancelled",
            description: `Assignment for bed ${bed.name} cancelled`,
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

  /**
   * Gets a list of facilities with counts of available/empty beds.
   * @param session - Optional Mongoose client session for transactions
   * @returns Facilities with available bed counts
   */
  async getFacilitiesWithAvailableBeds(
    session?: ClientSession,
  ): Promise<any[]> {
    return await runTransaction(session, async (newSession) => {
      const FacilityModel = this.connectionManager.getModel("Facility");
      const RoomModel = this.connectionManager.getModel("Room");

      const rooms = await RoomModel.find({ active: true })
        .session(newSession)
        .lean<Room[]>();
      const facilityIds = [
        ...new Set(rooms.map((r: Room) => r.facilityId?.toString()).filter(Boolean)),
      ];

      const beds = await bedModel
        .find({ active: true, state: "Empty" })
        .session(newSession)
        .lean<Bed[]>();

      const roomBedCounts: Record<string, number> = {};
      beds.forEach((b: Bed) => {
        const roomId = b.roomId?.toString();
        if (roomId) {
          roomBedCounts[roomId] = (roomBedCounts[roomId] || 0) + 1;
        }
      });

      const facilities = await FacilityModel.find({
        _id: { $in: facilityIds },
        active: true,
      })
        .session(newSession)
        .lean<Facility[]>();

      return facilities.map((f: Facility) => {
        const facilityRooms = rooms.filter(
          (r: Room) => r.facilityId?.toString() === f._id.toString(),
        );
        const availableBeds = facilityRooms.reduce(
          (sum: number, r: Room) => sum + (roomBedCounts[r._id?.toString()] || 0),
          0,
        );
        return { ...f, availableBeds };
      });
    });
  }
}
