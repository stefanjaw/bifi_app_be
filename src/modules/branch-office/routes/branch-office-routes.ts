import { BaseRoutes } from "../../../system";
import { BranchOfficeDocument } from "../models/branch-office.model";
import { BranchOfficeController } from "../controllers/branch-office-controller";
import {
  BranchOfficeDTO,
  UpdateBranchOfficeDTO,
} from "../models/branch-office.dto";

const branchOfficeController = new BranchOfficeController();

export class BranchOfficeRouter extends BaseRoutes<BranchOfficeDocument> {
  constructor() {
    super({
      controller: branchOfficeController,
      endpoint: "/branch-offices",
      dtoCreateClass: BranchOfficeDTO,
      dtoUpdateClass: UpdateBranchOfficeDTO,
    });
  }
}
