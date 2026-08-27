import {
  authorizeMiddleware,
  BaseRoutes,
  validateAndTransformCSVMiddleware,
} from "../../../system";
import { RoomDocument } from "../../../types/mongoose.gen";
import { RoomController } from "../controllers/room-controller";
import { RoomDTO, UpdateRoomDTO } from "../models/room.dto";
import { RoomCSVDTO } from "../models/room-csv.dto";
const roomController = new RoomController();

export class RoomRouter extends BaseRoutes<RoomDocument> {
  constructor() {
    super({
      controller: roomController,
      endpoint: "/rooms",
      dtoCreateClass: RoomDTO,
      dtoUpdateClass: UpdateRoomDTO,
      csvDtoClass: RoomCSVDTO,
    });
  }

  protected override initRoutes(): void {
    this.initValidateImportRoute();
    super.initRoutes();
  }

  private initValidateImportRoute(): void {
    this.router.post(
      `${this.endpoint}/import/validate`,
      this.upload.single("csv"),
      validateAndTransformCSVMiddleware(RoomCSVDTO),
      authorizeMiddleware(`${this.resource}/import`, "create"),
      roomController.validateImport,
    );
  }
}
