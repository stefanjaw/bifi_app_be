import { Router } from "express";
import multer from "multer";
import { ContactController } from "../controllers/contact-controller";

const upload = multer();
const contactController = new ContactController();

const contactRouter = Router();

contactRouter.get("/contacts", contactController.get);
contactRouter.post("/contacts", upload.any(), contactController.create);
contactRouter.put("/contacts", upload.any(), contactController.update);
contactRouter.delete("/contacts", contactController.delete);

export { contactRouter };
