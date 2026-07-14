import { TicketRuleDocument } from "@mongodb-types";
import { BaseController } from "../../../system";
import { TicketRuleService } from "../services/ticket-rule-service";

const ticketRuleService = new TicketRuleService();

export class TicketRuleController extends BaseController<TicketRuleDocument> {
  constructor() {
    super({ service: ticketRuleService });
  }
}
