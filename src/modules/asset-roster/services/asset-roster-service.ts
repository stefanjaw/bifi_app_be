import mongoose, { ClientSession, PaginateModel } from "mongoose";
import {
  BaseService,
  GridFSBucketService,
  NotFoundException,
  runTransaction,
  ValidationException,
} from "../../../system";
import { assetRosterModel } from "../models/asset-roster.model";
import { isValidFileUpload } from "../../../system/libraries/file-storage/file-utils";
import {
  AssetRosterDTO,
  SkipAssetRosterPMDTO,
  UpdateAssetRosterDTO,
} from "../models/asset-roster.dto";
import { InnerFile } from "../../../system/libraries/file-storage/file-upload.types";
import { ContactService } from "../../contacts/services/contact-service";
import { AssetRosterCSVDTO } from "../models/asset-roster-csv.dto";
import {
  ContactDocument,
  AssetRosterDocument,
  RoomDocument,
  AssetTypeDocument,
} from "@mongodb-types";
import { ActivityHistoryService } from "../../activity-history/services/activity-history-service";
import { AssetRosterStatusService } from "./asset-roster-status-service";
import { AssetTypeService } from "../../asset-types/services/asset-type-service";

export class AssetRosterService extends BaseService<AssetRosterDocument> {
  private assetRosterStatusService = new AssetRosterStatusService();
  private assetTypeService = new AssetTypeService();
  private contactsService = new ContactService();
  private activityHistoryService = new ActivityHistoryService();

