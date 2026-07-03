import * as ftp from "basic-ftp";
import { Readable, Writable } from "stream";
import { ConnectionOptions } from "tls";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import utc from "dayjs/plugin/utc";
import dayjs from "dayjs";
import { ftpResponse } from "./ftp.types";
import {
  InternalServerException,
  NotFoundException,
} from "../exceptions/service-exception";

dayjs.extend(isSameOrAfter);
dayjs.extend(utc);

export interface ftpConfig {
  host: string;
  user: string;
  password: string;
  basePath: string;
  port?: number;
  secure?: boolean; // FTPS
  secureOptions?: ConnectionOptions;
}

export class FTPService {
  private static instace: FTPService | null = null;
  private options: ftpConfig;

  /**
   * Constructor for the FTPService class.
   * Initializes the FTPService instance with the given connection options and connects to the FTP server.
   * @param connection - The connection options for the FTP server.
   */
  private constructor(connection: ftpConfig) {
    this.options = connection;
  }

  //#region STATIC INITIALIZATION
  /**
   * Initializes the FTPService by creating a new instance with the given connection options.
   * This method must be called before calling getInstance.
   * @param connection - The connection options for the FTP server.
   */
  static initiate(connection: ftpConfig) {
    if (FTPService.instace) return;
    FTPService.instace = new FTPService(connection);
  }

  /**
   * Gets the instance of FTPService.
   * @throws Error if initiate has not been called.
   * @returns The instance of FTPService.
   */
  static getInstance() {
    if (!FTPService.instace)
      throw new InternalServerException(
        "FTPService is not initialized. Call initiate first.",
      );

    return FTPService.instace;
  }
  //#endregion

  /**
   * Connects to the FTP server using the connection options provided during initialization.
   * @throws Error if there is an error connecting to the FTP server.
   * @returns A Promise that resolves to an instance of the FTP client.
   */
  async connect(): Promise<ftp.Client> {
    try {
      const client = new ftp.Client();
      client.ftp.verbose = true;

      await client.access({
        host: this.options.host,
        user: this.options.user,
        password: this.options.password,
        port: this.options.port ?? 21,
        secure: this.options.secure ?? false,
        secureOptions: this.options.secureOptions,
      });

      return client;
    } catch (error: any) {
      throw new InternalServerException(
        "Error connecting to FTP server: " + error.message,
      );
    }
  }

  /**
   * Uploads a file to the FTP server at the given path.
   * @param file The file to upload, represented as an Express.Multer.File object or a File object.
   * @param path The path on the FTP server where the file should be uploaded.
   * @param name The name of the file to be uploaded.
   * @throws Error if there is an error connecting to the FTP server, or if the path does not exist, or if there is an error uploading the file.
   * @returns A Promise that resolves to the FTP response after the file is uploaded successfully.
   */
  async upload(file: File | Express.Multer.File, path: string, name: string) {
    let client: ftp.Client | undefined = undefined;

    try {
      client = await this.connect();

      // check that the path exists
      if (!(await this.pathExists(client, this.createPath(path))))
        throw new NotFoundException("FTP path does not exist");

      let stream: Readable;

      if ("buffer" in file) {
        stream = Readable.from(file.buffer);
      } else {
        const buffer = Buffer.from(await file.arrayBuffer());
        stream = Readable.from(buffer);
      }

      await client.uploadFrom(stream, `${this.createPath(path)}/${name}`);
    } catch (error) {
      throw error;
    } finally {
      client?.close();
    }
  }

  /**
   * Downloads a file from the FTP server at the given path.
   * @param path The path on the FTP server where the file should be downloaded.
   * @param name The name of the file to be downloaded.
   * @throws Error if there is an error connecting to the FTP server, or if there is an error downloading the file.
   * @returns A Promise that resolves to a Buffer containing the downloaded file.
   */
  async download(path: string, name: string) {
    let client: ftp.Client | undefined = undefined;

    try {
      client = await this.connect();

      // where the file is downloaded
      const chunks: Buffer[] = [];

      // where the file is downloaded
      const writable = new Writable({
        write(chunk, _enc, cb) {
          chunks.push(Buffer.from(chunk));
          cb();
        },
      });

      await client.downloadTo(writable, `${this.createPath(path)}/${name}`);
      return Buffer.concat(chunks);
    } catch (error) {
      throw error;
    } finally {
      client?.close();
    }
  }

