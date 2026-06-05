import { BaseController } from "../../../../system";
import { MedioPagoDocument } from "../models/medio-pago.model";
import { MedioPagoService } from "../services/medio-pago-service";

const medioPagoService = new MedioPagoService();

export class MedioPagoController extends BaseController<MedioPagoDocument> {
  constructor() {
    super({ service: medioPagoService });
  }
}
