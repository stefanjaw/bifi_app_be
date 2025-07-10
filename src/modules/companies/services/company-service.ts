import { BaseService } from "../../../system";
import { company, companyModel } from "../models/company.model";

export class CompanyService extends BaseService<company> {
  constructor() {
    super({ model: companyModel });
  }
}
