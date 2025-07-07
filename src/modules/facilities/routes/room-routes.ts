import { Router } from "express";
import multer from "multer";
import { RoomController } from "../controllers/room-controller";

const upload = multer();
const roomController = new RoomController();

const roomRouter = Router();

roomRouter.get("/rooms", roomController.get);
roomRouter.post("/rooms", upload.any(), roomController.create);
roomRouter.put("/rooms", upload.any(), roomController.update);
roomRouter.delete("/rooms", roomController.delete);

export { roomRouter };
