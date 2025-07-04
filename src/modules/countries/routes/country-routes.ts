import { Router } from "express";
import { CountryController } from "../controllers/country-controller";
import multer from "multer";

const upload = multer();
const countryController = new CountryController();

const countryRouter = Router();

countryRouter.get("/countries", countryController.get);
countryRouter.post("/countries", upload.any(), countryController.create);
countryRouter.put("/countries", upload.any(), countryController.update);
countryRouter.delete("/countries", countryController.delete);

export { countryRouter };
