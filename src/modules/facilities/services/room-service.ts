import { BaseService } from "../../../system";
import { room, roomModel } from "../models/room";

export class RoomService extends BaseService<room> {
  constructor() {
    super({ model: roomModel });
  }
}
