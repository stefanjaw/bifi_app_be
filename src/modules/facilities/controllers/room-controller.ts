import { BaseController } from "../../../system";
import { RoomDocument } from "../../../types/mongoose.gen";
import { RoomService } from "../services/room-service";

const roomService = new RoomService();

export class RoomController extends BaseController<RoomDocument> {
  constructor() {
    super({ service: roomService });
  }
}
