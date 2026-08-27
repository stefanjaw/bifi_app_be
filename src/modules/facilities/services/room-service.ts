import { ClientSession } from "mongoose";
import { isValidObjectId } from "mongoose";
import {
  BaseService,
  ValidationException,
  runTransaction,
} from "../../../system";
import { roomModel } from "../models/room.model";
import { FacilityDocument, RoomDocument } from "@mongodb-types";
import { RoomCSVDTO } from "../models/room-csv.dto";
export class RoomService extends BaseService<RoomDocument> {
  constructor() {
    super({
      model: roomModel,
      refFields: [
        {
          path: "facilityId",
          getModel: () =>
            this.connectionManager.getModel<FacilityDocument>("Facility"),
          isArray: false,
        },
      ],
    });
  }
  async validateImport(
    rows: RoomCSVDTO[],
  ): Promise<{ valid: boolean; rowCount: number }> {
    const errors: string[] = [];
    const FacilityModel =
      this.connectionManager.getModel<FacilityDocument>("Facility");
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowLabel = `Row ${i + 1}`;
      // Required fields for new records (no id = create, id = update).
      if (!row.id) {
        if (!row.name) {
          errors.push(
            `${rowLabel}: name is required when creating a new record.`,
          );
        }
        if (!row.code) {
          errors.push(
            `${rowLabel}: code is required when creating a new record.`,
          );
        }
        if (!row.address) {
          errors.push(
            `${rowLabel}: address is required when creating a new record.`,
          );
        }
        if (!row.facilityId) {
          errors.push(
            `${rowLabel}: facilityId is required when creating a new record.`,
          );
        }
      }
      // Validate facilityId — must match an existing Facility by name or MongoDB ID.
      if (row.facilityId) {
        const query = isValidObjectId(row.facilityId)
          ? { $or: [{ _id: row.facilityId }, { name: row.facilityId }] }
          : { name: row.facilityId };
        const facility = await FacilityModel.findOne(query);
        if (!facility) {
          errors.push(
            `${rowLabel}: Facility "${row.facilityId}" was not found in the system. ` +
              `Ensure the value matches an existing Facility name or ID exactly.`,
          );
        }
      }
    }
    if (errors.length > 0) {
      throw new ValidationException(errors.join("\n"));
    }
    return { valid: true, rowCount: rows.length };
  }

  override async importCSV(
    data: RoomCSVDTO[],
    session?: ClientSession,
  ): Promise<RoomDocument[]> {
    return await runTransaction<RoomDocument[]>(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);
      const FacilityModel =
        this.connectionManager.getModel<FacilityDocument>("Facility");

      const resolvedData = await Promise.all(
        data.map(async (row) => {
          const resolved: Record<string, any> = { ...row };

          if (row.facilityId) {
            const query = isValidObjectId(row.facilityId)
              ? { $or: [{ _id: row.facilityId }, { name: row.facilityId }] }
              : { name: row.facilityId };

            const facility =
              await FacilityModel.findOne(query).session(newSession);

            if (!facility) {
              throw new ValidationException(
                `Facility "${row.facilityId}" was not found in the system.`,
              );
            }

            resolved.facilityId = facility._id;
          }

          return resolved;
        }),
      );

      const records = await model.create([...resolvedData], {
        session: newSession,
        ordered: true,
      });

      return records as RoomDocument[];
    });
  }
}
