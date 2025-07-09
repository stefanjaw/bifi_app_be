import { BaseService } from "./base-service";
import { Request, Response } from "express";

export class BaseController<T> {
  private service: BaseService<T>;
  private parsingFields: {
    key: string;
    type: "object" | "array" | "string" | "number" | "boolean";
  }[] = [];

  constructor(pService: BaseService<T>) {
    this.service = pService;
  }

  set setParsingFields(
    fields: {
      key: string;
      type: "object" | "array" | "string" | "number" | "boolean";
    }[]
  ) {
    this.parsingFields = fields;
  }

  //#region Protected Methods to Handle Requests and can be overridden
  protected async getHandler(req: Request, res: Response) {
    try {
      // get elements
      const searchParams = this.parseFields(
        req.query.searchParams || "{}",
        "object"
      );
      const paginationOptions = this.parseFields(
        req.query.paginationOptions || "{}",
        "object"
      );

      const records = await this.service.get(searchParams, paginationOptions);

      this.sendData(res, records);
    } catch (error: any) {
      this.sendError(res, 401, error.message);
    }
  }

  protected async createHandler(req: Request, res: Response) {
    try {
      const body = { ...req.body };

      // parse fields that need to be parsed
      Object.keys(body).forEach((key) => {
        // find the field in parsingFields
        const field = this.parsingFields.find((field) => field.key === key);

        // field check, if not, based on current type of body[key]
        const type =
          field?.type || typeof body[key] === "object"
            ? "object"
            : Array.isArray(body[key])
            ? "array"
            : "string";

        // if the field is not found, use it as a string
        body[key] = this.parseFields(body[key], type);
      });

      const record = await this.service.create(body);

      this.sendData(res, record);
    } catch (error: any) {
      this.sendError(res, 401, error.message);
    }
  }

  protected async updateHandler(req: Request, res: Response) {
    try {
      const body = { ...req.body };

      if (!body._id) throw new Error("_id is required for update");

      // parse fields that need to be parsed
      Object.keys(body).forEach((key) => {
        // find the field in parsingFields
        const field = this.parsingFields.find((field) => field.key === key);

        // field check, if not, based on current type of body[key]
        const type =
          field?.type || typeof body[key] === "object"
            ? "object"
            : Array.isArray(body[key])
            ? "array"
            : "string";

        // if the field is not found, use it as a string
        body[key] = this.parseFields(body[key], type);
      });

      const record = await this.service.update(body);

      this.sendData(res, record);
    } catch (error: any) {
      this.sendError(res, 401, error.message);
    }
  }

  protected async deleteHandler(req: Request, res: Response) {
    try {
      if (!req.params._id) throw new Error("_id is required for deletion");

      const result = await this.service.delete(req.params._id);

      this.sendData(res, result);
    } catch (error: any) {
      this.sendError(res, 401, error.message);
    }
  }
  //#endregion

  //#region Public Methods That Express Will Use
  get = async (req: Request, res: Response) => {
    await this.getHandler(req, res);
  };

  create = async (req: Request, res: Response) => {
    await this.createHandler(req, res);
  };

  update = async (req: Request, res: Response) => {
    await this.updateHandler(req, res);
  };

  delete = async (req: Request, res: Response) => {
    await this.deleteHandler(req, res);
  };
  //#endregion

  protected parseFields(
    value: any,
    type: "object" | "array" | "string" | "number" | "boolean"
  ): any {
    try {
      if (type === "object") {
        return typeof value === "string" ? JSON.parse(value) : value;
      } else if (type === "array") {
        return Array.isArray(value) ? value : JSON.parse(value);
      } else if (type === "string") {
        return String(value);
      } else if (type === "number") {
        return Number(value);
      } else if (type === "boolean") {
        return Boolean(value);
      }
    } catch (error) {
      throw new Error(`Error parsing field: ${value}. Expected type: ${type}`);
    }
  }

  sendError(res: Response, status: number, error: string) {
    res.status(status).json({ error });
  }

  sendData(res: Response, data: any) {
    res.status(200).json(data);
  }
}
