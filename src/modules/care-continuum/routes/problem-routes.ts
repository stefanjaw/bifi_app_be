import { BaseRoutes } from "../../../system";
import { ProblemController } from "../controllers/problem-controller";
import { ProblemDTO, UpdateProblemDTO } from "../models/problem.dto";

const problemController = new ProblemController();
/** Route definitions for care continuum problem endpoints */
export class ProblemRouter extends BaseRoutes<any> {
  constructor() {
    super({
      controller: problemController,
      endpoint: "/care-continuum-problems",
      dtoCreateClass: ProblemDTO,
      dtoUpdateClass: UpdateProblemDTO,
    });
  }
}
