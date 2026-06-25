export interface RecipientOption {
  id: string;
  label: string;
}

export interface CatalogEvent {
  type: string;
  label: string;
  description: string;
  module: string;
  icon: string;
  iconBg: string;
  recipientOptions: RecipientOption[];
  defaultRecipients: string[];
}

export const EVENT_CATALOG: CatalogEvent[] = [
  {
    type: "invoice_paid",
    label: "Invoice Fully Paid",
    description:
      "Fires when a payment brings an invoice's outstanding balance to zero.",
    module: "accounting",
    icon: "pi pi-check-circle",
    iconBg: "bg-green-100 text-green-600",
    recipientOptions: [
      { id: "salesperson", label: "Salesperson" },
      { id: "creator", label: "Invoice Creator" },
    ],
    defaultRecipients: ["salesperson"],
  },
  {
    type: "po_received",
    label: "Purchase Order Received",
    description:
      'Fires when a PO status is updated to "Received" or "Partially Received".',
    module: "purchases",
    icon: "pi pi-box",
    iconBg: "bg-blue-100 text-blue-600",
    recipientOptions: [{ id: "creator", label: "PO Creator" }],
    defaultRecipients: ["creator"],
  },
  {
    type: "task_assigned",
    label: "Task Assigned",
    description:
      "Fires when a task is created with an assignee, or when a task is reassigned (from unassigned or from another user). Notifies the new assignee.",
    module: "tasks",
    icon: "pi pi-clipboard",
    iconBg: "bg-purple-100 text-purple-600",
    recipientOptions: [
      { id: "assignee", label: "Assignee" },
      { id: "creator", label: "Task Creator" },
    ],
    defaultRecipients: ["assignee"],
  },
  {
    type: "invoice_posted",
    label: "Invoice Posted",
    description: "Fires when an invoice is moved from Draft to Posted status.",
    module: "accounting",
    icon: "pi pi-send",
    iconBg: "bg-indigo-100 text-indigo-600",
    recipientOptions: [
      { id: "salesperson", label: "Salesperson" },
      { id: "creator", label: "Invoice Creator" },
    ],
    defaultRecipients: ["salesperson"],
  },
  {
    type: "po_sent",
    label: "Purchase Order Sent",
    description:
      'Fires when a purchase order status is updated to "Sent" (dispatched to supplier).',
    module: "purchases",
    icon: "pi pi-truck",
    iconBg: "bg-orange-100 text-orange-600",
    recipientOptions: [{ id: "creator", label: "PO Creator" }],
    defaultRecipients: ["creator"],
  },
  {
    type: "ticket_assigned",
    label: "Helpdesk Ticket Assigned",
    description:
      "Fires when a helpdesk ticket is assigned or re-assigned to a different agent.",
    module: "helpdesk",
    icon: "pi pi-headphones",
    iconBg: "bg-cyan-100 text-cyan-600",
    recipientOptions: [
      { id: "assignee", label: "New Assignee" },
      { id: "creator", label: "Ticket Reporter" },
    ],
    defaultRecipients: ["assignee"],
  },
  {
    type: "ticket_resolved",
    label: "Helpdesk Ticket Resolved",
    description:
      'Fires when a helpdesk ticket is moved to a stage whose name contains "Resolved".',
    module: "helpdesk",
    icon: "pi pi-check",
    iconBg: "bg-teal-100 text-teal-600",
    recipientOptions: [
      { id: "assignee", label: "Assigned Agent" },
      { id: "reporter", label: "Ticket Reporter" },
    ],
    defaultRecipients: ["assignee"],
  },
  {
    type: "deal_won",
    label: "CRM Deal Won",
    description:
      'Fires when a CRM opportunity is moved to a stage whose name contains "Won".',
    module: "sales",
    icon: "pi pi-trophy",
    iconBg: "bg-yellow-100 text-yellow-600",
    recipientOptions: [
      { id: "salesperson", label: "Salesperson" },
      { id: "owner", label: "Deal Owner" },
    ],
    defaultRecipients: ["salesperson"],
  },
];

export function GET_DEFAULT_EVENTS(): Array<{
  type: string;
  enabled: boolean;
  recipients: string[];
}> {
  return EVENT_CATALOG.map((e) => ({
    type: e.type,
    enabled: true,
    recipients: [...e.defaultRecipients],
  }));
}
