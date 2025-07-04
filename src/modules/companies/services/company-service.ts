import { BaseService } from "../../../utils";
import { company, companyModel } from "../models/company";

export class CompanyService extends BaseService<company> {
  constructor() {
    super(companyModel);
  }
}
