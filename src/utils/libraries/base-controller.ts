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

  private getHandler = async (req: Request, res: Response) => {
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

      res.status(200).json(records);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  async get(req: Request, res: Response) {
    await this.getHandler(req, res);
  }

  private createHandler = async (req: Request, res: Response) => {
    try {
      const body = { ...req.body };

      // parse fields that need to be parsed
      Object.keys(body).forEach((key) => {
        // find the field in parsingFields
        const field = this.parsingFields.find((field) => field.key === key);

        // if the field is not found, use it as a string
        body[key] = this.parseFields(body[key], field?.type || "string");
      });

      const record = await this.service.create(body);

      res.status(200).json(record);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  async create(req: Request, res: Response) {
    await this.createHandler(req, res);
  }

  private updateHandler = async (req: Request, res: Response) => {
    try {
      const body = { ...req.body };

      if (!body._id) throw new Error("_id is required for update");

      // parse fields that need to be parsed
      Object.keys(body).forEach((key) => {
        // find the field in parsingFields
        const field = this.parsingFields.find((field) => field.key === key);

        // if the field is not found, use it as a string
        body[key] = this.parseFields(body[key], field?.type || "string");
      });

      const record = await this.service.update(body);

      res.status(200).json(record);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  async update(req: Request, res: Response) {
    await this.updateHandler(req, res);
  }

  private deleteHandler = async (req: Request, res: Response) => {
    try {
      if (!req.params._id) throw new Error("_id is required for deletion");

      const result = await this.service.delete(req.params._id);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  async delete(req: Request, res: Response) {
    await this.deleteHandler(req, res);
  }

  private parseFields(
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
}
