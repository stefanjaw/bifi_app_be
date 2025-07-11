import { BaseService } from "../../../system";
import { MaintenanceWindowDocument } from "../../../types/mongoose.gen";
import { maintenanceWindowModel } from "../models/maintenance-window.model";

export class MaintenanceWindowsService extends BaseService<MaintenanceWindowDocument> {
  constructor() {
    super({ model: maintenanceWindowModel });
  }
}
