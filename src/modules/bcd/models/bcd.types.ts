export enum BCDTypeEnum {
  IMPORT = "I",
  EXPORT = "E",
  D = "D",
  A = "A",
}

export enum AdditionalInformationTypeEnum {
  TEXT = "TXT",
  INVOICE = "INV",
  SUPPLIER = "SUP",
}

export enum ValuationMethodTypeEnum {
  TRANSACTIONAL_VALUE = "01",
  OTHER = "02",
}

export enum TransportMethodTypeEnum {
  AIRLINE = "AIRLINE",
  VESSEL = "VESSEL",
}

export enum TaxTypeEnum {
  CUSTOMS = "CUD",
  WHARFAGE = "WHA",
  WAREHOUSE = "WSF",
}

export enum TaxIdTypeEnum {
  FULL_RATE = "F",
  EXCHANGE_RATE = "E",
}

export enum ChargeCodeTypeEnum {
  CASH_DISCOUNT = "212",
  FREIGHT_ADDITIONAL = "641",
  FRIEGHT_STAT = "640",
}

export enum EBCDTypeEnum {
  SENT_CSV = "SENT_CSV", // * Sent CSV from US to GOVERNMENT
  FILE_ERROR_CSV = "FILE_ERROR_CSV", // * ...E.0001
  FORMAT_ERROR_PDF = "FORMAT_ERROR_PDF", // * SQR.PDF
  FORMAT_ERROR_TXT = "FORMAT_ERROR_TXT", // * SQR.TXT
  RELEASE_CSV = "RELEASE_CSV", // * REL.CSV
  RELEASE_PDF = "RELEASE_PDF", // * REL.PDF
  RELEASE_TXT = "RELEASE_TXT", // * REL.TXT
  RECEIPT_TXT = "RECEIPT_TXT", // * REC.TXT
}

export enum BCDStatusTypeEnum {
  DRAFT = "DRAFT",
  PENDING_RESPONSE = "PENDING_RESPONSE",
  FAILED = "FAILED",
  PENDING_QUERY = "PENDING_QUERY",
  SUBMITTED = "SUBMITTED",
}
