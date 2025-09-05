import { ValidationException } from "../exceptions/service-exception";
import { BaseService } from "./base-service";
import { NextFunction, Request, Response } from "express";
import { FileValidatorService } from "../file-storage/file-validator-service";
import csvParser from "csv-parser";
import { Readable } from "stream";

export class BaseController<T> {
  service!: BaseService<T>;

  constructor(params: Pick<BaseController<T>, "service">) {
    Object.assign(this, params);
  }

  //#region Protected Methods to Handle Requests and can be overridden

  /**
   * Handles HTTP GET requests by retrieving a single record from the database by its id.
   * The id is passed as a route parameter.
   * @param req - The express Request object containing the id parameter.
   * @param res - The express Response object to send the retrieved record.
   * @param next - The express NextFunction callback to pass control to the next middleware on error.
   * @throws {ValidationException} - If the id is not provided or invalid.
   * @throws {ServiceException} - If the record is not found or an unexpected error occurs.
   */
  protected async getByIdHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.id;
      const record = await this.service.getById(id, undefined);
      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Handles HTTP GET requests by retrieving records from the database.
   * Parses query parameters for search, pagination, and sorting options and count,
   * and uses the service to fetch the corresponding records.
   *
   * @param req - The express Request object containing query parameters for search, pagination, and sorting.
   * @param res - The express Response object used to send data back to the client.
   * @param next - The express NextFunction callback to pass control to the next middleware on error.
   */
  protected async getHandler(req: Request, res: Response, next: NextFunction) {
    try {
      // get elements
      const searchParams = req.query.searchParams
        ? JSON.parse(req.query.searchParams as string)
        : {};
      const paginationOptions = req.query.paginationOptions
        ? JSON.parse(req.query.paginationOptions as string)
        : {};
      const orderBy = req.query.orderBy
        ? JSON.parse(req.query.orderBy as string)
        : {};
      const count = req.query.count === "true" ? true : false;

      const records = await this.service.get(
        searchParams,
        paginationOptions,
        orderBy,
        count,
        undefined
      );

      this.sendData(res, records);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Handles HTTP POST requests by creating a new record in the database.
   * The request body is passed to the service's create method.
   *
   * @param req - The express Request object containing the data to create the record with.
   * @param res - The express Response object used to send data back to the client.
   * @param next - The express NextFunction callback to pass control to the next middleware on error.
   */
  protected async createHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const body = { ...req.body };
      const record = await this.service.create(body);

      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Handles HTTP PUT requests to update an existing record in the database.
   * The request body is passed to the service's update method.
   *
   * @param req - The express Request object containing the data to update the record with.
   * @param res - The express Response object used to send data back to the client.
   * @param next - The express NextFunction callback to pass control to the next middleware on error.
   */

  protected async updateHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const body = { ...req.body };
      const record = await this.service.update(body);

      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Handles HTTP DELETE requests to remove a record from the database.
   * Requires the "_id" parameter in the request params to identify the record.
   * Delegates the deletion to the service's delete method and sends the result back to the client.
   *
   * @param req - The express Request object containing the "_id" of the record to delete.
   * @param res - The express Response object used to send the result back to the client.
   * @param next - The express NextFunction callback to pass control to the next middleware on error.
   */

  protected async deleteHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.query._id)
        throw new ValidationException("_id is required for deletion");

      const result = await this.service.delete(req.query._id as string);

      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Handles HTTP GET requests to export all records of the collection in CSV format.
   * Delegates the exportation to the service's exportCSV method and sends the result as a CSV file back to the client.
   *
   * @param req - The express Request object.
   * @param res - The express Response object used to send the CSV file back to the client.
   * @param next - The express NextFunction callback to pass control to the next middleware on error.
   */
  protected async exportCSVHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const data = await this.service.exportCSV();

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "inline; filename=export.csv");

      res.write(data);
      res.end();
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Handles HTTP POST requests to import records from a CSV file.
   *
   * Expects a CSV file to be sent in the request body.
   * Delegates the importation to the service's importCSV method and sends the result back to the client.
   *
   * @param req - The express Request object containing the CSV file in the "csv" field.
   * @param res - The express Response object used to send the imported records back to the client.
   * @param next - The express NextFunction callback to pass control to the next middleware on error.
   */
  protected async importCSVHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const file = req.file as Express.Multer.File;

      if (!file) throw new ValidationException("CSV file is required");

      const fileValidator = new FileValidatorService();
      fileValidator.validateFileType(file, ["text/csv"]);

      // convert it to JSON
      const results: Record<string, any>[] = [];

      const bufferStream = new Readable();
      bufferStream.push(file.buffer);
      bufferStream.push(null);

      await new Promise<void>((resolve, reject) => {
        bufferStream
          .pipe(csvParser())
          .on("data", (data) => results.push(data))
          .on("end", () => resolve())
          .on("error", (error) => reject(error));
      });

      const records = await this.service.importCSV(results);

      this.sendData(res, records);
    } catch (error: any) {
      next(error);
    }
  }
  //#endregion

  //#region Public Methods That Express Will Use
  getById = async (req: Request, res: Response, next: NextFunction) => {
    await this.getByIdHandler(req, res, next);
  };

  get = async (req: Request, res: Response, next: NextFunction) => {
    await this.getHandler(req, res, next);
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    await this.createHandler(req, res, next);
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    await this.updateHandler(req, res, next);
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    await this.deleteHandler(req, res, next);
  };

  exportCSV = async (req: Request, res: Response, next: NextFunction) => {
    await this.exportCSVHandler(req, res, next);
  };

  importCSV = async (req: Request, res: Response, next: NextFunction) => {
    await this.importCSVHandler(req, res, next);
  };
  //#endregion

  /**
   * Sends a successful HTTP response with the provided data.
   *
   * @param res - The express Response object used to send data back to the client.
   * @param data - The data to be sent in the response body.
   */

  sendData(res: Response, data: any) {
    res.status(200).json(data);
  }
}
