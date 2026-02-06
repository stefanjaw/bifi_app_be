import {
  BCDAdditionalInformationDocument,
  BCDChargeDocument,
  BCDDocument,
  BCDRecordDocument,
  BCDRecordTaxDocument,
} from "@mongodb-types";
import dayjs from "dayjs";

/**
 * Maps a BCDDocument to a header object for generating a BCD file.
 *
 * @param {BCDDocument} data - The BCDDocument to be mapped.
 * @returns {Object} - A header object containing the mapped data.
 */
const headerMapper = (data: BCDDocument) => ({
  recordType: "R10", // 1
  supplierId: "", // 2
  supplierName: data.supplier?.contactId?.name || "", // 3
  supplierAddressLine1: data.supplier?.contactId?.streetAddress || "", // 4
  supplierAddressLine2: data.supplier?.contactId?.streetAddress2 || "", // 5
  supplierPostCode: data.supplier?.contactId?.zipCode || "", // 6
  supplierCountry: data.supplier?.contactId?.countryId?.name || "", // 7
  importerId: data.declarant?.companyId || "", // 8
  importerName: data.importer?.contactId?.name || "", // 9
  importerAddressLine1: data.importer?.contactId?.streetAddress || "", // 10
  importerAddressLine2: data.importer?.contactId?.streetAddress2 || "", // 11
  importerPostCode: data.importer?.contactId?.zipCode || "", // 12
  importerCountry: data.importer?.contactId?.countryId?.name || "", // 13
  vesselOrAirline: data.transport?.aircraftOrVessel || "", // 14
  voyageOrFlightNumber: data.transport?.flightOrVoyage || "", // 15
  portOfArrival: data.transport?.port || "", // 16
  dateOfArrival: data.transport?.arrivalDate
    ? dayjs(data.transport?.arrivalDate).format("YYYY-MM-DD")
    : "", // 17
  manifest: data.manifest || "", // 18
  masterBOLAWB: data.masterBOLAWB || "", // 19
  countryDispatch: data.directShipmentCountry?.code.substring(0, 2) || "", // 20
  countryOrigin: data.originalShipmentCountry?.code.substring(0, 2) || "", // 21
  warehouseId: data.warehouseId || "", // 22
  OGDPaymentCode: data.ogd?.paymentCode || "", // 23
  OGDCostCode: data.ogd?.costCode || "", // 24
  OGDObjectCode: data.ogd?.objectCode || "", // 25
  OGDSubsidiaryCode: data.ogd?.subsidiaryCode || "", // 26
  OGDExplanation: data.ogd?.explanation || "", // 27
  valuationMethod: data.valuationMethod || "", // 28
  totalPackages: data.packagesCount?.toString() || "", // 29
  totalNumberOfRecords: data.records?.length.toString() || "", // 30
  totalInvoice: data.invoiceAmount.toFixed(2), // 31
  totalPayable: data.payableAmount.toFixed(2), // 32
  declarantName: data.declarant?.name || "", // 33
  declarantCompanyId: data.declarant?.companyId || "", // 34
  declarantDate: data.declarant?.date
    ? dayjs(data.declarant?.date).format("YYYY-MM-DD")
    : "", // 35
  declarantCapacity: data.declarant?.capacity || "", // 36
  declarantTraderReference: data.declarant?.traderReference || "", // 37
  BCDType: data.type || "", // 38
});

/**
 * Maps a BCDChargeDocument to a charge object suitable for CSV export.
 * @param {BCDChargeDocument} data - The BCDChargeDocument to map.
 * @param {"header" | "record"} type - The type of the record to map.
 * @returns {Object} - The mapped charge object.
 */
const chargesMapper = (data: BCDChargeDocument, type: "header" | "record") => ({
  recordType: type === "header" ? "R20" : "R40", // 1
  chargeCode: data.code || "", // 2
  percentage: data.percentage?.toFixed(2) || "", // 3
  amount: data.amount?.toFixed(2) || "", // 4
});

/**
 * Maps a string to a container object suitable for CSV export.
 * @param {string} data - The string to map.
 * @returns {Object} - The mapped container object.
 */
const containerMapper = (data: string) => ({
  recordType: "R25", // 1
  containerId: data || "", // 2
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
  infoType: data.type?._id || "", // 2
  value: data.value || "", // 3
});

/**
 * Maps a string to a house bill of lading object suitable for CSV export.
 * @param {string} data - The string to map.
 * @returns {Object} - The mapped house bill of lading object.
 */
const houseBOLMapper = (data: string) => ({
  recordType: "R28", // 1
  houseBOLAWB: data || "", // 2
});

/**
 * Maps a BCDRecordDocument to a record object suitable for CSV export.
 * @param {BCDRecordDocument} record - The BCDRecordDocument to map.
 * @returns {Object} - The mapped record object.
 */
const recordMapper = (record: BCDRecordDocument) => ({
  recordType: "R30", // 1
  cpc: record.cpc || "", // 2
  origin: record.origin?.code.substring(0, 2) || "", // 3
  tariffNumber: record.tariff || "", // 4
  description: record.description || "", // 5
  quantity: record.quantity?.toString() || "", // 6
  quantityTwo: record.quantityTwo?.toString() || "", // 7
  supplementaryCode: record.supplementaryCode || "", // 8
  currency: record.currency || "", // 9
  valueInCurrency: record.linesSubtotal?.toFixed(2) || "", // 10
  exchangeRate: record.exchangeRate || "", // 11
  bdaValue: record.bdaValue?.toFixed(2) || "", // 12
  totalDue: record.totalDue?.toFixed(2) || "", // 13
});

/**
 * Maps a BCDRecordTaxDocument to a record tax object suitable for CSV export.
 * @param {BCDRecordTaxDocument} data - The BCDRecordTaxDocument to map.
 * @returns {Object} - The mapped record tax object.
 */
const recordTaxMapper = (data: BCDRecordTaxDocument) => ({
  recordType: "R50", // 1
  type: data.type || "", // 2
  taxId: data.taxId || "", // 3
  dutyValue: data.valueForTax?.toFixed(2) || "", // 4
  dutyRate: data.ratePercentage?.toFixed(3) || "", // 5
  amount: data.amount?.toFixed(2) || "", // 6
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
