import isBetween from "dayjs/plugin/isBetween";
import dayjs from "dayjs";
import { runTransaction, ValidationException } from "../../../system";
import { ClientSession, Types } from "mongoose";
import {
  AssetRosterDocument,
  AssetCommissioningDocument,
  AssetMaintenanceDocument,
} from "@mongodb-types";
import { assetRosterStatus } from "../models/asset-roster-status.type";
import { assetRosterModel } from "../models/asset-roster.model";
dayjs.extend(isBetween);

export class AssetRosterStatusService {
  async updateAssetRosterStatus(
    assetRosterId: string | Types.ObjectId,
    session: ClientSession | undefined
  ) {
    return await runTransaction<AssetRosterDocument>(
      session,
      async (newSession) => {
        const assetRoster = await assetRosterModel
          .findById(assetRosterId)
          .session(newSession);

        if (!assetRoster)
          throw new ValidationException("Asset Roster not found");

        let assetRosterStatus: assetRosterStatus =
          assetRoster.status || "awaiting-commissioning";

        const maintenances: AssetMaintenanceDocument[] =
          assetRoster.assetMaintenances;
        const commissioning: AssetCommissioningDocument | null =
          assetRoster.assetCommission;

        // check if service is available
        const service = maintenances.find(
          (m) => m.active && m.type === "service"
        );

        // check if preventive maintenance
        const preventive = maintenances.find(
          (m) => m.active && m.type === "preventive-maintenance"
        );

        if (service) {
          assetRosterStatus = "under-service";
        } else if (preventive) {
          assetRosterStatus = "in-pm";
        } else if (commissioning && commissioning.outcome === "pass") {
          assetRosterStatus = "active";
        }

        return (await assetRosterModel.findByIdAndUpdate(
          assetRosterId,
          {
            status: assetRosterStatus,
          },
          { session: newSession, new: true }
        )) as AssetRosterDocument;
      }
    );
  }

  async assetRosterHasActiveCommissioning(
    assetRosterId: string,
    session: ClientSession | undefined
  ) {
    return await runTransaction<boolean>(session, async (newSession) => {
      const assetRoster = await assetRosterModel
        .findById(assetRosterId)
        .session(newSession);

      return assetRoster?.assetCommission?.outcome === "pass";
    });
  }

  async updateNextAssetRosterMaintenanceDates(
    assetRosterId: string | Types.ObjectId,
    session: ClientSession | undefined
  ) {
    return await runTransaction<AssetRosterDocument>(
      session,
      async (newSession) => {
        const assetRoster = await assetRosterModel
          .findById(assetRosterId)
          .session(newSession);

        // Check if the assetRoster exists and is commissioned
        if (!assetRoster)
          throw new ValidationException("Asset Roster not found");
        if (assetRoster.assetCommission?.outcome !== "pass")
          throw new ValidationException(
            "Asset Roster not commissioned, must be commissioned to update maintenance dates"
          );

        const window = assetRoster.maintenanceWindowIds?.[0];

        if (!window)
          throw new ValidationException("Maintenance window not found");

        // get recurrency for the maintenanceDate
        const { unit, count } = window.parseRecurrencyForDayjs();

        // check if the current date of finalizing the PM is overdue
        const isOverdue = await this.assetRosterIsOverdueForMaintenance(
          assetRosterId,
          newSession
        );

        // calculate min and max maintenance dates and curr maintenance date
        // if its overdue, use the current date
        const maintenanceDate = dayjs(
          isOverdue ? Date.now() : assetRoster.maintenanceDate
        ).add(count, unit);

        // calculate min and max maintenance dates
        const minMaintenanceDate = dayjs(maintenanceDate).subtract(
          window.daysBefore,
          "day"
        );
        const maxMaintenanceDate = dayjs(maintenanceDate).add(
          window.daysAfter,
          "day"
        );

        return (await assetRosterModel.findByIdAndUpdate(
          assetRosterId,
          {
            minMaintenanceDate: minMaintenanceDate.toDate(),
            maxMaintenanceDate: maxMaintenanceDate.toDate(),
            maintenanceDate: maintenanceDate.toDate(),
          },
          { session: newSession, new: true }
        )) as AssetRosterDocument;
      }
    );
  }

  async updateAssetRosterMaintenanceDates(
    assetRosterId: string | Types.ObjectId,
    session: ClientSession | undefined
  ) {
    return await runTransaction<AssetRosterDocument>(
      session,
      async (newSession) => {
        const assetRoster = await assetRosterModel
          .findById(assetRosterId)
          .session(newSession);

        // Check if the assetRoster exists and is commissioned
        if (!assetRoster)
          throw new ValidationException("Asset Roster not found");
        if (assetRoster.assetCommission?.outcome !== "pass")
          throw new ValidationException(
            "Asset Roster not commissioned, must be commissioned to update maintenance dates"
          );

        const window = assetRoster.maintenanceWindowIds?.[0];

        if (!window)
          throw new ValidationException("Maintenance window not found");

        const minMaintenanceDate = dayjs(assetRoster.maintenanceDate).subtract(
          window.daysBefore,
          "day"
        );
        const maxMaintenanceDate = dayjs(assetRoster.maintenanceDate).add(
          window.daysAfter,
          "day"
        );

        return (await assetRosterModel.findByIdAndUpdate(
          assetRosterId,
          {
            minMaintenanceDate: minMaintenanceDate.toDate(),
            maxMaintenanceDate: maxMaintenanceDate.toDate(),
          },
          { session: newSession, new: true }
        )) as AssetRosterDocument;
      }
    );
  }

  async assetRosterIsDueForMaintenance(
    assetRosterId: string | Types.ObjectId,
    session: ClientSession | undefined
  ): Promise<boolean> {
    return await runTransaction<boolean>(session, async (newSession) => {
      const assetRoster = await assetRosterModel
        .findById(assetRosterId)
        .session(newSession);

      if (!assetRoster) throw new ValidationException("Asset Roster not found");

      const today = dayjs();
      const minDate = dayjs(assetRoster.minMaintenanceDate);
      const maxDate = dayjs(assetRoster.maxMaintenanceDate);

      return today.isBetween(minDate, maxDate, "day", "[]");
    });
  }

  async assetRosterIsOverdueForMaintenance(
    assetRosterId: string | Types.ObjectId,
    session: ClientSession | undefined
  ): Promise<boolean> {
    return await runTransaction<boolean>(session, async (newSession) => {
      const assetRoster = await assetRosterModel
        .findById(assetRosterId)
        .session(newSession);

      if (!assetRoster) throw new ValidationException("Asset Roster not found");

      const today = dayjs();
      const maxDate = dayjs(assetRoster.maxMaintenanceDate);

      return today.isAfter(maxDate, "day");
    });
  }

  async assetRosterIsBeforeDueForMaintenance(
    assetRosterId: string | Types.ObjectId,
    session: ClientSession | undefined
  ): Promise<boolean> {
    return await runTransaction<boolean>(session, async (newSession) => {
      const assetRoster = await assetRosterModel
        .findById(assetRosterId)
        .session(newSession);

      if (!assetRoster) throw new ValidationException("Asset Roster not found");

      const today = dayjs();
      const minDate = dayjs(assetRoster.minMaintenanceDate);

      return today.isBefore(minDate, "day");
    });
  }
}
