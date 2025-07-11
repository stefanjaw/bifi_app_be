import { BaseService } from "../../../system";
import { RoomDocument } from "../../../types/mongoose.gen";
import { roomModel } from "../models/room.model";

export class RoomService extends BaseService<RoomDocument> {
  constructor() {
    super({ model: roomModel });
  }
}