  constructor() {
    super({
      model: assetRosterModel,
      refFields: [
        {
          path: "assetTypeIds",
          getModel: () =>
            mongoose.model("AssetType") as PaginateModel<AssetTypeDocument>,
          isArray: true,
        },
        {
          path: "vendorIds",
          getModel: () =>
            mongoose.model("Contact") as PaginateModel<ContactDocument>,
          isArray: true,
        },
        {
          path: "makeIds",
          getModel: () =>
            mongoose.model("Contact") as PaginateModel<ContactDocument>,
          isArray: true,
        },
        {
          path: "locationId",
          getModel: () => mongoose.model("Room") as PaginateModel<RoomDocument>,
          isArray: false,
        },
      ],
    });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  override async create(
    data: AssetRosterDTO,
    session?: ClientSession | undefined
  ): Promise<AssetRosterDocument> {
    return runTransaction<AssetRosterDocument>(session, async (newSession) => {
      // Handle file upload if provided
      if (isValidFileUpload(data.photo)) {
        const fileId = await this.gridFSBucket.uploadFile(
          Array.isArray(data.photo) ? data.photo[0] : data.photo
        );
        data.photo = fileId; // Store the file ID in the assetRoster data
      }

      // assetType & make
      const makeId = await this.createMakeId(data, false, newSession);
      const assetTypeId = await this.createAssetTypeId(data, false, newSession);

      // Create the assetRoster
      let assetRoster = await super.create(
        { ...data, makeIds: [makeId], assetTypeIds: [assetTypeId] },
        newSession
      );

      // If maintenance was sent, then update the maintenance dates
      if (data.maintenanceDate) {
        assetRoster =
          await this.assetRosterStatusService.updateAssetRosterMaintenanceDates(
            assetRoster._id,
            newSession
          );
      }

      return assetRoster;
    });
  }

  override async update(
    data: UpdateAssetRosterDTO,
    session?: ClientSession | undefined
  ): Promise<AssetRosterDocument> {
    return runTransaction<AssetRosterDocument>(session, async (newSession) => {
      const existing = await this.model.findById(data._id);
      if (!existing) throw new NotFoundException("Asset Roster does not exist");

      // Handle file upload if provided
      let photo = data.photo;

      // If a file is provided, upload it and store the file ID in the assetRoster data
      if (isValidFileUpload(photo)) {
        const fileId = await this.gridFSBucket.uploadFile(
          Array.isArray(photo) ? photo[0] : photo
        );
        photo = fileId; // Store the file ID in the assetRoster data
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
            fileId: await this.gridFSBucket.uploadFile(file),
            name: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            fileMetadata: attachmentsMetadata?.[i],
          }))
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
        newSession
      );

      // If maintenance was sent, then update the maintenance dates
      if (data.maintenanceDate) {
        assetRoster =
          await this.assetRosterStatusService.updateAssetRosterMaintenanceDates(
            assetRoster._id,
            newSession
          );
      }

      return assetRoster;
    });
  }

  async skipAssetPM(
    data: SkipAssetRosterPMDTO,
    session?: ClientSession | undefined
  ): Promise<AssetRosterDocument> {
    return await runTransaction<AssetRosterDocument>(
      session,
      async (newSession) => {
        const assetRoster =
          await this.assetRosterStatusService.updateNextAssetRosterMaintenanceDates(
            data._id,
            newSession
          );

        await this.activityHistoryService.create(
          {
            title: "PM was skipped",
            details: "PM was skipped for the following reasons: " + data.notes,
            performDate: new Date(),
            model: "AssetRoster",
            modelId: data._id,
          },
          newSession
        );

        return assetRoster;
      }
    );
  }

  private async createAssetTypeId(
    data: AssetRosterDTO | UpdateAssetRosterDTO,
    isUpdate: boolean,
    session: ClientSession
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
                  newSession
                )
              : await this.assetTypeService.create(
                  data.assetTypeInformation,
                  newSession
                )
          )._id.toString();
        }

        if (!assetTypeId && !isUpdate)
          throw new ValidationException("Asset type is required");

        return assetTypeId;
      }
    );
  }

  private async createMakeId(
    data: AssetRosterDTO | UpdateAssetRosterDTO,
    isUpdate: boolean,
    session: ClientSession
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
                  newSession
                )
              : await this.contactsService.create(
                  data.makeInformation,
                  newSession
                )
          )._id.toString();
        }

        if (!makeId && !isUpdate)
          throw new ValidationException("Make is required");

        return makeId;
      }
    );
  }

  override async exportCSV(data?: Record<string, any>[]): Promise<Buffer> {
    return runTransaction<Buffer>(undefined, async (newSession) => {
      const assetRosters = await this.model.find().session(newSession);

      const json = assetRosters.map((p) => ({
        productModel: p.productModel,
        serialNumber: p.serialNumber,
        acquiredDate: p.acquiredDate?.toISOString().split("T")[0] ?? "",
        acquiredPrice: p.acquiredPrice,
        currentPrice: p.currentPrice,
        condition: p.condition,
        assetTypes: p.assetTypeIds?.map((t: any) => t.name).join(";"),
        vendors: p.vendorIds?.map((v: any) => v.email).join(";"),
        makes: p.makeIds.map((m: any) => m.email).join(";"),
        maintenanceWindows: p.maintenanceWindowIds
          .map((m: any) => m.name + " - " + m.recurrency)
          .join(";"),
        location: p.locationId ? p.locationId.code : "",
        warrantyDate: p.warrantyDate?.toISOString().split("T")[0] ?? "",
        remarks: p.remarks,
        status:
          p.status
            ?.replace("-", " ")
            .split(" ")
            .map((s) => `${s.charAt(0).toUpperCase() + s.slice(1)}`)
            .join(" ") ?? "",
        maintenanceDate: p.maintenanceDate?.toISOString().split("T")[0] ?? "",
        active: p.active,
      }));

      return super.exportCSV(json);
    });
  }

  override async importCSV(
    data: AssetRosterCSVDTO[],
    session?: ClientSession
  ): Promise<AssetRosterDocument[]> {
    return await runTransaction<AssetRosterDocument[]>(
      session,
      async (newSession) => {
        if (!data || !Array.isArray(data)) {
          throw new Error("Invalid data format");
        }

        const assetRosters: any[] = [];

        for (const assetRoster of data) {
          const assetTypeNames = assetRoster.assetTypes.split(";");
          const vendorEmails = assetRoster.vendors?.split(";");
          const makeEmails = assetRoster.makes?.split(";");

          // Find or create assetRoster types
          const assetTypeIds = await Promise.all(
            assetTypeNames.map(async (name) => {
              let assetType = (
                await this.assetTypeService.get(
                  { name },
                  undefined,
                  undefined,
                  undefined,
                  newSession
                )
              )[0];

              if (!assetType)
                assetType = await this.assetTypeService.create(
                  {
                    name,
                  },
                  newSession
                );

              return assetType._id;
            })
          );

          // Find or create vendors
          const vendorIds = vendorEmails
            ? await Promise.all(
                vendorEmails.map(async (email) => {
                  let vendor = (
                    await this.contactsService.get(
                      { email },
                      undefined,
                      undefined,
                      undefined,
                      newSession
                    )
                  )[0];

                  if (!vendor)
                    vendor = await this.contactsService.create(
                      {
                        name: "default",
                        lastName: "default",
                        email,
                        phoneNumber: "0000000000",
                        type: "company",
                      },
                      newSession
                    );

                  return vendor._id;
                })
              )
            : [];

          // Find or create makes
          const makeIds = makeEmails
            ? await Promise.all(
                makeEmails.map(async (email) => {
                  let make = (
                    await this.contactsService.get(
                      { email },
                      undefined,
                      undefined,
                      undefined,
                      newSession
                    )
                  )[0];

                  if (!make)
                    make = await this.contactsService.create(
                      {
                        name: "default",
                        lastName: "default",
                        email,
                        phoneNumber: "0000000000",
                        type: "company",
                      },
                      newSession
                    );

                  return make._id;
                })
              )
            : [];

          assetRosters.push({
            productModel: assetRoster.productModel,
            serialNumber: assetRoster.serialNumber,
            acquiredDate: assetRoster.acquiredDate,
            acquiredPrice: assetRoster.acquiredPrice,
            currentPrice: assetRoster.currentPrice,
            condition: assetRoster.condition,
            assetTypeIds: assetTypeIds,
            vendorIds: vendorIds,
            makeIds: makeIds,
            warrantyDate: assetRoster.warrantyDate,
            remarks: assetRoster.remarks,
            active: assetRoster.active,
          });
        }

        return await super.importCSV(assetRosters, newSession);
      }
    );
  }
}
