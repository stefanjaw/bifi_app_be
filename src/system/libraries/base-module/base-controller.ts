import { BaseService } from "./base-service";
import { NextFunction, Request, Response } from "express";

export class BaseController<T> {
  service!: BaseService<T>;

  constructor(params: Pick<BaseController<T>, "service">) {
    Object.assign(this, params);
  }

  //#region Protected Methods to Handle Requests and can be overridden
  protected async getHandler(req: Request, res: Response, next: NextFunction) {
    try {
      // get elements
      const searchParams = req.query.searchParams
        ? JSON.parse(req.query.searchParams as string)
        : {};
      const paginationOptions = req.query.paginationOptions
        ? JSON.parse(req.query.paginationOptions as string)
        : {};

      const records = await this.service.get(searchParams, paginationOptions);

      this.sendData(res, records);
    } catch (error: any) {
      next(error);
    }
  }

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

  protected async deleteHandler(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.params._id) throw new Error("_id is required for deletion");

      const result = await this.service.delete(req.params._id);

      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  }
  //#endregion

  //#region Public Methods That Express Will Use
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
  //#endregion

  sendError(res: Response, status: number, error: string) {
    res.status(status).json({ error });
  }

  sendData(res: Response, data: any) {
    res.status(200).json(data);
  }
}
