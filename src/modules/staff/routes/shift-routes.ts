import { BaseRoutes } from "../../../system";
import { ShiftDocument } from "@mongodb-types";
import { ShiftController } from "../controllers/shift-controller";
import { ShiftDTO, UpdateShiftDTO } from "../models/shift.dto";

const shiftController = new ShiftController();

/** Route definitions for shift endpoints */
export class ShiftRouter extends BaseRoutes<ShiftDocument> {
  constructor() {
    super({
      controller: shiftController,
      endpoint: "/shifts",
      dtoCreateClass: ShiftDTO,
      dtoUpdateClass: UpdateShiftDTO,
    });
  }
}
