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
            this.connectionManager.getModel<FacilityDocument>("Facility"),
          isArray: false,
        },
      ],
    });
  }
}
