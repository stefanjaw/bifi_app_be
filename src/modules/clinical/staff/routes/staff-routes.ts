import { BaseRoutes } from "../../../../system";
import { StaffDocument } from "@mongodb-types";
import { StaffController } from "../controllers/staff-controller";
import { StaffDTO, UpdateStaffDTO } from "../models/staff.dto";

const staffController = new StaffController();

/** Route definitions for staff endpoints */
export class StaffRouter extends BaseRoutes<StaffDocument> {
  constructor() {
    super({
      controller: staffController,
      endpoint: "/staff",
      dtoCreateClass: StaffDTO,
      dtoUpdateClass: UpdateStaffDTO,
    });
  }
}
