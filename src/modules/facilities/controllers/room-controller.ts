import { BaseController } from "../../../system";
import { RoomDocument } from "../../../types/mongoose.gen";
import { RoomService } from "../services/room-service";
import { NextFunction, Request, Response } from "express";

const roomService = new RoomService();

export class RoomController extends BaseController<RoomDocument> {
  constructor() {
    super({ service: roomService });
  }

  validateImport = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const result = await roomService.validateImport(req.body);
      this.sendData(res, result);
    } catch (error: any) {
      next(error);
    }
  };
}
