import { BaseRoutes } from "../../../../system";
import { MedioPagoDocument } from "../models/medio-pago.model";
import { MedioPagoController } from "../controllers/medio-pago-controller";
import { MedioPagoDTO, UpdateMedioPagoDTO } from "../models/medio-pago.dto";

const medioPagoController = new MedioPagoController();

export class MedioPagoRouter extends BaseRoutes<MedioPagoDocument> {
  constructor() {
    super({
      controller: medioPagoController,
      endpoint: "/cr-einvoice/medio-pago",
      dtoCreateClass: MedioPagoDTO,
      dtoUpdateClass: UpdateMedioPagoDTO,
    });
  }
}
