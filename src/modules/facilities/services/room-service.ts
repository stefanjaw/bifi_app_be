import { BaseService } from "../../../utils";
import { room, roomModel } from "../models/room";

export class RoomService extends BaseService<room> {
  constructor() {
    super(roomModel);
  }
}
