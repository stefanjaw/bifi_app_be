import { Db, GridFSBucket } from "mongodb";
import { Types } from "mongoose";
import { InternalServerException, NotFoundException, ValidationException } from "../exceptions/service-exception";

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

  /**
   * Uploads a file to the GridFS bucket.
   *
   * @param file - The file to be uploaded, provided as an Express.Multer.File object.
   * @returns A promise that resolves to a string representing the file ID in GridFS.
   * @throws ValidationException if the provided file is invalid.
   *
   * The function creates an upload stream for the file and attaches metadata
   * such as mimetype, original name, and size. It handles errors during the
   * upload process and resolves with the file ID once the upload is complete.
   */

  async uploadFile(file: Express.Multer.File) {
    if (!file || typeof file !== "object")
      throw new ValidationException("Invalid file");

    const stream = this.bucket.openUploadStream(file.originalname, {
      metadata: {
        contentType: file.mimetype,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      },
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

  /**
   * Downloads a file from the GridFS bucket.
   *
   * @param fileId - The ID of the file to be downloaded.
   * @returns A promise that resolves to a Buffer containing the file data.
   * @throws Error if there is a problem during the download process.
   *
   * The function creates a download stream using the provided file ID,
   * collects the file data in chunks, and resolves with the complete file
   * data as a Buffer once the download is complete.
   */

  async downloadFile(fileId: string) {
    const id = new Types.ObjectId(fileId);
    const downloadStream = this.bucket.openDownloadStream(id);

    const files = await this.bucket.find({ _id: id }).toArray();
    if (!files || files.length === 0) {
      throw new NotFoundException("File not found");
    }

    const file = files[0];

    return {
      file,
      stream: downloadStream,
      bufferDownload: new Promise<Buffer>((resolve, reject) => {
        const chunks: Buffer[] = [];

        downloadStream.on("data", (chunk) => {
          chunks.push(chunk);
        });

        downloadStream.on("error", (err) => {
          reject(
            new InternalServerException(`File download failed: ${err.message}`)
          );
        });

        downloadStream.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
      }),
    };
  }

  /**
   * Uploads multiple files to the GridFS bucket.
   *
   * @param files - An array of files to be uploaded, each represented as an Express.Multer.File object.
   * @returns A promise that resolves to an array of file IDs as strings, corresponding to the uploaded files.
   * @throws Error if there is a problem during the upload process.
   *
   * The function leverages the uploadFile method to process each file and returns a promise
   * that resolves once all files have been successfully uploaded.
   */

  async uploadFiles(files: Express.Multer.File[]) {
    return Promise.all(files.map((file) => this.uploadFile(file)));
  }

  /**
   * Downloads multiple files from the GridFS bucket.
   *
   * @param fileIds - An array of file IDs to be downloaded, each represented as a string.
   * @returns A promise that resolves to an array of file data as Buffers, corresponding to the downloaded files.
   * @throws Error if there is a problem during the download process.
   *
   * The function leverages the downloadFile method to process each file and returns a promise
   * that resolves once all files have been successfully downloaded.
   */

  async downloadFiles(fileIds: string[]) {
    return Promise.all(fileIds.map((fileId) => this.downloadFile(fileId)));
  }
}
