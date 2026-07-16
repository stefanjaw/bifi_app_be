import { BaseController } from "../../../system";
import { VendorDocument } from "@mongodb-types";
import { VendorService } from "../services/vendor-service";

const vendorService = new VendorService();

export class VendorController extends BaseController<VendorDocument> {
  constructor() {
    super({ service: vendorService });
  }
}
