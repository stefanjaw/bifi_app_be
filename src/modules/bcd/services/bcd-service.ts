import { BCDDocument } from "@mongodb-types";
import {
  BaseService,
  ftpResponse,
  FTPService,
  GridFSBucketService,
  runTransaction,
  ValidationException,
} from "../../../system";
import { bcdModel } from "../models/bcd.model";
import { CsvBuilderService } from "./csv-builder";
import { ClientSession } from "mongoose";
import { UpdateBcdDTO } from "../models/bcd.dto";
import mime from "mime-types";
import dayjs from "dayjs";
import { BCDStatusTypeEnum, EBCDTypeEnum } from "../models/bcd.types";
import { FileInfo } from "basic-ftp";

export class BCDService extends BaseService<BCDDocument> {
  private csvBuilder = new CsvBuilderService();

  constructor() {
    super({
      model: bcdModel,
    });
  }

  private get gridFSBucket() {
    return GridFSBucketService.getInstance();
  }

  private get ftpService() {
    return FTPService.getInstance();
  }

  /**
   * Updates a BCD document with the given data.
   * The function runs within a transaction and returns the updated record.
   * The function first checks if the BCD data exists and its status is "DRAFT".
   * If the data does not exist or its status is not "DRAFT", a ValidationException is thrown.
   *
   * @param data - The data to update the record with.
   * @param session - The optional client session to use for the transaction.
   * @returns The updated record document.
   */
  override async update(
    data: UpdateBcdDTO,
    session?: ClientSession | undefined,
  ) {
    // Fetch BCD data by ID
    const bcd = await this.getById(data._id, undefined);

    // Validate BCD data existence
    if (!bcd) throw new ValidationException("BCD data not found");
    if (bcd.status !== "DRAFT")
      throw new ValidationException(
        "BCD data has already been sent to the government",
      );

    return await super.update(data, session);
  }

