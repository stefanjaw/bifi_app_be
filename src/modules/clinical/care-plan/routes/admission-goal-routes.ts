import { BaseRoutes } from "../../../../system";
import { AdmissionGoalDocument } from "@mongodb-types";
import { AdmissionGoalController } from "../controllers/admission-goal-controller";
import {
  AdmissionGoalDTO,
  UpdateAdmissionGoalDTO,
} from "../models/admission-goal.dto";

const admissionGoalController = new AdmissionGoalController();

/** Route definitions for admission goal endpoints */
export class AdmissionGoalRouter extends BaseRoutes<AdmissionGoalDocument> {
  constructor() {
    super({
      controller: admissionGoalController,
      endpoint: "/admission-goals",
      dtoCreateClass: AdmissionGoalDTO,
      dtoUpdateClass: UpdateAdmissionGoalDTO,
    });
  }
}
