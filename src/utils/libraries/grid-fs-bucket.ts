import { Db, GridFSBucket } from "mongodb";
import { Types } from "mongoose";

// Will apply singleton pattern to this service for preserving the GridFSBucket instance
// This service is used to interact with GridFS for file storage in MongoDB
export class GridFSBucketService {
  private static instance: GridFSBucketService | null = null;
  private bucket: GridFSBucket;
  private bucketName = "bifi_app_files";

  constructor(db: Db) {
    this.bucket = new GridFSBucket(db, { bucketName: this.bucketName });
  }

  static initiate(db: Db) {
    GridFSBucketService.instance = new GridFSBucketService(db);
    return GridFSBucketService.instance;
  }

  static getInstance() {
    if (!GridFSBucketService.instance) {
      throw new Error(
        "GridFSBucketService is not initialized. Call initiate first."
      );
    }

    return GridFSBucketService.instance;
  }

  async uploadFile(file: Express.Multer.File, metadata?: any) {
    const stream = this.bucket.openUploadStream(file.originalname, {
      ...metadata,
    });

    return new Promise<string>((resolve, reject) => {
      stream.end(file.buffer);

      // Handle errors during the upload process
      stream.on("error", (err) => {
        reject(new Error(`File upload failed: ${err.message}`));
      });

      // Return the file ID as a string when the upload is finished
      stream.on("finish", () => {
        resolve(stream.id.toString());
      });
    });
  }

  async downloadFile(fileId: string) {
    const id = new Types.ObjectId(fileId);
    const downloadStream = this.bucket.openDownloadStream(id);

    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];

      downloadStream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      downloadStream.on("error", (err) => {
        reject(new Error(`File download failed: ${err.message}`));
      });

      downloadStream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });
  }
}
