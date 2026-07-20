import { BaseController } from "../../../../system";
import { StaffDocument } from "@mongodb-types";
import { StaffService } from "../services/staff-service";

const staffService = new StaffService();

/** Express controller for staff CRUD operations */
export class StaffController extends BaseController<StaffDocument> {
  constructor() {
    super({ service: staffService });
  }
}
