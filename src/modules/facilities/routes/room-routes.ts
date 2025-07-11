import { BaseRoutes } from "../../../system";
import { RoomDocument } from "../../../types/mongoose.gen";
import { RoomController } from "../controllers/room-controller";
import { RoomDTO, UpdateRoomDTO } from "../models/room.dto";

const roomController = new RoomController();

export class RoomRouter extends BaseRoutes<RoomDocument> {
  constructor() {
    super({
      controller: roomController,
      endpoint: "/rooms",
      dtoCreateClass: RoomDTO,
      dtoUpdateClass: UpdateRoomDTO,
    });
  }
}
