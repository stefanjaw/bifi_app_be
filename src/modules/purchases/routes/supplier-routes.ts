import { BaseRoutes } from "../../../system/libraries/base-module/base-routes";
import { authorizeMiddleware } from "../../../system/middlewares";
import { SupplierController } from "../controllers/supplier-controller";
import { ContactDTO, UpdateContactDTO } from "../../contacts/models/contact.dto";
import { ContactDocument } from "@mongodb-types";

const supplierController = new SupplierController();

export class SupplierRouter extends BaseRoutes<ContactDocument> {
  constructor() {
    super({
      controller: supplierController,
      endpoint: "/purchases/suppliers",
      dtoCreateClass: ContactDTO,
      dtoUpdateClass: UpdateContactDTO,
    });
  }

  protected override initRoutes() {
    this.router.get(
      "/purchases/suppliers",
      authorizeMiddleware("purchases/suppliers", "read"),
      supplierController.getAll
    );
    this.router.get(
      "/purchases/suppliers/:id",
      authorizeMiddleware("purchases/suppliers", "read"),
      supplierController.getSupplierById
    );
  }
}
