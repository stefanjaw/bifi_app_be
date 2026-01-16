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
  CSV_SENT = "CSV_SENT", // * CSV file sent
  CSV_ERR = "CSV_ERR", // * Sent incorrectly
  SQR_PDF = "SQR_PDF", // * Sent incorrectly
  CSV_REL = "CSV_REL", // * Sent correctly
  TXT_RECEIPT = "TXT_RECEIPT", // * Electronic receipt
}

export enum BCDStatusTypeEnum {
  DRAFT = "DRAFT",
  PENDING_RESPONSE = "PENDING_RESPONSE",
  FAILED = "FAILED",
  PENDING_QUERY = "PENDING_QUERY",
  SUBMITTED = "SUBMITTED",
}
