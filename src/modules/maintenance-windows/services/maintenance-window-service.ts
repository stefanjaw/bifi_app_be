import { BaseService } from "../../../system";
import {
  maintenanceWindow,
  maintenanceWindowModel,
} from "../models/maintenance-window.model";

export class MaintenanceWindowsService extends BaseService<maintenanceWindow> {
  constructor() {
    super({ model: maintenanceWindowModel });
  }
}
