import { ClientSession } from "mongoose";
import {
  BaseService,
  InternalServerException,
  NotFoundException,
  runTransaction,
  userStorage,
  ValidationException,
} from "../../../system";
import { assetRosterModel } from "../models/asset-roster.model";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import {
  AssetRosterDTO,
  SkipAssetRosterPMDTO,
  UpdateAssetRosterDTO,
} from "../models/asset-roster.dto";
import {
  FileUpload,
  InnerFile,
} from "../../../system/libraries/file-storage/file-upload.types";
import { ContactService } from "../../contacts/services/contact-service";
import { AssetRosterCSVDTO } from "../models/asset-roster-csv.dto";
import {
  ContactDocument,
  AssetRosterDocument,
  RoomDocument,
  AssetTypeDocument,
  MaintenanceWindowDocument,
} from "@mongodb-types";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";
import { AssetRosterStatusService } from "./asset-roster-status-service";
import { AssetTypeService } from "./asset-type-service";
import { GenAIService } from "../../ai/services/genai-service";
import { RoomService } from "../../facilities/services/room-service";
import { MaintenanceWindowsService } from "../../maintenance-windows/services/maintenance-window-service";
import { AssetConditionService } from "./asset-condition-service";

export class AssetRosterService extends BaseService<AssetRosterDocument> {
  private assetRosterStatusService = new AssetRosterStatusService();
  private assetTypeService = new AssetTypeService();
  private contactsService = new ContactService();
  private activityHistoryService = new ActivityHistoryService();
  private readonly genAIService = new GenAIService();
  private roomService = new RoomService();
  private maintenanceWindowsService = new MaintenanceWindowsService();
  private conditionService = new AssetConditionService();

  constructor() {
    super({
      model: assetRosterModel,
      refFields: [
        {
          path: "assetTypeIds",
          getModel: () =>
            this.connectionManager.getModel<AssetTypeDocument>("AssetType"),
          isArray: true,
        },
        {
          path: "vendorIds",
          getModel: () =>
            this.connectionManager.getModel<ContactDocument>("Contact"),
          isArray: true,
        },
        {
          path: "makeIds",
          getModel: () =>
            this.connectionManager.getModel<ContactDocument>("Contact"),
          isArray: true,
        },
        {
          path: "locationId",
          getModel: () => this.connectionManager.getModel<RoomDocument>("Room"),
          isArray: false,
        },
      ],
    });
  }

