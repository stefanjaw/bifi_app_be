import {
  BCDAdditionalInformationDocument,
  BCDChargeDocument,
  BCDDocument,
  BCDRecordDocument,
  BCDRecordTaxDocument,
} from "@mongodb-types";
import dayjs from "dayjs";

/**
 * Compute a value based on its type and a given fixation
 * @param {string | number | null | undefined} value - The value to compute
 * @param {number} fixation - The number of decimal places to fix the value to
 * @returns {string} The computed value
 */
const computeValue = (
  value: string | number | null | undefined | dayjs.Dayjs,
  fixation = 2,
) => {
  switch (typeof value) {
    case "string":
      return value.replaceAll(",", " ").trim();
    case "number":
      return value.toFixed(fixation);
    case "object":
      return value?.format("DD/MM/YYYY") || "";
    default:
      return "";
  }
};

/**
 * Maps a BCDDocument to a header object for generating a BCD file.
 *
 * @param {BCDDocument} data - The BCDDocument to be mapped.
 * @returns {Object} - A header object containing the mapped data.
 */
const headerMapper = (data: BCDDocument) => ({
  recordType: "R10", // 1
  supplierId: computeValue(data.declarant.companyId), // 2
  supplierName: computeValue(data.supplier?.contactId?.name), // 3
  supplierAddressLine1: computeValue(data.supplier?.contactId?.streetAddress), // 4
  supplierAddressLine2: computeValue(data.supplier?.contactId?.streetAddress2), // 5
  supplierPostCode: computeValue(data.supplier?.contactId?.zipCode), // 6
  supplierCountry: computeValue(data.supplier?.contactId?.countryId?.code), // 7
  importerId: computeValue(data.declarant.companyId), // 8
  importerName: computeValue(data.importer?.contactId?.name), // 9
  importerAddressLine1: computeValue(data.importer?.contactId?.streetAddress), // 10
  importerAddressLine2: computeValue(data.importer?.contactId?.streetAddress2), // 11
  importerPostCode: computeValue(data.importer?.contactId?.zipCode), // 12
  importerCountry: computeValue(data.importer?.contactId?.countryId?.code), // 13
  vesselOrAirline: computeValue(data.transport?.aircraftOrVessel?.code), // 14
  voyageOrFlightNumber: computeValue(data.transport?.flightOrVoyage), // 15
  portOfArrival: computeValue(data.transport?.port?.code), // 16
  dateOfArrival: computeValue(
    data.transport?.arrivalDate ? dayjs(data.transport.arrivalDate) : null,
  ), // 17
  manifest: computeValue(data.manifest), // 18
  masterBOLAWB: computeValue(data.masterBOLAWB), // 19
  countryDispatch: computeValue(
    data.directShipmentCountry?.code.substring(0, 2),
  ), // 20
  countryOrigin: computeValue(
    data.originalShipmentCountry?.code.substring(0, 2),
  ), // 21
  warehouseId: computeValue(data.warehouseId), // 22
  OGDPaymentCode: computeValue(data.ogd?.paymentCode), // 23
  OGDCostCode: computeValue(data.ogd?.costCode), // 24
  OGDObjectCode: computeValue(data.ogd?.objectCode), // 25
  OGDSubsidiaryCode: computeValue(data.ogd?.subsidiaryCode), // 26
  OGDExplanation: computeValue(data.ogd?.explanation), // 27
  valuationMethod: computeValue(data.valuationMethod), // 28
  totalPackages: computeValue(data.packagesCount, 0), // 29
  totalNumberOfRecords: computeValue(data.records?.length, 0), // 30
  totalInvoice: data.invoiceAmount.toFixed(2), // 31
  totalPayable: data.payableAmount.toFixed(2), // 32
  declarantName: computeValue(data.declarant?.name), // 33
  declarantCompanyId: computeValue(data.declarant?.companyId), // 34
  declarantDate: computeValue(
    data.declarant?.date ? dayjs(data.declarant?.date) : null,
  ), // 35
  declarantCapacity: computeValue(data.declarant?.capacity), // 36
  declarantTraderReference: computeValue(data.declarant?.traderReference), // 37
  BCDType: computeValue(data.type?.code), // 38
});

