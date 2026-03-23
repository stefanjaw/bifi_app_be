import { TicketRuleDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { TicketRuleController } from "../controllers/ticket-rule-controller";
import { TicketRuleDTO, UpdateTicketRuleDTO } from "../models/ticket-rule.dto";

const ticketRuleController = new TicketRuleController();

export class TicketRuleRouter extends BaseRoutes<TicketRuleDocument> {
  constructor() {
    super({
      controller: ticketRuleController,
      endpoint: "/ticket-rules",
      dtoCreateClass: TicketRuleDTO,
      dtoUpdateClass: UpdateTicketRuleDTO,
    });
  }
}
