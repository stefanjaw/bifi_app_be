import { BaseController } from "../../../../system";
import { CondicionVentaDocument } from "../models/condicion-venta.model";
import { CondicionVentaService } from "../services/condicion-venta-service";

const condicionVentaService = new CondicionVentaService();

export class CondicionVentaController extends BaseController<CondicionVentaDocument> {
  constructor() {
    super({ service: condicionVentaService });
  }
}
