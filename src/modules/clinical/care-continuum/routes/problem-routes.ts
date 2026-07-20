import { BaseRoutes } from "../../../../system";
import { ProblemController } from "../controllers/problem-controller";
import { ProblemDTO, UpdateProblemDTO } from "../models/problem.dto";
import { CareContinuumProblemDocument } from "../models/problem.model";

const problemController = new ProblemController();
/** Route definitions for care continuum problem endpoints */
export class ProblemRouter extends BaseRoutes<CareContinuumProblemDocument> {
  constructor() {
    super({
      controller: problemController,
      endpoint: "/care-continuum-problems",
      dtoCreateClass: ProblemDTO,
      dtoUpdateClass: UpdateProblemDTO,
    });
  }
}
