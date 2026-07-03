import { google, drive_v3 } from "googleapis";
import { ValidationException } from "../exceptions/service-exception";
import { Readable } from "stream";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

export class GoogleDriveConnectorService {
  private drive: drive_v3.Drive;

  constructor(serviceAccountKeyJson: string) {
    try {
      const credentials = JSON.parse(serviceAccountKeyJson);
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ["https://www.googleapis.com/auth/drive"],
      });
      this.drive = google.drive({ version: "v3", auth });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new ValidationException(`Invalid service account key: ${msg}`);
    }
  }

  /**
   * Lists all non-trashed files inside the given folder (paginated).
   * @param folderId - The Google Drive folder ID.
   * @returns An array of DriveFile objects.
   */
  async listFilesInFolder(folderId: string): Promise<DriveFile[]> {
    const files: DriveFile[] = [];
    let pageToken: string | undefined;

    do {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: "nextPageToken, files(id, name, mimeType, modifiedTime, size)",
        pageSize: 100,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      if (response.data.files) {
        for (const file of response.data.files) {
          if (file.id && file.name && file.mimeType) {
            files.push({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              modifiedTime: file.modifiedTime || undefined,
              size: file.size || undefined,
            });
          }
        }
      }
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return files;
  }

  /**
   * Downloads a file from Google Drive as a Buffer.
   * @param fileId - The Google Drive file ID.
   * @returns The file contents as a Buffer.
   */
  async downloadFile(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" },
    );
    return Buffer.from(response.data as ArrayBuffer);
  }

  /**
   * Checks whether the given MIME type or file extension is supported for processing.
   * Supported: xlsx, xls, csv, pdf, and Google Sheets.
   * @param mimeType - The MIME type of the file.
   * @param fileName - The file name (used to check extension fallback).
   * @returns True if the file type is supported.
   */
  isSupportedFile(mimeType: string, fileName: string): boolean {
    const supportedMimeTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
      "application/pdf",
      "application/vnd.google-apps.spreadsheet",
    ];
    const supportedExtensions = [".xlsx", ".xls", ".csv", ".pdf"];

    if (supportedMimeTypes.includes(mimeType)) return true;

    const ext = fileName.toLowerCase().split(".").pop();
    return ext ? supportedExtensions.includes(`.${ext}`) : false;
  }

  /**
   * Exports a Google Sheets file to xlsx format and returns it as a Buffer.
   * @param fileId - The Google Sheets file ID.
   * @returns The exported spreadsheet as a Buffer.
   */
  async exportGoogleSheet(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.export(
      {
        fileId,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      { responseType: "arraybuffer" },
    );
    return Buffer.from(response.data as ArrayBuffer);
  }

  /**
   * Uploads (or replaces) a file in the given Google Drive folder.
   * If a file with the same name already exists, it is updated in-place.
   * The target folder MUST be inside a Shared Drive.
   * @param folderId - The target folder ID.
   * @param fileName - The name for the uploaded file.
   * @param buffer - The file contents.
   * @param mimeType - The MIME type (default: text/csv).
   * @returns The Drive file ID.
   */
  async uploadFile(
    folderId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string = "text/csv",
  ): Promise<string> {
    const existing = await this.drive.files.list({
      q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
      fields: "files(id)",
      pageSize: 1,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    if (existing.data.files && existing.data.files.length > 0) {
      const fileId = existing.data.files[0].id!;
      await this.drive.files.update({
        fileId,
        media: { mimeType, body: stream },
        supportsAllDrives: true,
      });
      return fileId;
    }

    const folderMeta = await this.drive.files.get({
      fileId: folderId,
      fields: "driveId",
      supportsAllDrives: true,
    });

    const driveId = folderMeta.data.driveId;
    if (!driveId) {
      throw new ValidationException(
        "Config folder must be inside a Shared Drive. Service accounts do not have personal storage quota. " +
          "Please configure a folder that lives within a Shared Drive in Pricing Settings.",
      );
    }

    const response = await this.drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
        driveId,
        mimeType,
      },
      media: { mimeType, body: stream },
      fields: "id",
      supportsAllDrives: true,
    });

    return response.data.id!;
  }
}
