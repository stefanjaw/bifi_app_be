import mongoose from "mongoose";
import { ValidationException } from "../exceptions/service-exception";
import { BaseService } from "./base-service";
import { paginationOptions } from "./query-options.type";
import { NextFunction, Request, Response } from "express";

/**
 * Maximum number of records a single paginated request can return.
 * Prevents clients from materializing entire collections via `?limit=1000000`. (H3)
 */
const MAX_PAGE_LIMIT = 100;

/**
 * Operators that can execute code or run aggregation pipelines.
 * Blocked from client-supplied `searchParams` as a security measure. (H2)
 */
const BLOCKED_OPERATORS = new Set([
  "$expr",
  "$where",
  "$function",
  "$accumulator",
]);

/**
 * Removes dangerous operators from a Mongoose filter object.
 * Blocks operators that can execute code or run aggregation pipelines
 * (`$expr`, `$where`, `$function`, `$accumulator`) from client-supplied
 * `searchParams`. Legitimate Mongoose operators (`$or`, `$and`, `$regex`,
 * `$in`, `$ne`, `$gt`, etc.) pass through unchanged. (H2)
 * @param obj - The parsed searchParams object.
 * @returns The sanitized object with dangerous operators removed.
 */
function sanitizeSearchParams(obj: any): Record<string, any> {
  if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
    const clean: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      if (BLOCKED_OPERATORS.has(key)) continue;
      clean[key] = obj[key];
    }
    return clean;
  }
  return obj as Record<string, any>;
}

/**
 * Caps the `limit` field in pagination options to MAX_PAGE_LIMIT. (H3)
 * @param opts - The parsed paginationOptions object.
 * @returns The paginationOptions with `limit` clamped, matching the `paginationOptions` type.
 */
function capPaginationLimit(
  opts: Record<string, any>,
): paginationOptions & { paginate: true } {
  if (opts && typeof opts.limit === "number") {
    opts.limit = Math.min(opts.limit, MAX_PAGE_LIMIT);
  }
  return opts as paginationOptions & { paginate: true };
}

export class BaseController<T> {
  service!: BaseService<T>;

  /**
   * Creates a new BaseController instance.
   * @param params - Object containing the service instance to use.
   */
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
    next: NextFunction,
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
        ? sanitizeSearchParams(
            JSON.parse(this.normalize(req.query.searchParams as string)),
          )
        : {};
      console.log("🚀 ~ BaseController ~ getHandler ~ searchParams:", searchParams)
      const paginationOptions = req.query.paginationOptions
        ? capPaginationLimit(
            JSON.parse(this.normalize(req.query.paginationOptions as string)),
          )
        : undefined;
      const orderBy = req.query.orderBy
        ? JSON.parse(this.normalize(req.query.orderBy as string))
        : undefined;
      const count = req.query.count === "true" ? true : false;

      let records;
      if (paginationOptions) {
        records = await this.service.get(
          searchParams,
          paginationOptions,
          orderBy,
          count,
          undefined,
        );
      } else {
        records = await this.service.get(
          searchParams,
          undefined,
          orderBy,
          count,
          undefined,
        );
      }

      this.sendData(res, records);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Normalizes a URL-encoded string by decoding URI components and replacing + with spaces.
   * @param value - The URL-encoded string to normalize.
   * @returns The decoded and normalized string.
   */
  protected normalize(value: string) {
    return decodeURIComponent(value.replace(/\+/g, " "));
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
    next: NextFunction,
  ) {
    try {
      const body = { ...req.body };
      const record = await this.service.create(body, undefined);

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
    next: NextFunction,
  ) {
    try {
      const body = { ...req.body };
      const record = await this.service.update(body, undefined);

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
    next: NextFunction,
  ) {
    try {
      const _id = req.body?._id || req.query._id;
      if (typeof _id !== "string")
        throw new ValidationException("_id is required for deletion");

      const result = await this.service.delete(_id, undefined);

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
    next: NextFunction,
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
    next: NextFunction,
  ) {
    try {
      const records = await this.service.importCSV(req.body, undefined);
      this.sendData(res, records);
    } catch (error: any) {
      next(error);
    }
  }
  //#endregion

  //#region Public Methods That Express Will Use
  /**
   * Express handler — delegates to getByIdHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  getById = async (req: Request, res: Response, next: NextFunction) => {
    await this.getByIdHandler(req, res, next);
  };

  /**
   * Express handler — delegates to getHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  get = async (req: Request, res: Response, next: NextFunction) => {
    await this.getHandler(req, res, next);
  };

  /**
   * Express handler — delegates to createHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  create = async (req: Request, res: Response, next: NextFunction) => {
    await this.createHandler(req, res, next);
  };

  /**
   * Express handler — delegates to updateHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  update = async (req: Request, res: Response, next: NextFunction) => {
    await this.updateHandler(req, res, next);
  };

  /**
   * Express handler — delegates to deleteHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  delete = async (req: Request, res: Response, next: NextFunction) => {
    await this.deleteHandler(req, res, next);
  };

  /**
   * Express handler — delegates to exportCSVHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  exportCSV = async (req: Request, res: Response, next: NextFunction) => {
    await this.exportCSVHandler(req, res, next);
  };

  /**
   * Express handler — delegates to importCSVHandler.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction callback.
   */
  importCSV = async (req: Request, res: Response, next: NextFunction) => {
    await this.importCSVHandler(req, res, next);
  };
  //#endregion

  /**
   * Sends a successful HTTP response with the provided data wrapped in a data key.
   * @param res - The express Response object.
   * @param data - The data to be sent in the response body.
   * @returns void
   */
  sendData(res: Response, data: any) {
    res.status(200).json(data);
  }
}
