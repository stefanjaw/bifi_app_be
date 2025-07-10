import { BaseController } from "../../../system";
import { company } from "../models/company.model";
import { CompanyService } from "../services/company-service";

const companyService = new CompanyService();

export class CompanyController extends BaseController<company> {
  constructor() {
    super({ service: companyService });
  }
}
