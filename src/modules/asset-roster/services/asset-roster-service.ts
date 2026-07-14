import { ClientSession } from "mongoose";
import {
  BaseService,
  InternalServerException,
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
import { AssetTypeService } from "./asset-type-service";
import { GenAIService } from "../../ai/services/genai-service";

export class AssetRosterService extends BaseService<AssetRosterDocument> {
  private assetRosterStatusService = new AssetRosterStatusService();
  private assetTypeService = new AssetTypeService();
  private contactsService = new ContactService();
  private activityHistoryService = new ActivityHistoryService();
  private readonly genAIService = new GenAIService();

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
        data.photo = fileId; // Store the file ID in the assetRoster data
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
  override async exportCSV(data?: Record<string, any>[]): Promise<Buffer> {
    return runTransaction<Buffer>(undefined, async (newSession) => {
      const assetRosters = await this.get(
        { active: true },
        undefined,
        undefined,
        undefined,
        newSession,
      );

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
        if (!data || !Array.isArray(data)) {
          throw new ValidationException("Invalid data format");
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
                  newSession,
                )
              )[0];

              if (!assetType)
                assetType = await this.assetTypeService.create(
                  {
                    name,
                  },
                  newSession,
                );

              return assetType._id;
            }),
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
                      newSession,
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
                      newSession,
                    );

                  return vendor._id;
                }),
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
                      newSession,
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
                      newSession,
                    );

                  return make._id;
                }),
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
