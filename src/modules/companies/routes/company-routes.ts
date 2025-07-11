import { BaseRoutes } from "../../../system";
import { CompanyDocument } from "../../../types/mongoose.gen";
import { CompanyController } from "../controllers/company-controller";
import { CompanyDTO, UpdateCompanyDTO } from "../models/company.dto";

const companyController = new CompanyController();

export class CompanyRouter extends BaseRoutes<CompanyDocument> {
  constructor() {
    super({
      controller: companyController,
      endpoint: "/companies",
      dtoCreateClass: CompanyDTO,
      dtoUpdateClass: UpdateCompanyDTO,
    });
  }
}
