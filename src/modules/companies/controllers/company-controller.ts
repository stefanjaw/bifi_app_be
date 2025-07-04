import { BaseController } from "../../../utils";
import { company } from "../models/company";
import { CompanyService } from "../services/company-service";

const companyService = new CompanyService();

export class CompanyController extends BaseController<company> {
  constructor() {
    super(companyService);
  }
}
