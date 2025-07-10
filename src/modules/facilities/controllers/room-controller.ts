import { BaseController } from "../../../system";
import { room } from "../models/room.model";
import { RoomService } from "../services/room-service";

const roomService = new RoomService();

export class RoomController extends BaseController<room> {
  constructor() {
    super({ service: roomService });
  }
}