  /**
   * Soft-archives Asset Roster records by setting active to false.
   * Archived records and their activity history remain available for audit.
   */
  async archiveSelected(
    ids: string[],
    session?: ClientSession,
  ): Promise<{ archivedCount: number }> {
    return await runTransaction(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);

      const activeRecordCount = await model
        .countDocuments({
          _id: { $in: ids },
          active: true,
        })
        .session(newSession);

      if (activeRecordCount !== ids.length) {
        throw new ValidationException(
          "One or more selected Asset Roster records no longer exist or are already archived.",
        );
      }

      const result = await model.updateMany(
        {
          _id: { $in: ids },
          active: true,
        },
        {
          $set: { active: false },
        },
        {
          session: newSession,
        },
      );

      return {
        archivedCount: result.modifiedCount ?? 0,
      };
    });
  }

  /**
   * Restores archived Asset Roster records by setting active to true.
   */
  async unarchiveSelected(
    ids: string[],
    session?: ClientSession,
  ): Promise<{ unarchivedCount: number }> {
    return await runTransaction(session, async (newSession) => {
      const model = this.connectionManager.bindModelToDb(this.model);

      const archivedRecordCount = await model
        .countDocuments({
          _id: { $in: ids },
          active: false,
        })
        .session(newSession);

      if (archivedRecordCount !== ids.length) {
        throw new ValidationException(
          "One or more selected Asset Roster records no longer exist or are already active.",
        );
      }

      const result = await model.updateMany(
        {
          _id: { $in: ids },
          active: false,
        },
        {
          $set: { active: true },
        },
        {
          session: newSession,
        },
      );

      return {
        unarchivedCount: result.modifiedCount ?? 0,
      };
    });
  }

  /**
   * Creates a new asset roster.
   * Handles file uploads if provided and creates the make and asset type IDs.
   * If maintenance date is provided, then updates the maintenance dates.
   * @param {AssetRosterDTO} data - The asset roster data to create.
   * @param {ClientSession} [session] - The client session to use for the create.
   * @returns {Promise<AssetRosterDocument>} - The created asset roster document.
   */
  override async create(
    data: AssetRosterDTO,
    session?: ClientSession | undefined,
  ): Promise<AssetRosterDocument> {
    return runTransaction<AssetRosterDocument>(session, async (newSession) => {
      const bucket = this.connectionManager.bindBucketToDb();

      // Handle file upload if provided
      if (isValidFileUpload(data.photo)) {
        const fileId = await bucket.uploadFile(
          Array.isArray(data.photo) ? data.photo[0] : data.photo,
        );
        data.photo = fileId as any; // Store the file ID in the assetRoster data
      }

      // assetType & make
      const makeId = await this.createMakeId(data, false, newSession);
      const assetTypeId = await this.createAssetTypeId(data, false, newSession);

      // Create the assetRoster
      let assetRoster = await super.create(
        { ...data, makeIds: [makeId], assetTypeIds: [assetTypeId] },
        newSession,
      );

      // If maintenance was sent, then update the maintenance dates
      if (data.maintenanceDate) {
        assetRoster =
          await this.assetRosterStatusService.updateAssetRosterMaintenanceDates(
            assetRoster._id,
            newSession,
          );
      }

      return assetRoster;
    });
  }

  /**
   * Updates an existing asset roster.
   * Handles file uploads if provided and updates the asset type and make IDs.
   * If maintenance date is provided, then updates the maintenance dates.
   * @param {UpdateAssetRosterDTO} data - The asset roster data to update.
   * @param {ClientSession} [session] - The client session to use for the update.
   * @returns {Promise<AssetRosterDocument>} - The updated asset roster document.
   * @throws {NotFoundException} - If the assetRoster does not exist.
   */
  override async update(
    data: UpdateAssetRosterDTO,
    session?: ClientSession | undefined,
  ): Promise<AssetRosterDocument> {
    return runTransaction<AssetRosterDocument>(session, async (newSession) => {
      const bucket = this.connectionManager.bindBucketToDb();
      const existing = await this.getById(data._id.toString(), newSession);

      if (!existing) throw new NotFoundException("Asset Roster does not exist");

      // Handle file upload if provided
      let photo = data.photo;

      // If a file is provided, upload it and store the file ID in the assetRoster data
      if (isValidFileUpload(photo)) {
        const fileId = await bucket.uploadFile(
          Array.isArray(photo) ? photo[0] : photo,
        );
        photo = fileId as any; // Store the file ID in the assetRoster data
      } else if (photo !== undefined) {
        // Delete the file if no file is provided and there is a value on the photo field
        photo = null;
      }

      // Handle file uploads for attachments
      let attachments = data.attachments;
      let attachmentsMetadata = data.attachmentsMetadata as object[];

      if (isValidFileUpload(attachments) && Array.isArray(attachments)) {
        attachments = await Promise.all(
          attachments.map<Promise<InnerFile>>(async (file, i) => ({
            fileId: await bucket.uploadFile(file),
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            fileMetadata: attachmentsMetadata?.[i],
          })),
        );
      } else if (attachments !== undefined) {
        // Delete the file if no file is provided and there is a value on the photo field
        attachments = null;
      }

      // assetType & make
      const makeId = await this.createMakeId(data, true, newSession);
      const assetTypeId = await this.createAssetTypeId(data, true, newSession);

      // Update the assetRoster
      let assetRoster = await super.update(
        {
          ...data,
          photo,
          attachments,
          ...(makeId && { makeIds: [makeId] }),
          ...(assetTypeId && { assetTypeIds: [assetTypeId] }),
        },
        newSession,
      );

      // If maintenance was sent, then update the maintenance dates
      if (data.maintenanceDate) {
        assetRoster =
          await this.assetRosterStatusService.updateAssetRosterMaintenanceDates(
            assetRoster._id,
            newSession,
          );
      }

      return assetRoster;
    });
  }

  /**
   * Skips the PM for an asset roster.
   * Updates the maintenance dates for the asset roster and adds an activity history.
   * @param {SkipAssetRosterPMDTO} data - The asset roster data to skip PM for.
   * @param {ClientSession} [session] - The client session to use for the update.
   * @returns {Promise<AssetRosterDocument>} - The updated asset roster document.
   */
  async skipAssetPM(
    data: SkipAssetRosterPMDTO,
    session?: ClientSession | undefined,
  ): Promise<AssetRosterDocument> {
    return await runTransaction<AssetRosterDocument>(
      session,
      async (newSession) => {
        const assetRoster =
          await this.assetRosterStatusService.updateNextAssetRosterMaintenanceDates(
            data._id,
            newSession,
          );

        await this.activityHistoryService.create(
          {
            title: "PM was skipped",
            details: "PM was skipped for the following reasons: " + data.notes,
            performDate: new Date(),
            model: "AssetRoster",
            modelId: data._id,
          },
          newSession,
        );

        return assetRoster;
      },
    );
  }

  /**
   * Creates an asset type if it does not exist, otherwise updates the existing asset type.
   * If the asset type is not provided, it throws a ValidationException if the asset roster is being created.
   * @param {AssetRosterDTO | UpdateAssetRosterDTO} data - The asset roster data.
   * @param {boolean} isUpdate - Whether the asset roster is being updated or created.
   * @param {ClientSession} session - The client session to use for the transaction.
   * @returns {Promise<string | undefined>} - A promise resolving to the ID of the asset type or undefined if the asset type was not created or updated.
   * @throws {ValidationException} - If the asset type is required but not provided.
   */
  private async createAssetTypeId(
    data: AssetRosterDTO | UpdateAssetRosterDTO,
    isUpdate: boolean,
    session: ClientSession,
  ) {
    return await runTransaction<string | undefined>(
      session,
      async (newSession) => {
        // assetType
        let assetTypeId = data.assetTypeIds?.[0] || undefined;

        if (data.assetTypeInformation && !assetTypeId) {
          assetTypeId = (
            data.assetTypeInformation._id
              ? await this.assetTypeService.update(
                  {
                    ...data.assetTypeInformation,
                    _id: data.assetTypeInformation._id || "",
                  },
                  newSession,
                )
              : await this.assetTypeService.create(
                  data.assetTypeInformation,
                  newSession,
                )
          )._id.toString();
        }

        if (!assetTypeId && !isUpdate)
          throw new ValidationException("Asset type is required");

        return assetTypeId;
      },
    );
  }

  /**
   * Creates or updates a make based on the provided make information.
   * If the make information is provided and the make ID is not, it creates a new make.
   * If the make information is not provided and the make ID is not, it throws a ValidationException.
   * @param {AssetRosterDTO | UpdateAssetRosterDTO} data - The asset roster data to create or update.
   * @param {boolean} isUpdate - Whether the function is being called to update an asset roster.
   * @param {ClientSession} session - The client session to use for the transaction.
   * @returns {Promise<string | undefined>} - A promise resolving to the ID of the make or undefined if the make was not created or updated.
   * @throws {ValidationException} - If the make is required but not provided.
   */
  private async createMakeId(
    data: AssetRosterDTO | UpdateAssetRosterDTO,
    isUpdate: boolean,
    session: ClientSession,
  ) {
    return await runTransaction<string | undefined>(
      session,
      async (newSession) => {
        // make
        let makeId = data.makeIds?.[0] || undefined;

        if (data.makeInformation && !makeId) {
          makeId = (
            data.makeInformation._id
              ? await this.contactsService.update(
                  {
                    ...data.makeInformation,
                    _id: data.makeInformation._id || "",
                  },
                  newSession,
                )
              : await this.contactsService.create(
                  data.makeInformation,
                  newSession,
                )
          )._id.toString();
        }

        if (!makeId && !isUpdate)
          throw new ValidationException("Make is required");

        return makeId;
      },
    );
  }

  /**
   * Exports all asset rosters in CSV format.
   * The function will return a Promise resolving to a Buffer containing the CSV data.
   * The CSV data will contain the following columns:
   * - productModel
   * - serialNumber
   * - acquiredDate
   * - acquiredPrice
   * - currentPrice
   * - condition
   * - assetTypes
   * - vendors
   * - makes
   * - maintenanceWindows
   * - location
   * - warrantyDate
   * - remarks
   * - status
   * - maintenanceDate
   * - active
   * @param {Record<string, any>[]} [data] - The data to export as a CSV file.
   * @returns {Promise<Buffer>} - A promise resolving to a Buffer containing the CSV data.
   */
  override async exportCSV(
    data?: Record<string, any>[],
    assetRosterIds?: string[],
  ): Promise<Buffer> {
    return runTransaction<Buffer>(undefined, async (newSession) => {
      const filter = {
        active: true,
        ...(assetRosterIds?.length ? { _id: { $in: assetRosterIds } } : {}),
      };

      const assetRosters = await this.get(
        filter,
        undefined,
        undefined,
        undefined,
        newSession,
      );

      const json = assetRosters.map((p) => ({
        id: String(p._id),
        productModel: p.productModel,
        serialNumber: p.serialNumber,
        acquiredDate: p.acquiredDate?.toISOString().split("T")[0] ?? "",
        acquiredPrice: p.acquiredPrice,
        currentPrice: p.currentPrice,
        condition: (p.conditionId as any)?.name ?? "",
        assetTypes: p.assetTypeIds?.map((t: any) => t.name).join(";"),
        vendors: p.vendorIds?.map((v: any) => v.email).join(";"),
        makes: p.makeIds.map((m: any) => m.email).join(";"),
        maintenanceWindows: p.maintenanceWindowIds
          .map((m: any) => m.name + " - " + m.recurrency)
          .join(";"),
        location: p.locationId ? p.locationId.code : "",
        warrantyDate: p.warrantyDate?.toISOString().split("T")[0] ?? "",
        remarks: p.remarks.map((r: any) => r.remark).join(";"),
        status:
          p.status
            ?.replace("-", " ")
            .split(" ")
            .map((s) => `${s.charAt(0).toUpperCase() + s.slice(1)}`)
            .join(" ") ?? "",
        maintenanceDate: p.maintenanceDate?.toISOString().split("T")[0] ?? "",
        active: p.active,
      }));

      return super.exportCSV(json, [
        "id",
        "productModel",
        "serialNumber",
        "acquiredDate",
        "acquiredPrice",
        "currentPrice",
        "condition",
        "assetTypes",
        "vendors",
        "makes",
        "maintenanceWindows",
        "location",
        "warrantyDate",
        "remarks",
        "status",
        "maintenanceDate",
        "active",
      ]);
    });
  }

  /**
   * Validates a parsed CSV payload before the actual import.
   * Runs only the database-lookup checks that class-validator cannot perform:
   * - location: each Room code must exist in the system.
   * - maintenanceWindows: each "name - recurrency" entry must exist in the system.
   *
   * Errors from every row are collected before throwing so the user can fix
   * all problems in one pass instead of re-validating after each correction.
   *
   * @param rows - Parsed and DTO-transformed CSV rows from the request body.
   * @returns { valid: true, rowCount } when all rows pass.
   * @throws ValidationException with a newline-separated list of messages on failure.
   */
  async validateImport(
    rows: AssetRosterCSVDTO[],
  ): Promise<{ valid: boolean; rowCount: number }> {
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowLabel = `Row ${i + 1}`;

      // Validate required-on-create fields when the row has no id (new record).
      if (!row.id?.trim()) {
        if (!row.productModel) {
          errors.push(
            `${rowLabel}: productModel is required when creating a new record.`,
          );
        }
        if (!row.acquiredDate) {
          errors.push(
            `${rowLabel}: acquiredDate is required when creating a new record.`,
          );
        }
        if (!row.assetTypes) {
          errors.push(
            `${rowLabel}: assetTypes is required when creating a new record.`,
          );
        }
      }

      // Validate location — must match an existing Room code or name.
      if (row.location) {
        const rooms = await this.roomService.get({
          $or: [{ code: row.location }, { name: row.location }],
        });
        if (!rooms[0]) {
          errors.push(
            `${rowLabel}: Location "${row.location}" was not found in the system. ` +
              `Ensure the value matches an existing Room code or name exactly.`,
          );
        }
      }

      // Validate maintenanceWindows — each semicolon-separated entry must be
      // in the exported format "name - recurrency" and match an existing record.
      if (row.maintenanceWindows) {
        const entries = row.maintenanceWindows
          .split(";")
          .map((e) => e.trim())
          .filter(Boolean);

        for (const entry of entries) {
          // Split on " - " from the right so names that contain " - " are preserved.
          const parts = entry.split(" - ");

          if (parts.length < 2) {
            errors.push(
              `${rowLabel}: Maintenance window "${entry}" is not in the expected format "name - recurrency".`,
            );
            continue;
          }

          const recurrency = parts[parts.length - 1].trim();
          const name = parts
            .slice(0, parts.length - 1)
            .join(" - ")
            .trim();

          const windows = await this.maintenanceWindowsService.get({
            name,
            recurrency,
          });

          if (!windows[0]) {
            errors.push(
              `${rowLabel}: Maintenance window "${entry}" was not found in the system. ` +
                `Ensure the name and recurrency match an existing Maintenance Window exactly.`,
            );
          }
        }
      }

      // Validate condition — must match an existing AssetCondition name exactly.
      if (row.condition) {
        const conditions = await this.conditionService.get({
          name: row.condition,
        });

        if (!conditions[0]) {
          errors.push(
            `${rowLabel}: Condition "${row.condition}" was not found in the system. ` +
              `Ensure the value matches an existing Condition name exactly.`,
          );
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationException(errors.join("\n"));
    }

    return { valid: true, rowCount: rows.length };
  }

  /**
   * Imports a CSV file into the database.
   * The function expects a plain array of objects to be passed as the first argument.
   * The objects should have the same structure as the records in the database.
   * The function runs within a transaction and returns the imported records as an array of documents.
   * @param data - The data to import as a CSV file.
   * @param session - The optional client session to use for the transaction.
   * @returns A promise resolving to the imported records as an array of documents.
   */
  override async importCSV(
    data: AssetRosterCSVDTO[],
    session?: ClientSession,
  ): Promise<AssetRosterDocument[]> {
    return await runTransaction<AssetRosterDocument[]>(
      session,
      async (newSession) => {
        if (!data || !Array.isArray(data) || data.length === 0) {
          throw new ValidationException("Invalid or empty import data");
        }

        const model = this.connectionManager.bindModelToDb(this.model);
        const seenIds = new Set<string>();
        const importedRecords: AssetRosterDocument[] = [];

        for (const assetRoster of data) {
          const hasField = (field: keyof AssetRosterCSVDTO): boolean =>
            Object.prototype.hasOwnProperty.call(assetRoster, field);

          const recordId = assetRoster.id?.trim() || undefined;

          if (recordId) {
            if (seenIds.has(recordId)) {
              throw new ValidationException(
                `The ID "${recordId}" appears more than once in the CSV file.`,
              );
            }

            seenIds.add(recordId);
          }

          const existingRecord = recordId
            ? await model.findById(recordId).session(newSession)
            : null;

          // Required fields are validated here so the error message is clear
          // and points to the row rather than the DTO layer.
          if (!existingRecord) {
            if (!assetRoster.productModel) {
              throw new ValidationException(
                "productModel is required when creating a new record.",
              );
            }
            if (!assetRoster.acquiredDate) {
              throw new ValidationException(
                "acquiredDate is required when creating a new record.",
              );
            }
            if (!assetRoster.assetTypes) {
              throw new ValidationException(
                "assetTypes is required when creating a new record.",
              );
            }
          }

          // Resolve assetTypes only when the column was selected.
          let assetTypeIds: any[] | undefined;
          if (hasField("assetTypes")) {
            const assetTypeNames = assetRoster.assetTypes
              ? assetRoster.assetTypes
                  .split(";")
                  .map((name) => name.trim())
                  .filter(Boolean)
              : [];

            if (assetTypeNames.length === 0 && !existingRecord) {
              throw new ValidationException(
                "At least one asset type is required when creating a new record.",
              );
            }

            // Find or create asset types.
            assetTypeIds = await Promise.all(
              assetTypeNames.map(async (name) => {
                let assetType = (
                  await this.assetTypeService.get(
                    { name },
                    undefined,
                    undefined,
                    undefined,
                    newSession,
                  )
                )[0];

                if (!assetType) {
                  assetType = await this.assetTypeService.create(
                    { name },
                    newSession,
                  );
                }

                return assetType._id;
              }),
            );
          }

          const vendorEmails = assetRoster.vendors
            ?.split(";")
            .map((email) => email.trim())
            .filter(Boolean);

          // Only resolve and replace vendors when the column was selected.
          const vendorIds = hasField("vendors")
            ? vendorEmails
              ? await Promise.all(
                  vendorEmails.map(async (email) => {
                    let vendor = (
                      await this.contactsService.get(
                        { email },
                        undefined,
                        undefined,
                        undefined,
                        newSession,
                      )
                    )[0];

                    if (!vendor) {
                      vendor = await this.contactsService.create(
                        {
                          name: "default",
                          lastName: "default",
                          email,
                          phoneNumber: "0000000000",
                          type: "company",
                        },
                        newSession,
                      );
                    }

                    return vendor._id;
                  }),
                )
              : []
            : undefined;

          const makeEmails = assetRoster.makes
            ?.split(";")
            .map((email) => email.trim())
            .filter(Boolean);

          // Only resolve and replace makes when the column was selected.
          const makeIds = hasField("makes")
            ? makeEmails
              ? await Promise.all(
                  makeEmails.map(async (email) => {
                    let make = (
                      await this.contactsService.get(
                        { email },
                        undefined,
                        undefined,
                        undefined,
                        newSession,
                      )
                    )[0];

                    if (!make) {
                      make = await this.contactsService.create(
                        {
                          name: "default",
                          lastName: "default",
                          email,
                          phoneNumber: "0000000000",
                          type: "company",
                        },
                        newSession,
                      );
                    }

                    return make._id;
                  }),
                )
              : []
            : undefined;

          // Resolve location by Room code or name when the column was selected.
          // Errors if neither matches any Room in the system.
          let resolvedLocationId: any = undefined; // undefined = column not selected; null = clear
          if (hasField("location")) {
            if (assetRoster.location) {
              const rooms = await this.roomService.get(
                {
                  $or: [
                    { code: assetRoster.location },
                    { name: assetRoster.location },
                  ],
                },
                undefined,
                undefined,
                undefined,
                newSession,
              );
              const room = rooms[0];
              if (!room) {
                throw new ValidationException(
                  `Location "${assetRoster.location}" was not found in the system. ` +
                    `Ensure the value matches an existing Room code or name exactly.`,
                );
              }
              resolvedLocationId = room._id;
            } else {
              // Column was selected but cell is empty — clear the location.
              resolvedLocationId = null;
            }
          }

          // Resolve maintenance windows when the column was selected.
          // Each entry must be in the exported format "name - recurrency".
          // Errors if any entry does not match an existing Maintenance Window.
          let resolvedMaintenanceWindowIds: any[] | undefined;
          if (hasField("maintenanceWindows")) {
            if (assetRoster.maintenanceWindows) {
              const entries = assetRoster.maintenanceWindows
                .split(";")
                .map((e) => e.trim())
                .filter(Boolean);

              resolvedMaintenanceWindowIds = await Promise.all(
                entries.map(async (entry) => {
                  // The export format is "name - recurrency".
                  // Split on " - " from the right so names containing " - " are preserved.
                  const parts = entry.split(" - ");

                  if (parts.length < 2) {
                    throw new ValidationException(
                      `Maintenance window "${entry}" is not in the expected format "name - recurrency".`,
                    );
                  }

                  const recurrency = parts[parts.length - 1].trim();
                  const name = parts
                    .slice(0, parts.length - 1)
                    .join(" - ")
                    .trim();

                  const windows = await this.maintenanceWindowsService.get(
                    { name, recurrency },
                    undefined,
                    undefined,
                    undefined,
                    newSession,
                  );

                  const window = windows[0];

                  if (!window) {
                    throw new ValidationException(
                      `Maintenance window "${entry}" was not found in the system. ` +
                        `Ensure the name and recurrency match an existing Maintenance Window exactly.`,
                    );
                  }

                  return window._id;
                }),
              );
            } else {
              // Column selected but empty — clear the maintenance windows.
              resolvedMaintenanceWindowIds = [];
            }
          }

          // Build importData using only selected columns for updates;
          // required fields are always included for new records.
          const importData: Record<string, any> = {};

          if (hasField("productModel") || !existingRecord) {
            importData.productModel = assetRoster.productModel;
          }

          if (hasField("serialNumber") || !existingRecord) {
            importData.serialNumber = assetRoster.serialNumber;
          }

          if (hasField("acquiredDate") || !existingRecord) {
            importData.acquiredDate = assetRoster.acquiredDate;
          }

          if (assetTypeIds !== undefined) {
            importData.assetTypeIds = assetTypeIds;
          }

          if (resolvedLocationId !== undefined) {
            importData.locationId = resolvedLocationId;
          }

          if (resolvedMaintenanceWindowIds !== undefined) {
            importData.maintenanceWindowIds = resolvedMaintenanceWindowIds;
          }

          if (hasField("acquiredPrice")) {
            importData.acquiredPrice = assetRoster.acquiredPrice;
          }

          if (hasField("currentPrice")) {
            importData.currentPrice = assetRoster.currentPrice;
          }

          if (hasField("condition")) {
            if (assetRoster.condition) {
              const conditions = await this.conditionService.get(
                { name: assetRoster.condition },
                undefined,
                undefined,
                undefined,
                newSession,
              );

              const condition = conditions[0];

              if (!condition) {
                throw new ValidationException(
                  `Condition "${assetRoster.condition}" was not found in the system. ` +
                    `Ensure the value matches an existing Condition name exactly.`,
                );
              }

              importData.conditionId = condition._id;
            } else {
              importData.conditionId = null;
            }
          }

          if (hasField("warrantyDate")) {
            importData.warrantyDate = assetRoster.warrantyDate;
          }

          if (hasField("active")) {
            importData.active = assetRoster.active;
          }

          // For a new record, omitted relationship columns become empty arrays.
          // For an existing record, omitted columns are preserved.
          if (hasField("vendors") || !existingRecord) {
            importData.vendorIds = vendorIds ?? [];
          }

          if (hasField("makes") || !existingRecord) {
            importData.makeIds = makeIds ?? [];
          }

          if (hasField("remarks") || !existingRecord) {
            importData.remarks = assetRoster.remarks
              ? assetRoster.remarks.split(";").map((remark) => ({
                  remark: remark.trim(),
                  performDate: new Date(),
                  createdBy: userStorage.getStore()?.user?._id,
                }))
              : [];
          }

          if (existingRecord && recordId) {
            const updatedRecord = await model.findByIdAndUpdate(
              recordId,
              { $set: importData },
              {
                new: true,
                runValidators: true,
                session: newSession,
              },
            );

            if (!updatedRecord) {
              throw new ValidationException(
                `Asset Roster record "${recordId}" could not be updated.`,
              );
            }

            importedRecords.push(updatedRecord as AssetRosterDocument);
            continue;
          }

          const [createdRecord] = await model.create(
            [
              {
                ...(recordId ? { _id: recordId } : {}),
                ...importData,
              },
            ],
            { session: newSession },
          );

          importedRecords.push(createdRecord as AssetRosterDocument);
        }

        return importedRecords;
      },
    );
  }

  /**
   * Reads maintenance documents and generates a response based on the contents of the documents.
   * If a question is provided, the response will be an answer to the question based on the document contents.
   * If no question is provided, the response will be structured information extracted from the documents.
   * @param {Express.Multer.File[]} files - The maintenance documents to read.
   * @param {string} [question] - The question to answer based on the document contents.
   * @returns {Promise<any>} - A promise resolving to the generated response.
   * @throws {InternalServerException} - If there is an error processing the maintenance documents.
   */
  async readMaintenanceDocuments(
    files: Express.Multer.File[],
    question?: string,
  ): Promise<any> {
    try {
      const parts = files.map((file) =>
        this.genAIService.fileToGenerativePart(file),
      );

      const response = await this.genAIService.generate({
        question: question || "",
        context: `
          You are an expert document assistant.
          If a question is provided, answer it strictly using the document and give answers.
          If no question is provided, extract structured information.
          Do not invent data.
          Return only valid output.
        `,
        promptParts: parts,
      });

      return response.text || "";
    } catch (error: any) {
      console.error("GenAI error:", error);
      throw new InternalServerException(
        "Error processing maintenance documents",
      );
    }
  }
}
