import { BaseService, InternalServerException } from "../../../system";
import { MaintenanceWindowDocument } from "../../../types/mongoose.gen";
import { GenAIService } from "../../ia";
import { maintenanceWindowModel } from "../models/maintenance-window.model";

export class MaintenanceWindowsService extends BaseService<MaintenanceWindowDocument> {

  constructor() {
    super({ model: maintenanceWindowModel });
  }
  /**
   * Reads uploaded documents and extracts structured data using GenAI.
   */

}
