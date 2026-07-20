import { BaseController } from "../../../../system";
import { VendorDocument } from "@mongodb-types";
import { VendorService } from "../services/vendor-service";

const vendorService = new VendorService();

/** Controller for vendor records */
export class VendorController extends BaseController<VendorDocument> {
  constructor() {
    super({ service: vendorService });
  }
}
