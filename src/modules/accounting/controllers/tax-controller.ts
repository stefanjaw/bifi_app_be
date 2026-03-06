import { BaseController } from "../../../system";
import { TaxDocument } from "../models/tax.model";
import { TaxService } from "../services/tax-service";

const taxService = new TaxService();

export class TaxController extends BaseController<TaxDocument> {
  constructor() {
    super({ service: taxService });
  }
}
