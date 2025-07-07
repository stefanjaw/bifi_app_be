import { BaseService } from "../../../utils";
import {
  maintenanceWindow,
  maintenanceWindowModel,
} from "../models/maintenance-window";

export class MaintenanceWindowsService extends BaseService<maintenanceWindow> {
  constructor() {
    super(maintenanceWindowModel);
  }
}
