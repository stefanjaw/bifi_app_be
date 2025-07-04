import { BaseService } from "./base-service";
import { Request, Response } from "express";

export class BaseController<T> {
  private service: BaseService<T>;

  constructor(pService: BaseService<T>) {
    this.service = pService;
  }

  get = async (req: Request, res: Response) => {
    try {
      // get elements
      const searchParams = req.query.searchParams
        ? JSON.parse(req.query.searchParams.toString())
        : {};
      const paginationOptions = req.query.paginationOptions
        ? JSON.parse(req.query.paginationOptions.toString())
        : {};

      const records = await this.service.get(searchParams, paginationOptions);

      res.status(200).json(records);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  create = async (req: Request, res: Response) => {
    try {
      const record = await this.service.create(req.body);

      res.status(200).json(record);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  update = async (req: Request, res: Response) => {
    try {
      const record = await this.service.update(req.body);

      res.status(200).json(record);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };

  delete = async (req: Request, res: Response) => {
    try {
      const result = await this.service.delete(req.params._id);

      res.status(200).json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message });
    }
  };
}
