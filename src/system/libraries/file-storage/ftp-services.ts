import * as ftp from "basic-ftp";
import { Readable, Writable } from "stream";
import { ConnectionOptions } from "tls";

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
      throw new Error("FTPService is not initialized. Call initiate first.");

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
      throw new Error("Error connecting to FTP server: " + error.message);
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
      if (!(await this.pathExists(client, `${this.options.basePath}/${path}`)))
        throw new Error("Path does not exist");

      let stream: Readable;

      if ("buffer" in file) {
        stream = Readable.from(file.buffer);
      } else {
        const buffer = Buffer.from(await file.arrayBuffer());
        stream = Readable.from(buffer);
      }

      return await client.uploadFrom(
        stream,
        `${this.options.basePath}/${path}/${name}`
      );
    } catch (error) {
      throw error;
    } finally {
      client?.close();
    }
  }

  /**
   * Uploads multiple files to the FTP server at the given path.
   * @param files An array of objects containing the file to upload and the name of the file.
   * @param path The path on the FTP server where the files should be uploaded.
   * @throws Error if there is an error connecting to the FTP server, or if there is an error uploading a file.
   * @returns A Promise that resolves to an array of FTP responses, each corresponding to a file that was uploaded successfully.
   */
  async uploadMany(
    files: { file: File | Express.Multer.File; name: string }[],
    path: string
  ) {
    try {
      const results: ftp.FTPResponse[] = [];

      for (const file of files) {
        results.push(await this.upload(file.file, path, file.name));
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Downloads a file from the FTP server at the given path.
   * @param path The path on the FTP server where the file should be downloaded.
   * @throws Error if there is an error connecting to the FTP server, or if there is an error downloading a file.
   * @returns A Promise that resolves to a Buffer containing the downloaded file.
   */
  async download(path: string) {
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

      await client.downloadTo(writable, `${this.options.basePath}/${path}`);
      return Buffer.concat(chunks);
    } catch (error) {
      throw error;
    } finally {
      client?.close();
    }
  }

  /**
   * Downloads multiple files from the FTP server at the given paths.
   * @param paths An array of paths on the FTP server where the files should be downloaded.
   * @throws Error if there is an error connecting to the FTP server, or if there is an error downloading a file.
   * @returns A Promise that resolves to an array of Buffers containing the downloaded files.
   */
  async downloadMany(paths: string[]) {
    try {
      const buffers: Buffer[] = [];

      for (const path of paths) {
        buffers.push(await this.download(path));
      }

      return buffers;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lists files in the given FTP path, optionally filtered by a matching word and limited to a certain number.
   * @param path The path on the FTP server where the files should be listed.
   * @param matchingWord An optional word which the names of the files should include. 20203221022024.0001
   * @param limit An optional limit to the number of files to be listed.
   * @throws Error if there is an error connecting to the FTP server, or if there is an error listing the files.
   * @returns A Promise that resolves to an array of Buffers containing the listed files.
   */
  async list(path: string, matchingWord?: string, limit?: number) {
    let client: ftp.Client | undefined = undefined;

    try {
      client = await this.connect();

      // get list of files
      let files = await client.list(`${this.options.basePath}/${path}`);

      // filter files if matchingWord is provided
      files = files.filter(
        (file) =>
          (matchingWord ? file.name.includes(matchingWord) : true) &&
          file.isFile
      );

      // download files
      const buffers: Buffer[] = [];

      for (const file of files) {
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
          `${this.options.basePath}/${path}/${file.name}`
        );
        buffers.push(Buffer.concat(chunks));

        // break if limit is reached
        if (limit && buffers.length >= limit) break;
      }

      return buffers;
    } catch (error) {
      throw error;
    } finally {
      client?.close();
    }
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
}
