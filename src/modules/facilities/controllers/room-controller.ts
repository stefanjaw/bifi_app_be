import { BaseController } from "../../../utils";
import { room } from "../models/room";
import { RoomService } from "../services/room-service";

const roomService = new RoomService();

export class RoomController extends BaseController<room> {
  constructor() {
    super(roomService);
  }
}
