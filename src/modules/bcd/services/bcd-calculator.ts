import { BCDChargeCodeDocument } from "@mongodb-types";
import {
  BCDChargeDTO,
  BcdDTO,
  BCDRecordDTO,
  TaxEntryDTO,
  UpdateBcdDTO,
} from "../models/bcd.dto";

/**
 * Calculates the values of a BCD.
 * It calculates the records count, invoice amount, header charges, total header charges payable, records due and final payable amount.
 * @param bcd - The BCD document object containing the records, charges, invoice amount, payable amount values.
 * @param customCharges - A Record containing the custom charge codes.
 */
export function calculateBCD(
  bcd: BcdDTO | UpdateBcdDTO,
  customCharges: Record<string, BCDChargeCodeDocument>
) {
  const records = bcd.records || [];
  const charges = bcd.charges || [];

  bcd.recordsCount = records.length;

  // 1️ Records
  records.forEach((r) => calculateRecord(r, customCharges));

  // 2️ Invoice amount - sum of all records
  bcd.invoiceAmount = round2(
    records.reduce((acc, r) => acc + (r.bdaValue ?? 0), 0)
  );

  // 3️ Header charges
  charges.forEach((c) => {
    c.amount = round2(calculateCharge(c, bcd.invoiceAmount ?? 0));
  });

  // 4️ Header payable
  const headerChargeAmount = charges
    .filter(
      (c) =>
        customCharges[c.code || ""]?.impact?.payable &&
        customCharges[c.code || ""]?.type !== "S"
    )
    .reduce((acc, c) => {
      const type = customCharges[c.code || ""]?.type;
      return type === "D" ? acc - (c.amount ?? 0) : acc + (c.amount ?? 0);
    }, 0);

  const recordsDue = round2(
    records.reduce((acc, r) => acc + (r.totalDue ?? 0), 0)
  );

  bcd.payableAmount = Math.max(0, round2(recordsDue + headerChargeAmount));
}

/**
 * Calculate the values of a BCD record.
 * It calculates the base value, charges, customs value, taxes and total due.
 * @param record - The BCD record object containing the lines subtotal, exchange rate, charges, taxes and total due values.
 * @param customCharges - A Record containing the custom charge codes.
 */
export function calculateRecord(
  record: BCDRecordDTO,
  customCharges: Record<string, BCDChargeCodeDocument>
) {
  // 1️ Base value
  const base = round2(record.linesSubtotal * record.exchangeRate);
  const charges = record.charges || [];
  const taxes = record.tax || [];

  // 2️ Charges - calculate each charge
  charges.forEach((c) => {
    c.amount = round2(calculateCharge(c, base));
  });

  record.bdaValue = base;

  // 4️ Taxes - calculate each tax
  taxes.forEach((t) => {
    t.valueForTax = record.bdaValue;
    t.amount = round2(calculateTax(t));
  });

  const taxAmount = round2(
    taxes.reduce((acc, t) => acc + (t.amount ?? 0), 0) ?? 0
  );

  // 5️ Charges that effect payable
  const chargePayable = charges
    .filter(
      (c) =>
        customCharges[c.code || ""]?.impact?.payable &&
        customCharges[c.code || ""]?.type !== "S"
    )
    .reduce((acc, c) => {
      const type = customCharges[c.code || ""]?.type;
      return type === "D" ? acc - (c.amount ?? 0) : acc + (c.amount ?? 0);
    }, 0);

  record.totalDue = Math.max(0, round2(taxAmount + chargePayable));
}

/**
 * Calculates the charge amount based on the given form values.
 * If the percentage value is not null, it returns the calculated charge amount by multiplying the base amount by the percentage divided by 100.
 * If the percentage value is null, it returns the amount value, or 0 if no amount value is provided.
 * @param charge The charge object containing the percentage and amount values.
 * @param base The base amount to multiply the percentage by.
 * @returns The calculated charge amount, or the amount value if no percentage is provided.
 */
export function calculateCharge(charge: BCDChargeDTO, base: number) {
  if (charge.percentage && charge.percentage > 0) {
    return (charge.percentage / 100) * base; // 👈 sin toFixed aquí
  }

  return charge.amount ?? 0;
}

/**
 * Calculates the tax amount based on the given tax entry.
 * If the tax entry has a percentage value, it will be used to calculate the tax amount.
 * Otherwise, the tax amount will be used.
 * @param {TaxEntryDTO} tax - The tax entry to calculate the amount for.
 * @returns {number} The calculated tax amount.
 */
export function calculateTax(tax: TaxEntryDTO) {
  if (tax.ratePercentage && tax.ratePercentage > 0) {
    return tax.valueForTax * (tax.ratePercentage / 100);
  }

  return tax.amount ?? 0;
}

/**
 * Rounds a number to 2 decimal places.
 * This function uses the built-in Math.round() function to round the number,
 * but first adds a small value (Number.EPSILON) to the number to avoid
 * rounding errors due to floating point precision.
 * @param {number} value - The number to round.
 * @returns {number} The rounded number.
 */
function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
