import { BaseService } from "../../../../system";
import { medioPagoModel, MedioPagoDocument } from "../models/medio-pago.model";

export class MedioPagoService extends BaseService<MedioPagoDocument> {
  constructor() {
    super({ model: medioPagoModel });
  }
}
