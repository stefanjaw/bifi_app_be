import { BaseController } from "../../../../system";
import { CareContinuumProblemDocument } from "@mongodb-types";
import { ProblemService } from "../services/problem-service";

const problemService = new ProblemService();
/** Express controller for care continuum problem CRUD operations */
export class ProblemController extends BaseController<CareContinuumProblemDocument> {
  constructor() {
    super({ service: problemService });
  }
}
