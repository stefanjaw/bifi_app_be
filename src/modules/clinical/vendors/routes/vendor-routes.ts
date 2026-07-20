import { BaseRoutes } from "../../../../system";
import { VendorDocument } from "@mongodb-types";
import { VendorController } from "../controllers/vendor-controller";
import { VendorDTO, UpdateVendorDTO } from "../models/vendor.dto";

const vendorController = new VendorController();

/** Route definitions for vendor endpoints */
export class VendorRouter extends BaseRoutes<VendorDocument> {
  constructor() {
    super({
      controller: vendorController,
      endpoint: "/vendors",
      dtoCreateClass: VendorDTO,
      dtoUpdateClass: UpdateVendorDTO,
    });
  }
}
