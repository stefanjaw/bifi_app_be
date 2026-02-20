import { BaseRoutes } from "../../../system";
import { MaintenanceWindowDocument } from "../../../types/mongoose.gen";
import { MaintenanceWindowController } from "../controllers/maintenance-window-controller";
import {
  MaintenanceWindowDTO,
  UpdateMaintenanceWindowDTO,
} from "../models/maintenance-window.dto";

const maintenanceWindowController = new MaintenanceWindowController();

export class MaintenanceWindowRouter extends BaseRoutes<MaintenanceWindowDocument> {
  constructor() {
    super({
      controller: maintenanceWindowController,
      endpoint: "/maintenance-windows",
      dtoCreateClass: MaintenanceWindowDTO,
      dtoUpdateClass: UpdateMaintenanceWindowDTO,
    });
  }
}