  /**
   * Lists files in the given directory on the FTP server, and optionally downloads them.
   * @param path The path on the FTP server where the files should be listed.
   * @param [mathingRegex] A regular expression to filter the listed files by name.
   * @param [limit] The maximum number of files to download.
   * @throws Error if there is an error connecting to the FTP server, or if there is an error listing or downloading a file.
   * @returns A Promise that resolves to an array of objects containing the downloaded file buffers and their corresponding file metadata.
   */
  async list({
    path,
    matchingRegex,
    limit,
  }: {
    path: string;
    matchingRegex?: RegExp;
    limit?: number;
  }): Promise<ftpResponse[]> {
    let client: ftp.Client | undefined = undefined;

    try {
      client = await this.connect();

      // get list of files
      let metadata = await client.list(this.createPath(path));

      // filter files if matchingWord is provided
      const proccessedFiles: ftp.FileInfo[] = metadata.filter((file) => {
        if (!file.isFile) return false;

        if (matchingRegex) {
          return matchingRegex.test(file.name);
        }

        return true;
      });

      // download files
      const response: { buffer: Buffer; metadata: ftp.FileInfo }[] = [];

      for (const file of proccessedFiles) {
        // where the file is downloaded
        const chunks: Buffer[] = [];

        // where the file is downloaded
        const writable = new Writable({
          write(chunk, _enc, cb) {
            chunks.push(Buffer.from(chunk));
            cb();
          },
        });

        await client.downloadTo(
          writable,
          `${this.createPath(path)}/${file.name}`,
        );
        response.push({
          buffer: Buffer.concat(chunks),
          metadata: file,
        });

        // break if limit is reached
        if (limit && response.length >= limit) break;
      }

      return response;
    } catch (error) {
      throw error;
    } finally {
      client?.close();
    }
  }

  /**
   * Moves files from one directory to another in the FTP server.
   *
   * @param files - An array of objects containing the path and filename of each file to be moved.
   * @param newPath - The new path where the files should be moved.
   * @throws Error if there is an error connecting to the FTP server, or if there is an error during the move process.
   * @returns A Promise that resolves when the files have been successfully moved.
   */
  async moveFiles(
    files: { path: string; filename: string }[],
    newPath: string,
  ) {
    let client: ftp.Client | undefined = undefined;

    try {
      client = await this.connect();

      // check that the path exists, if not, create it
      if (!(await this.pathExists(client, this.createPath(newPath)))) {
        await client.ensureDir(this.createPath(newPath));
      }

      for (const file of files) {
        const from = `${this.createPath(file.path)}/${file.filename}`;
        const to = `${this.createPath(newPath)}/${file.filename}`;

        try {
          await client.rename(from, to);
        } catch {
          await this.safeMove(client, from, to);
        }
      }
    } catch (error) {
      throw error;
    } finally {
      client?.close();
    }
  }

  /**
   * Safely moves a file from one path to another in the FTP server.
   * First downloads the file from the 'from' path, then uploads it to the 'to' path,
   * and finally removes the file from the 'from' path.
   * @param client - The FTP client instance.
   * @param from - The path and filename of the file to be moved.
   * @param to - The new path and filename where the file should be moved.
   * @throws Error if there is an error connecting to the FTP server, or if there is an error during the move process.
   * @returns A Promise that resolves when the file has been successfully moved.
   */
  private async safeMove(client: ftp.Client, from: string, to: string) {
    const chunks: Buffer[] = [];

    const writable = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(chunk);
        cb();
      },
    });

    await client.downloadTo(writable, from);

    const buffer = Buffer.concat(chunks);
    const readable = Readable.from(buffer);

    await client.uploadFrom(readable, to);
    await client.remove(from);
  }

  /**
   * Verifies if a path exists in the FTP server.
   * @param client - The FTP client instance.
   * @param path - The path to verify.
   * @returns A Promise that resolves to true if the path exists, false otherwise.
   * @throws Error if there is an error connecting to the FTP server, or if there is an error verifying if a path exists.
   */
  private async pathExists(client: ftp.Client, path: string): Promise<boolean> {
    try {
      await client.cd(path);
      await client.cd(".."); // volver
      return true;
    } catch (err: any) {
      if (err.code === 550) return false;
      throw err;
    }
  }

  /**
   * Creates a full path from the given path by prefixing it with the base path.
   * @param path - The path to prefix with the base path.
   * @returns The full path.
   */
  private createPath(path: string) {
    return `${this.options.basePath}/${path}`;
  }
}