/**
 * Maps a BCDChargeDocument to a charge object suitable for CSV export.
 * @param {BCDChargeDocument} data - The BCDChargeDocument to map.
 * @param {"header" | "record"} type - The type of the record to map.
 * @returns {Object} - The mapped charge object.
 */
const chargesMapper = (data: BCDChargeDocument, type: "header" | "record") => ({
  recordType: type === "header" ? "R20" : "R40", // 1
  chargeCode: computeValue(data.code?.code), // 2
  percentage: computeValue(data.percentage), // 3
  amount: computeValue(data.amount), // 4
});

/**
 * Maps a string to a container object suitable for CSV export.
 * @param {string} data - The string to map.
 * @returns {Object} - The mapped container object.
 */
const containerMapper = (data: string) => ({
  recordType: "R25", // 1
  containerId: computeValue(data), // 2
});

/**
 * Maps a BCDAdditionalInformationDocument to an additional information object suitable for CSV export.
 * @param {BCDAdditionalInformationDocument} data - The BCDAdditionalInformationDocument to map.
 * @param {"header" | "record"} type - The type of the record to map.
 * @returns {Object} - The mapped additional information object.
 */
const additionalInfoMapper = (
  data: BCDAdditionalInformationDocument,
  type: "header" | "record",
) => ({
  recordType: type === "header" ? "R26" : "R60", // 1
  infoType: computeValue(data.type?.code), // 2
  value: computeValue(data.value), // 3
});

/**
 * Maps a string to a house bill of lading object suitable for CSV export.
 * @param {string} data - The string to map.
 * @returns {Object} - The mapped house bill of lading object.
 */
const houseBOLMapper = (data: string) => ({
  recordType: "R28", // 1
  houseBOLAWB: computeValue(data), // 2
});

/**
 * Maps a BCDRecordDocument to a record object suitable for CSV export.
 * @param {BCDRecordDocument} record - The BCDRecordDocument to map.
 * @returns {Object} - The mapped record object.
 */
const recordMapper = (record: BCDRecordDocument) => ({
  recordType: "R30", // 1
  cpc: computeValue(record.cpc?.code), // 2
  origin: computeValue(record.origin?.code.substring(0, 2)), // 3
  tariffNumber: computeValue(record.tariff), // 4
  description: computeValue(record.description), // 5
  quantity: computeValue(record.quantity), // 6
  quantityTwo: computeValue(record.quantityTwo), // 7
  supplementaryCode: computeValue(record.supplementaryCode), // 8
  currency: computeValue(record.currency), // 9
  valueInCurrency: computeValue(record.linesSubtotal), // 10
  exchangeRate: computeValue(record.exchangeRate, 6), // 11
  bdaValue: computeValue(record.bdaValue), // 12
  totalDue: computeValue(record.totalDue), // 13
});

/**
 * Maps a BCDRecordTaxDocument to a record tax object suitable for CSV export.
 * @param {BCDRecordTaxDocument} data - The BCDRecordTaxDocument to map.
 * @returns {Object} - The mapped record tax object.
 */
const recordTaxMapper = (data: BCDRecordTaxDocument) => ({
  recordType: "R50", // 1
  type: computeValue(data.type?.code), // 2
  taxId: computeValue(data.taxId?.code), // 3
  dutyValue: computeValue(data.valueForTax), // 4
  dutyRate: computeValue(data.ratePercentage), // 5
  amount: computeValue(data.amount), // 6
});

export {
  headerMapper,
  chargesMapper,
  containerMapper,
  additionalInfoMapper,
  houseBOLMapper,
  recordMapper,
  recordTaxMapper,
};
