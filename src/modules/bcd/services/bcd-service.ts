import { BCDDocument } from "@mongodb-types";
import {
  BaseService,
  GridFSBucketService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { bcdModel } from "../models/bcd.model";
import { CsvBuilderService } from "./csv-builder";
import { FTPService } from "../../ftp";
import { ClientSession } from "mongoose";
import { UpdateBcdDTO } from "../models/bcd.dto";
import dayjs from "dayjs";

export class BCDService extends BaseService<BCDDocument> {
  private csvBuilder = new CsvBuilderService();
  private ftpService = new FTPService();

  constructor() {
    super({
      model: bcdModel,
    });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  /**
   * Updates a BCD record with the given data.
   * The record is identified by the `_id` field in the provided data,
   * which is removed from the update data before performing the update.
   * The function runs within a transaction and returns the updated record.
   * If the BCD record does not exist, a ValidationException is thrown.
   * If the BCD record has already been sent to the government (status !== "DRAFT"),
   * a ValidationException is thrown.
   *
   * @param data - The data to update the record with. Must include the `_id` of the record to update.
   * @param session - The optional client session to use for the transaction.
   * @returns The updated record document.
   */
  override async update(
    data: UpdateBcdDTO,
    session?: ClientSession | undefined
  ) {
    // Fetch BCD data by ID
    const bcd = await this.getById(data._id, undefined);

    // Validate BCD data existence
    if (!bcd) throw new ValidationException("BCD data not found");
    if (bcd.status !== "DRAFT")
      throw new ValidationException(
        "BCD data has already been sent to the government"
      );

    return await super.update(data, session);
  }

  /**
   * Uploads a BCD record to the FTP server and updates the BCD record to have a status of "PENDING_RESPONSE".
   * The BCD record is identified by the `_id` parameter.
   * The function runs within a transaction and returns the updated BCD record.
   * If the BCD record does not exist, a ValidationException is thrown.
   * If the BCD record has already been sent to the government (status !== "DRAFT"),
   * a ValidationException is thrown.
   *
   * @param _id - The ID of the BCD record to upload.
   * @param session - The optional client session to use for the transaction.
   * @returns The updated BCD record document.
   */
  async uploadBCDDataToFTP(_id: string, session?: ClientSession | undefined) {
    return await runTransaction(session, async (newSession) => {
      // * Fetch BCD data by ID
      const bcd = await this.getById(_id, newSession);

      // * Validate BCD data existence
      if (!bcd) throw new ValidationException("BCD data not found");

      // * Generate name
      const bcds = await this.get(
        {
          shippingId: bcd.shippingId._id,
          _id: { $ne: _id },
        },
        undefined,
        undefined,
        undefined,
        newSession
      );

      // get sequence
      const filename = `${bcd.declarant.companyId}${this.getBCDDateName(
        bcds
      )}_${this.getBCDConsecutiveName(bcds)}`;

      // * get csv string
      const csvString = this.csvBuilder.create(bcd);

      // * Convert CSV string to a Blob/File
      const csvBlob = new Blob([csvString], { type: "text/csv" });
      const csvFile = new File([csvBlob], `${filename}.csv`, {
        type: "text/csv",
      });

      // * Upload CSV file to FTP
      await this.ftpService.upload(csvFile);

      // * upload file to GridFS
      const fileId = await this.gridFSBucket.uploadFile(csvFile);

      // * if uploaded correctly
      const updatedBCD = await super.update(
        {
          _id,
          status: "PENDING_RESPONSE",
          ebcds: [
            {
              file: {
                fileId: fileId,
                name: filename,
                mimeType: csvFile.type,
                size: csvFile.size,
              },
              type: "CSV",
            },
          ],
        },
        newSession
      );

      return updatedBCD;
    });
  }

  /**
   * Gets the consecutive name of the BCD data.
   * @param bcds - The array of BCD data.
   * @returns The consecutive name of the BCD data.
   * @example
   * const bcds = [...]; // array of BCD data
   * const consecutiveName = getBCDConsecutiveName(bcds);
   * console.log(consecutiveName); // "0001", "0002", ...
   */
  private getBCDConsecutiveName(bcds: BCDDocument[]) {
    const csvs = bcds
      .flatMap((bcd) => bcd.ebcds)
      .filter((ebcd) => ebcd.type === "CSV");

    if (csvs.length < 1) return "0001";

    // * sort by consecutive
    csvs.sort((a, b) => {
      const consecutiveA = a.file.name.split("_")?.[1]?.split(".")?.[0]; // 0001
      const consecutiveB = b.file.name.split("_")?.[1]?.split(".")?.[0]; // 0021

      return Number(consecutiveA) - Number(consecutiveB);
    });

    // * get consecutive
    const lastConsecutive = csvs[csvs.length - 1].file.name
      .split("_")?.[1]
      ?.split(".")?.[0];

    return String(Number(lastConsecutive) + 1).padStart(4, "0");
  }

  /**
   * Gets the date name of the BCD data.
   * The date name is retrieved from the filename of the first CSV EBCD.
   * If there are no CSV EBCDs, the current date is returned in the format "DDMMYYYY".
   * @param bcds - The array of BCD data.
   * @returns The date name of the BCD data.
   * @example
   * const bcds = [...]; // array of BCD data
   * const dateName = getBCDDateName(bcds);
   * console.log(dateName); // "11075415"
   */
  private getBCDDateName(bcds: BCDDocument[]) {
    const csvs = bcds
      .flatMap((bcd) => bcd.ebcds)
      .filter((ebcd) => ebcd.type === "CSV");

    if (csvs.length < 1) return dayjs().format("DDMMYYYY");

    // * get date from any ebcd
    const anyEbcdFileName = csvs[0].file.name;

    // 11075415032025_0001.csv => [11075415032025, 0001]
    const date = anyEbcdFileName.split("_")?.[0]?.slice(-8);

    return date;
  }
}
