import { BaseController } from "../../../system";
import { AdmissionGoalDocument } from "../models/admission-goal.model";
import { AdmissionGoalService } from "../services/admission-goal-service";

const admissionGoalService = new AdmissionGoalService();

/** Express controller for admission goal CRUD operations */
export class AdmissionGoalController extends BaseController<AdmissionGoalDocument> {
  constructor() {
    super({ service: admissionGoalService });
  }
}
