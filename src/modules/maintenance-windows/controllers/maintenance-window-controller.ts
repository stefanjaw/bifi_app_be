import { Request, Response, NextFunction } from "express";
import { BaseController, FileValidatorService, ValidationException } from "../../../system";
import { MaintenanceWindowDocument } from "../../../types/mongoose.gen";
import { MaintenanceWindowsService } from "../services/maintenance-window-service";

const maintenanceWindowService = new MaintenanceWindowsService();

export class MaintenanceWindowController extends BaseController<MaintenanceWindowDocument> {
    private readonly fileValidatorService = new FileValidatorService();
  
  constructor() {
    super({ service: maintenanceWindowService });
  }


}