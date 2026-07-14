import * as XLSX from "xlsx";
import { Part } from "@google/genai";
import { GoogleDriveConnectorService, DriveFile } from "../../../system";

export interface FilePart {
  part: Part;
  file: DriveFile;
  fileDate?: Date;
}

export class DriveFileService {
  private bufferToGenerativePart(buffer: Buffer, mimeType: string): Part {
    return {
      inlineData: {
        mimeType,
        data: buffer.toString("base64"),
      },
    };
  }

  private xlsxBufferToCsvString(buffer: Buffer): string {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const csvParts: string[] = [];
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      if (csv.trim().length > 0) csvParts.push(csv);
    }
    return csvParts.join("\n\n");
  }

  fileToGenerativePart(buffer: Buffer, file: DriveFile): Part {
    const isPdf =
      file.mimeType === "application/pdf" || file.name.endsWith(".pdf");
    const isCsv = file.mimeType === "text/csv" || file.name.endsWith(".csv");

    if (isPdf) return this.bufferToGenerativePart(buffer, "application/pdf");
    if (isCsv) return this.bufferToGenerativePart(buffer, "text/csv");

    const csvString = this.xlsxBufferToCsvString(buffer);
    return this.bufferToGenerativePart(
      Buffer.from(csvString, "utf-8"),
      "text/csv",
    );
  }

  buildLabeledParts(files: FilePart[]): Part[] {
    const parts: Part[] = [];
    for (const entry of files) {
      parts.push({ text: `=== FILE: ${entry.file.name} ===` });
      parts.push(entry.part);
    }
    return parts;
  }

  private async downloadFile(
    file: DriveFile,
    driveConnector: GoogleDriveConnectorService,
  ): Promise<Buffer> {
    if (file.mimeType === "application/vnd.google-apps.spreadsheet") {
      return driveConnector.exportGoogleSheet(file.id);
    }
    return driveConnector.downloadFile(file.id);
  }

  filterModifiedFiles(files: DriveFile[], lastIndexed?: Date): DriveFile[] {
    if (!lastIndexed) return files;
    return files.filter(
      (f) => !f.modifiedTime || new Date(f.modifiedTime) > lastIndexed,
    );
  }

  async downloadFolderFiles(
    folderId: string,
    driveConnector: GoogleDriveConnectorService,
    lastIndexed?: Date,
  ): Promise<{ files: FilePart[]; errors: string[] }> {
    const allFiles = await driveConnector.listFilesInFolder(folderId);
    const candidates = this.filterModifiedFiles(allFiles, lastIndexed);
    const result: FilePart[] = [];
    const errors: string[] = [];

    for (const file of candidates) {
      if (!driveConnector.isSupportedFile(file.mimeType, file.name)) continue;
      try {
        const buffer = await this.downloadFile(file, driveConnector);
        const part = this.fileToGenerativePart(buffer, file);
        const fileDate = file.modifiedTime
          ? new Date(file.modifiedTime)
          : undefined;
        result.push({ part, file, fileDate });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`File ${file.name}: ${msg}`);
      }
    }

    return { files: result, errors };
  }
}
