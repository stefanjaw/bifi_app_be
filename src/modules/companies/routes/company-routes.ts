import { Router } from "express";
import { CompanyController } from "../controllers/company-controller";
import multer from "multer";

const upload = multer();
const companyController = new CompanyController();

const companyRouter = Router();

companyRouter.get("/companies", companyController.get);
companyRouter.post("/companies", upload.any(), companyController.create);
companyRouter.put("/companies", upload.any(), companyController.update);
companyRouter.delete("/companies", companyController.delete);

export { companyRouter };
