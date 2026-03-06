import { BaseController } from "../../../system";
import { BranchOfficeDocument } from "../models/branch-office.model";
import { BranchOfficeService } from "../services/branch-office-service";

const branchOfficeService = new BranchOfficeService();

export class BranchOfficeController extends BaseController<BranchOfficeDocument> {
  constructor() {
    super({ service: branchOfficeService });
  }
}
