import { BaseRoutes } from "../../../../system";
import { OutcomeDocument } from "@mongodb-types";
import { OutcomeController } from "../controllers/outcome-controller";
import { OutcomeDTO, UpdateOutcomeDTO } from "../models/outcome.dto";

const outcomeController = new OutcomeController();

/** Route definitions for outcome endpoints */
export class OutcomeRouter extends BaseRoutes<OutcomeDocument> {
  constructor() {
    super({
      controller: outcomeController,
      endpoint: "/outcomes",
      dtoCreateClass: OutcomeDTO,
      dtoUpdateClass: UpdateOutcomeDTO,
    });
  }
}
