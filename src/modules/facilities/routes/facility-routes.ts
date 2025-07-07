import { Router } from "express";
import multer from "multer";
import { FacilityController } from "../controllers/facility-controller";

const upload = multer();
const facilityController = new FacilityController();

const facilityRouter = Router();

facilityRouter.get("/facilities", facilityController.get);
facilityRouter.post("/facilities", upload.any(), facilityController.create);
facilityRouter.put("/facilities", upload.any(), facilityController.update);
facilityRouter.delete("/facilities", facilityController.delete);

export { facilityRouter };