  //#region EBCD FILE TREATMENTS
  /**
   * Uploads a BCD record as a CSV file to the FTP server.
   * The function fetches the BCD record by the provided `_id` and validates its existence.
   * If the BCD record has already been sent to the government (status !== "DRAFT"),
   * a ValidationException is thrown.
   * The function generates a new filename for the CSV file and uploads the file to the FTP server.
   * The function also uploads the file to GridFS and updates the BCD record with the uploaded file information.
   * The function returns the updated BCD record document.
   *
   * @param _id - The ID of the BCD record to upload as a CSV file.
   * @param session - The optional client session to use for the transaction.
   */
  async uploadBCDDataToFTP(_id: string, session?: ClientSession | undefined) {
    return await runTransaction(session, async (newSession) => {
      // * Fetch BCD data by ID
      const bcd = await this.getById(_id, newSession);

      // * Validate BCD data existence
      if (!bcd) throw new ValidationException("BCD data not found");

      // * Validate a file is not already uploaded
      if (bcd.status !== "DRAFT")
        throw new ValidationException(
          "BCD data has already been sent to the government",
        );

      // * Generate name
      const bcds = await this.get(
        {
          shippingId: bcd.shippingId._id,
          _id: { $ne: _id },
        },
        undefined,
        undefined,
        undefined,
        newSession,
      );

      // * get csv string
      const csvString = this.csvBuilder.create(bcd);

      // * Convert CSV string to a Blob/File
      const filename = this.getNewEBCDSentCSVName(
        bcd.declarant.companyId,
        bcds,
      );

      const csvBlob = new Blob([csvString], { type: "text/csv" });
      const csvFile = new File([csvBlob], `${filename}`, {
        type: "text/csv",
      });

      // * Upload CSV file to FTP
      await this.ftpService.upload(csvFile, "/inbox", filename);

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
              type: "SENT_CSV",
            },
          ],
        },
        newSession,
      );

      return updatedBCD;
    });
  }

  /**
   * Updates BCD documents by checking FTP for new files and updating the documents accordingly.
   * The function runs within a transaction and returns an array of updated BCD documents.
   * The function first gets all BCD documents with the status "PENDING_RESPONSE".
   * Then it lists all files in the FTP folder "/outbox".
   * If no files are found, the function returns an empty array.
   * For each BCD document, the function checks if a REC.TXT file is present in the FTP folder.
   * If a REC.TXT file is found, the function gets the BCD number from the file and finds all files with that number in the FTP folder.
   * If no REC.TXT file is found, the function checks if an error file is present in the FTP folder.
   * If an error file is found, the function adds it to the array of files to process.
   * The function then uploads the files to GridFS and updates the BCD documents with the uploaded files.
   * The function then moves the files from the FTP folder "/outbox" to "/outbox/proccessed".
   * @param {ClientSession | undefined} session - The optional client session to use for the transaction.
   * @returns {Promise<BCDDocument[]>} - An array of updated BCD documents.
   */
  async updateBCDsFromFTP(session?: ClientSession | undefined) {
    return await runTransaction(session, async (newSession) => {
      // * get bcds
      const bcds = await this.get(
        {
          status: "PENDING_RESPONSE",
        },
        undefined,
        undefined,
        undefined,
        newSession,
      );

      // * get ftp files
      const ftpFiles = await this.ftpService.list({
        path: "/outbox",
      });

      // * if no files found
      if (ftpFiles.length === 0) return [];

      // * set updated bcds
      const updatedBCDs: BCDDocument[] = [];

      for (const bcd of bcds) {
        const recFile = ftpFiles.find(
          (f) =>
            f.metadata.name.includes("REC.TXT") &&
            f.buffer.toString("utf-8").includes(this.getSentCSVName(bcd)),
        );

        const proccessedFTPFiles: ftpResponse[] = [];

        if (recFile) {
          // * if rec file is found, get number and find all files with that number
          const bcdNumber = this.getBCDNumberFromFTPFile(recFile.buffer);
          const filesWithNumber = ftpFiles.filter((f) =>
            f.metadata.name.includes(`BCD${bcdNumber}`),
          );

          filesWithNumber.forEach((f) => proccessedFTPFiles.push(f));
        } else {
          // * if rec file is not found, check if error file is present
          const [name, prefix] = this.getSentCSVName(bcd).split(".");
          const errorFilename = `${name}E.${prefix}`;
          const errorFile = ftpFiles.find(
            (f) => f.metadata.name === errorFilename,
          );

          if (errorFile) proccessedFTPFiles.push(errorFile);
        }

        // * upload files
        const files = await Promise.all(
          proccessedFTPFiles.map(async (ftpFile) => {
            const buffer = new Uint8Array(ftpFile.buffer);
            const mimeType = mime.lookup(ftpFile.metadata.name);

            const file = new File([buffer], ftpFile.metadata.name, {
              lastModified: Date.now(),
              type: mimeType ? mimeType : "text/csv",
            });

            return {
              file: {
                name: ftpFile.metadata.name,
                size: ftpFile.metadata.size,
                mimeType: mimeType ? mimeType : "text/csv",
                fileId: await this.gridFSBucket.uploadFile(file),
              },
              type: this.resolveEBCDType(ftpFile.metadata.name),
            };
          }),
        );

        const updatedBCD = await super.update(
          {
            _id: bcd._id,
            ebcds: [...bcd.ebcds, ...files],
            status: this.resolveBCDStatus(files.map((f) => f.type)),
          },
          newSession,
        );

        updatedBCDs.push(updatedBCD);
      }

      // * move files
      await this.ftpService.moveFiles(
        ftpFiles.map((f) => ({ path: "/outbox", filename: f.metadata.name })),
        "/outbox/proccessed",
      );

      return updatedBCDs;
    });
  }

  // ======================= EBCD UTILS =======================
  /**
   * Generates a new filename for a SENT_CSV EBCD document, given an array of BCD documents.
   * The filename will be in the format {companyName}{date}.{consecutive number}.
   * The consecutive number is determined by the last consecutive number in the given array of BCD documents,
   * and the date is the date of the first BCD document in the given array.
   * If there are no SENT_CSV EBCD documents in the given array, the filename will be in the format {companyName}{date}.0001.
   * @param {string} companyName - The company name to use in the filename.
   * @param {BCDDocument[]} bcds - The array of BCD documents to generate the filename from.
   * @returns {string} - The generated filename.
   */
  private getNewEBCDSentCSVName(companyName: string, bcds: BCDDocument[]) {
    const csvs = bcds
      .flatMap((bcd) => bcd.ebcds)
      .filter((ebcd) => ebcd.type === "SENT_CSV");

    if (csvs.length === 0)
      return `${companyName}${dayjs().format("DDMMYYYY")}.0001`;

    // * sort by consecutive
    csvs.sort((a, b) => {
      const consecutiveA = a.file.name?.split(".")?.[1]; // 0001
      const consecutiveB = b.file.name?.split(".")?.[1]; // 0021

      return Number(consecutiveA) - Number(consecutiveB);
    });

    // * get consecutive
    const lastConsecutive = csvs[csvs.length - 1].file.name?.split(".")?.[1];

    // * get date
    const lastDate = csvs[0].file.name.split(".")?.[0]?.slice(-8);

    return `${companyName}${lastDate}.${String(
      Number(lastConsecutive) + 1,
    ).padStart(4, "0")}`;
  }

  /**
   * Gets the filename of the first SENT_CSV EBCD document in the given BCD document.
   * If no SENT_CSV EBCD document is found, an empty string is returned.
   * @param {BCDDocument} bcd - The BCD document to get the filename from.
   * @returns {string} - The filename of the first SENT_CSV EBCD document in the given BCD document.
   */
  private getSentCSVName(bcd: BCDDocument) {
    const name =
      bcd.ebcds.find((ebcd) => ebcd.type === "SENT_CSV")?.file.name || "";

    return name;
  }

  /**
   * Resolves the EBCD number from a given FTP file.
   *
   * The EBCD number is resolved by searching the file contents for a regex pattern
   * matching "BCD Number: <number>" and returning the matched number string.
   *
   * If no match is found, the function returns null.
   * @param {Buffer<ArrayBufferLike>} buffer - The FTP file contents as a Buffer.
   * @returns {string | null} - The resolved EBCD number or null if no match is found.
   */
  private getBCDNumberFromFTPFile(buffer: Buffer<ArrayBufferLike>) {
    const text = buffer.toString("utf-8");
    const match = text.match(/BCD\s+Number\s*:\s*(\d+)/i);
    return match?.[1] ?? null;
  }

  /**
   * Resolve the EBCD type from a filename.
   *
   * The type is resolved by testing the filename against a set of regex rules.
   * If the filename matches one of the rules, the corresponding EBCD type is returned.
   * If the filename does not match any of the rules, the default type is returned.
   *
   * @param filename - The filename to resolve the EBCD type from.
   * @returns The resolved EBCD type.
   */
  private resolveEBCDType(filename: string) {
    const rules: Array<{ test: RegExp; type: EBCDTypeEnum }> = [
      { test: /E\.\d{4}/, type: EBCDTypeEnum.FILE_ERROR_CSV },
      { test: /SQR\.PDF$/, type: EBCDTypeEnum.FORMAT_ERROR_PDF },
      { test: /SQR\.TXT$/, type: EBCDTypeEnum.FORMAT_ERROR_TXT },
      { test: /REL\.CSV$/, type: EBCDTypeEnum.RELEASE_CSV },
      { test: /REL\.PDF$/, type: EBCDTypeEnum.RELEASE_PDF },
      { test: /REL\.TXT$/, type: EBCDTypeEnum.RELEASE_TXT },
      { test: /REC\.TXT$/, type: EBCDTypeEnum.RECEIPT_TXT },
    ];

    return (
      rules.find((rule) => rule.test.test(filename))?.type ||
      EBCDTypeEnum.RECEIPT_TXT
    );
  }

  /**
   * Resolves the BCD status from a list of EBCD types.
   * This function takes a list of EBCD types and returns the corresponding BCD status.
   * @param types - The list of EBCD types to resolve the BCD status from.
   * @returns The resolved BCD status.
   */
  private resolveBCDStatus(types: EBCDTypeEnum[]) {
    if (types.includes(EBCDTypeEnum.FILE_ERROR_CSV))
      return BCDStatusTypeEnum.FAILED;
    else if (
      types.includes(EBCDTypeEnum.FORMAT_ERROR_PDF) ||
      types.includes(EBCDTypeEnum.FORMAT_ERROR_TXT)
    )
      return BCDStatusTypeEnum.PENDING_QUERY;
    else if (
      types.includes(EBCDTypeEnum.RELEASE_CSV) ||
      types.includes(EBCDTypeEnum.RELEASE_PDF) ||
      types.includes(EBCDTypeEnum.RELEASE_TXT)
    )
      return BCDStatusTypeEnum.SUBMITTED;
    else return BCDStatusTypeEnum.PENDING_RESPONSE;
  }
  // ======================= EBCD UTILS =======================
  //#endregion
}
