import { BaseRoutes } from "../../../../system";
import { CondicionVentaDocument } from "../models/condicion-venta.model";
import { CondicionVentaController } from "../controllers/condicion-venta-controller";
import {
  CondicionVentaDTO,
  UpdateCondicionVentaDTO,
} from "../models/condicion-venta.dto";

const condicionVentaController = new CondicionVentaController();

export class CondicionVentaRouter extends BaseRoutes<CondicionVentaDocument> {
  constructor() {
    super({
      controller: condicionVentaController,
      endpoint: "/cr-einvoice/condicion-venta",
      dtoCreateClass: CondicionVentaDTO,
      dtoUpdateClass: UpdateCondicionVentaDTO,
    });
  }
}
