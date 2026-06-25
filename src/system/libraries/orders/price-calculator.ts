export interface LineItemInput {
  quantity: number;
  unitPrice: number;
}

export interface LineItemWithTaxIds extends LineItemInput {
  taxIds?: string[];
}

export interface TaxInput {
  _id: string;
  percentage: number;
}

export interface AppliedTax {
  taxId: string;
  amount: number;
}

export interface TaxCalculationResult {
  taxTotal: number;
  appliedTaxes: AppliedTax[];
}

/**
 * Calculates a single line-item total = quantity × unitPrice, rounded to 2 decimals.
 * @param quantity - Item quantity.
 * @param unitPrice - Price per unit.
 * @returns The line-item total rounded to 2 decimals.
 */
export function calculateLineItemTotal(
  quantity: number,
  unitPrice: number
): number {
  return Number((quantity * unitPrice).toFixed(2));
}

/**
 * Sums all line-item totals across the given items.
 * @param lineItems - Array of line items with quantity and unitPrice.
 * @returns The subtotal rounded to 2 decimals.
 */
export function calculateSubtotal(lineItems: LineItemInput[]): number {
  const raw = lineItems.reduce((sum, item) => {
    return (
      sum +
      calculateLineItemTotal(
        Number(item.quantity ?? 0),
        Number(item.unitPrice ?? 0)
      )
    );
  }, 0);
  return Number(raw.toFixed(2));
}

/**
 * Calculates taxes as a flat percentage of the subtotal.
 * Each tax in taxDocs is applied to the full subtotal and aggregated.
 * @param subtotal - The subtotal to apply taxes on.
 * @param taxDocs - Array of tax definitions with percentage.
 * @returns The tax calculation result with total and per-tax breakdown.
 */
export function calculateTaxes(
  subtotal: number,
  taxDocs: TaxInput[]
): TaxCalculationResult {
  let taxTotal = 0;
  const appliedTaxes: AppliedTax[] = [];

  for (const tax of taxDocs) {
    const amount = Number(
      (subtotal * ((tax.percentage ?? 0) / 100)).toFixed(2)
    );
    taxTotal += amount;
    appliedTaxes.push({ taxId: tax._id.toString(), amount });
  }

  return {
    taxTotal: Number(taxTotal.toFixed(2)),
    appliedTaxes,
  };
}

/**
 * Calculates taxes from per-line taxIds, aggregating amounts across all lines
 * by taxId. Returns the total tax and a flat list of applied taxes.
 * @param lineItems Array of line items, each carrying its own taxIds
 * @param taxDocsMap Map of taxId (string) → TaxInput (must have `percentage`)
 * @returns The tax calculation result with total and per-tax breakdown.
 */
export function calculateTaxesPerLine(
  lineItems: LineItemWithTaxIds[],
  taxDocsMap: Map<string, TaxInput>
): TaxCalculationResult {
  const aggregated = new Map<string, number>();

  for (const item of lineItems) {
    const lineBase = calculateLineItemTotal(
      Number(item.quantity ?? 0),
      Number(item.unitPrice ?? 0)
    );
    for (const taxId of item.taxIds ?? []) {
      const tax = taxDocsMap.get(taxId);
      if (!tax) continue;
      const amount = Number(
        (lineBase * ((tax.percentage ?? 0) / 100)).toFixed(2)
      );
      aggregated.set(
        taxId,
        Number(((aggregated.get(taxId) ?? 0) + amount).toFixed(2))
      );
    }
  }

  const appliedTaxes: AppliedTax[] = [];
  let taxTotal = 0;
  for (const [taxId, amount] of aggregated) {
    appliedTaxes.push({ taxId, amount });
    taxTotal = Number((taxTotal + amount).toFixed(2));
  }

  return { taxTotal: Number(taxTotal.toFixed(2)), appliedTaxes };
}

/**
 * Returns subtotal + taxTotal, rounded to 2 decimals.
 * @param subtotal - The subtotal amount.
 * @param taxTotal - The total tax amount.
 * @returns The grand total rounded to 2 decimals.
 */
export function calculateGrandTotal(
  subtotal: number,
  taxTotal: number
): number {
  return Number((subtotal + taxTotal).toFixed(2));
}
