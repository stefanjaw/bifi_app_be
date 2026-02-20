import { BCDDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { BCDService } from "../services/bcd-service";
import { NextFunction, Request, Response } from "express";

export class BCDController extends BaseController<BCDDocument> {
  constructor() {
    super({
      service: new BCDService(),
    });
  }

  protected async postUploadBCDDataToFTPHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const id = req.params.id;
      const record = await (this.service as BCDService).uploadBCDDataToFTP(
        id,
        undefined,
      );

      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  protected async putUpdateBCDsFromFTPPHandler(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const record = await (this.service as BCDService).updateBCDsFromFTP(
        undefined,
      );

      this.sendData(res, record);
    } catch (error: any) {
      next(error);
    }
  }

  postUploadBCDDataToFTP = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    await this.postUploadBCDDataToFTPHandler(req, res, next);
  };

  putUpdateBCDsFromFTPP = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    await this.putUpdateBCDsFromFTPPHandler(req, res, next);
  };
}
