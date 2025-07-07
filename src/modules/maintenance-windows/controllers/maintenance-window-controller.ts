import { BaseController } from "../../../utils";
import { maintenanceWindow } from "../models/maintenance-window";
import { MaintenanceWindowsService } from "../services/maintenance-window-service";

const maintenanceWindowService = new MaintenanceWindowsService();

export class MaintenanceWindowController extends BaseController<maintenanceWindow> {
  constructor() {
    super(maintenanceWindowService);
  }
}
