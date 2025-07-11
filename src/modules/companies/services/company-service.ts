import { BaseService } from "../../../system";
import { CompanyDocument } from "../../../types/mongoose.gen";
import { companyModel } from "../models/company.model";

export class CompanyService extends BaseService<CompanyDocument> {
  constructor() {
    super({ model: companyModel });
  }
}
