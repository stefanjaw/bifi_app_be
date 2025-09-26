import mongoose, { PaginateModel } from "mongoose";
import { BaseService } from "../../../system";
import { roomModel } from "../models/room.model";
import { FacilityDocument, RoomDocument } from "@mongodb-types";

export class RoomService extends BaseService<RoomDocument> {
  constructor() {
    super({
      model: roomModel,
      refFields: [
        {
          path: "facilityId",
          getModel: () =>
            mongoose.model("Facility") as PaginateModel<FacilityDocument>,
          isArray: false,
        },
      ],
    });
  }
}
