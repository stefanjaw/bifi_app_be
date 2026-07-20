import { BaseController } from "../../../../system";
import { OutcomeDocument } from "@mongodb-types";
import { OutcomeService } from "../services/outcome-service";

const outcomeService = new OutcomeService();

/** Express controller for outcome CRUD operations */
export class OutcomeController extends BaseController<OutcomeDocument> {
  constructor() {
    super({ service: outcomeService });
  }
}
