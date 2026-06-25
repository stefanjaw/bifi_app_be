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

  async downloadFile(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );
    return Buffer.from(response.data as ArrayBuffer);
  }

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

  async exportGoogleSheet(fileId: string): Promise<Buffer> {
    const response = await this.drive.files.export(
      {
        fileId,
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      { responseType: "arraybuffer" }
    );
    return Buffer.from(response.data as ArrayBuffer);
  }

  async uploadFile(
    folderId: string,
    fileName: string,
    buffer: Buffer,
    mimeType: string = "text/csv"
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
          "Please configure a folder that lives within a Shared Drive in Pricing Settings."
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
