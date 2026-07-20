import { BaseController } from "../../../../system";
import { ShiftDocument } from "@mongodb-types";
import { ShiftService } from "../services/shift-service";

const shiftService = new ShiftService();

/** Express controller for shift CRUD operations */
export class ShiftController extends BaseController<ShiftDocument> {
  constructor() {
    super({ service: shiftService });
  }
}
