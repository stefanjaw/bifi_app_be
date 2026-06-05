import { BaseService } from "../../../../system";
import { condicionVentaModel, CondicionVentaDocument } from "../models/condicion-venta.model";

export class CondicionVentaService extends BaseService<CondicionVentaDocument> {
  constructor() {
    super({ model: condicionVentaModel });
  }
}
