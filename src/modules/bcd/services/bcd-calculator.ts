import { BCDChargeCodeDocument } from "@mongodb-types";
import {
  BCDChargeDTO,
  BcdDTO,
  BCDRecordDTO,
  TaxEntryDTO,
  UpdateBcdDTO,
} from "../models/bcd.dto";

/**
 * Calculates the BCD document values.
 * This function takes a BCD document and calculates the values for recordsCount, invoiceAmount, charges, payableAmount.
 * @param bcd - The BCD document to calculate the values for.
 */
export function calculateBCD(
  bcd: BcdDTO | UpdateBcdDTO,
  customCharges: Record<string, BCDChargeCodeDocument>,
) {
  const records = bcd.records || [];
  const charges = bcd.charges || [];

  bcd.recordsCount = records.length;

  // 3. Calculate records
  records.forEach((r) => calculateRecord(r, customCharges));

  // 4. Invoice amount (sum of customs values)
  bcd.invoiceAmount = Number(
    records.reduce((acc, r) => acc + (r.bdaValue ?? 0), 0).toFixed(2),
  );

  // 5. Document charges (like R20 = 500)
  charges.forEach((c) => {
    c.amount = calculateCharge(c, bcd.invoiceAmount ?? 0);
  });

  // 6. Total charges based on custom like (R20 = 500)
  const chargeAmount = Number(
    charges
      .filter(
        (c) =>
          customCharges[c.code || ""] &&
          customCharges[c.code || ""]?.impact?.payable &&
          customCharges[c.code || ""]?.type !== "S",
      )
      .reduce((acc, c) => {
        if (customCharges[c.code || ""]?.type === "D")
          return acc - (c.amount ?? 0);
        else return acc + (c.amount ?? 0);
      }, 0)
      .toFixed(2),
  );

  // 7. Records due
  const recordsDueAmount = Number(
    records.reduce((acc, r) => acc + (r.totalDue ?? 0), 0).toFixed(2),
  );

  // 8 Final payable
  bcd.payableAmount = Math.max(
    0,
    Number((recordsDueAmount + chargeAmount).toFixed(2)),
  );
}

/**
 * Calculates the values of a BCD record.
 * It calculates the base value, charges, BDA value, taxes and total due.
 * @param record - The BCD record object containing the linesSubtotal, exchangeRate, charges, taxes and total due values.
 */
export function calculateRecord(
  record: BCDRecordDTO,
  customCharges: Record<string, BCDChargeCodeDocument>,
) {
  // 1. Base
  const base = Number((record.linesSubtotal * record.exchangeRate).toFixed(2));

  // 2. Charges
  record.charges.forEach((c) => {
    c.amount = calculateCharge(c, base);
  });

  // 3. Calculate charge amount based on custom charges impact
  const chargeAmount = Number(
    record.charges
      .filter(
        (c) =>
          customCharges[c.code || ""] &&
          customCharges[c.code || ""]?.impact?.customsValue &&
          customCharges[c.code || ""]?.type !== "S",
      )
      .reduce((acc, c) => {
        if (customCharges[c.code || ""]?.type === "D")
          return acc - (c.amount ?? 0);
        else return acc + (c.amount ?? 0);
      }, 0)
      .toFixed(2),
  );

  // 4. Customs value
  record.bdaValue = Math.max(0, Number((base + chargeAmount).toFixed(2)));

  // 4. Taxes (all use customs value)
  record.tax?.forEach((t) => {
    t.valueForTax = record.bdaValue ?? 0;
    t.amount = calculateTax(t);
  });

  // 5. Total taxes
  const taxAmount = Number(
    (record.tax?.reduce((acc, t) => acc + (t.amount ?? 0), 0) ?? 0).toFixed(2),
  );

  // 6. Calculate charge amount based on custom charges impact
  const chargePayableAmount = Number(
    record.charges
      .filter(
        (c) =>
          customCharges[c.code || ""] &&
          customCharges[c.code || ""]?.impact?.payable &&
          customCharges[c.code || ""]?.type !== "S",
      )
      .reduce((acc, c) => {
        if (customCharges[c.code || ""]?.type === "D")
          return acc - (c.amount ?? 0);
        else return acc + (c.amount ?? 0);
      }, 0)
      .toFixed(2),
  );

  // 7. Total due = sum of taxes
  record.totalDue = Math.max(
    0,
    Number(((taxAmount ?? 0) + chargePayableAmount).toFixed(2)),
  );
}

/**
 * Calculates the charge amount based on the given charge and base.
 * If the charge has a percentage value, it will be used to calculate the charge amount.
 * Otherwise, the charge amount will be used.
 * @param {BCDChargeDTO} charge - The charge to calculate the amount for.
 * @param {number} base - The base value to calculate the charge amount from.
 * @returns {number} The calculated charge amount.
 */
export function calculateCharge(charge: BCDChargeDTO, base: number) {
  const percentage = charge.percentage ?? 0;
  const amount = charge.amount;

  if (percentage > 0) {
    return Number(((percentage / 100) * base).toFixed(2));
  }

  return amount ?? 0;
}

/**
 * Calculates the amount of a tax entry based on the given form values.
 * If the rate percentage value is not null, it returns the calculated tax amount by multiplying the value for tax by the rate percentage divided by 100.
 * If the rate percentage value is null, it returns the amount value, or 0 if no amount value is provided.
 * @param tax The tax entry object containing the code, value for tax, rate percentage and amount values.
 * @returns The calculated tax amount, or the amount value if no rate percentage is provided.
 */
export function calculateTax(tax: TaxEntryDTO) {
  const valueForTax = tax.valueForTax ?? 0;
  const rate = tax.ratePercentage ?? 0;
  const amount = tax.amount;

  if (rate > 0) {
    return Number((valueForTax * (rate / 100)).toFixed(2));
  }

  return amount ?? 0;
}
