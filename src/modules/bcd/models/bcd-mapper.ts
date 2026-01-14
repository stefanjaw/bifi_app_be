import { BCDDocument } from "@mongodb-types";
import dayjs from "dayjs";

export const headerMapper = (data: BCDDocument) => ({
  recordType: "R10", // 1
  supplierId: "", // 2
  supplierName: data.supplier?.contactId?.name || "", // 3
  supplierAddressLine1: data.supplier?.contactId?.streetAddress || "", // 4
  supplierAddressLine2: data.supplier?.contactId?.streetAddress2 || "", // 5
  supplierPostCode: data.supplier?.contactId?.zipCode || "", // 6
  supplierCountry: data.supplier?.contactId?.countryId?.name || "", // 7
  importerId: "", // 8
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
  countryDispatch: data.directShipmentCountry?.name || "", // 20
  countryOrigin: data.originalShipmentCountry?.name || "", // 21
  warehouseId: data.warehouseId || "", // 22
  OGDPaymentCode: data.ogd?.paymentCode || "", // 23
  OGDCostCode: data.ogd?.costCode || "", // 24
  OGDObjectCode: data.ogd?.objectCode || "", // 25
  OGDSubsidiaryCode: data.ogd?.subsidiaryCode || "", // 26
  OGDExplanation: data.ogd?.explanation || "", // 27
  valuationMethod: data.valuationMethod || "", // 28
  totalPackages: data.packagesCount?.toString() || "", // 29
  totalNumberOfRecords: data.records?.length.toString() || "", // 30
  totalInvoice: data.records
    .reduce(
      (acc, record) =>
        acc + (record.linesSubtotal || 0) * (record.exchangeRate || 0),
      0
    )
    .toFixed(2), // 31
  totalPayable: data.records
    .reduce((acc, record) => acc + record.tax?.amount || 0, 0)
    .toFixed(2), // 32
  declarantName: data.declarant?.name || "", // 33
});
