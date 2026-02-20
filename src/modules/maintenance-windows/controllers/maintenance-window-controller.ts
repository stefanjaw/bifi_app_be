import { BaseController } from "../../../system";
import { MaintenanceWindowDocument } from "../../../types/mongoose.gen";
import { MaintenanceWindowsService } from "../services/maintenance-window-service";

const maintenanceWindowService = new MaintenanceWindowsService();

export class MaintenanceWindowController extends BaseController<MaintenanceWindowDocument> {
  constructor() {
    super({ service: maintenanceWindowService });
  }
}
