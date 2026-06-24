import { TicketRuleDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { ticketRuleModel } from "../models/ticket-rule.model";
import { TicketRuleDTO, UpdateTicketRuleDTO } from "../models/ticket-rule.dto";

type MatchField = "name" | "description" | "category" | "appModule" | "type" | "tags";
type Operator = "contains" | "equals" | "startsWith" | "endsWith";

function matchesRule(
  document: Record<string, unknown>,
  field: MatchField,
  operator: Operator,
  ruleValue: string,
): boolean {
  const raw = document[field];
  const fieldStr = Array.isArray(raw)
    ? raw.join(" ").toLowerCase()
    : String(raw ?? "").toLowerCase();
  const val = ruleValue.toLowerCase();

  switch (operator) {
    case "contains":
      return fieldStr.includes(val);
    case "equals":
      return fieldStr === val;
    case "startsWith":
      return fieldStr.startsWith(val);
    case "endsWith":
      return fieldStr.endsWith(val);
    default:
      return false;
  }
}

export class TicketRuleService extends BaseService<TicketRuleDocument> {
  constructor() {
    super({ model: ticketRuleModel, refFields: [] });
  }

  async evaluateRules(
    data: Record<string, unknown>,
  ): Promise<{
    assigned?: string;
    priority?: string;
  }> {
    const model = this.connectionManager.bindModelToDb(this.model);
    const rules = (await model
      .find({ active: true })
      .sort({ order: 1 })
      .lean()) as unknown as (TicketRuleDocument & {
      field: MatchField;
      operator: Operator;
      value: string;
      action: "setAssigned" | "setPriority";
      actionValue: string;
    })[];

    const result: { assigned?: string; priority?: string } = {};

    for (const rule of rules) {
      if (!matchesRule(data, rule.field, rule.operator, rule.value)) continue;

      if (rule.action === "setAssigned" && !result.assigned) {
        result.assigned = rule.actionValue;
      } else if (rule.action === "setPriority" && !result.priority) {
        result.priority = rule.actionValue;
      }

      if (result.assigned && result.priority) break;
    }

    return result;
  }
}
