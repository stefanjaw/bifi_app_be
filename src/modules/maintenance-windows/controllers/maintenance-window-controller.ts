import { BaseController } from "../../../system";
import { maintenanceWindow } from "../models/maintenance-window.model";
import { MaintenanceWindowsService } from "../services/maintenance-window-service";

const maintenanceWindowService = new MaintenanceWindowsService();

export class MaintenanceWindowController extends BaseController<maintenanceWindow> {
  constructor() {
    super({ service: maintenanceWindowService });
  }
}
