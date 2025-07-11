import { BaseController } from "../../../system";
import { CompanyDocument } from "../../../types/mongoose.gen";
import { CompanyService } from "../services/company-service";

const companyService = new CompanyService();

export class CompanyController extends BaseController<CompanyDocument> {
  constructor() {
    super({ service: companyService });
  }
}
