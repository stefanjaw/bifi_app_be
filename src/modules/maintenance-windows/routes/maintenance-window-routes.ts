import { Router } from "express";
import multer from "multer";
import { MaintenanceWindowController } from "../controllers/maintenance-window-controller";

const upload = multer();
const maintenanceWindowController = new MaintenanceWindowController();

const maintenanceWindowRouter = Router();

maintenanceWindowRouter.get(
  "/maintenance-windows",
  maintenanceWindowController.get
);
maintenanceWindowRouter.post(
  "/maintenance-windows",
  upload.any(),
  maintenanceWindowController.create
);
maintenanceWindowRouter.put(
  "/maintenance-windows",
  upload.any(),
  maintenanceWindowController.update
);
maintenanceWindowRouter.delete(
  "/maintenance-windows",
  maintenanceWindowController.delete
);

export { maintenanceWindowRouter };
