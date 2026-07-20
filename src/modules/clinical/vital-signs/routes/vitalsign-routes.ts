import { BaseRoutes, authorizeMiddleware } from "../../../../system";
import { VitalSignDocument } from "@mongodb-types";
import { VitalSignController } from "../controllers/vitalsign-controller";
import { VitalSignDTO, UpdateVitalSignDTO } from "../models/vitalsign.dto";

const vitalSignController = new VitalSignController();

/** Route definitions for vital sign endpoints */
export class VitalSignRouter extends BaseRoutes<VitalSignDocument> {
  constructor() {
    super({
      controller: vitalSignController,
      endpoint: "/vital-signs",
      dtoCreateClass: VitalSignDTO,
      dtoUpdateClass: UpdateVitalSignDTO,
    });
  }

  protected override initRoutes() {
    super.initRoutes();

    this.router.post(
      "/vital-signs/many",
      authorizeMiddleware("vital-signs", "create"),
      vitalSignController.createMany,
    );
  }
}
