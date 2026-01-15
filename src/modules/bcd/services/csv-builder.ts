import { BCDDocument } from "@mongodb-types";
import * as mapper from "../models/bcd-mapper";

export class CsvBuilderService {
  /**
   * Create a CSV string based on the given BCD document.
   * @param {BCDDocument} data - The BCD document to create the CSV string from.
   * @returns {string} - The created CSV string.
   */
  create(data: BCDDocument) {
    // header
    const header = Object.values(mapper.headerMapper(data)).join(",");

    // header charges
    const headerCharges = data.charges.map((charge) =>
      Object.values(mapper.chargesMapper(charge, "header")).join(",")
    );

    // containers
    const containers = data.containerIds.map((container) =>
      Object.values(mapper.containerMapper(container)).join(",")
    );

    // header additional information
    const headerAdditionalInformation = data.additionalInformation.map((info) =>
      Object.values(mapper.additionalInfoMapper(info, "header")).join(",")
    );

    // house bols
    const houseBOLs = (data.houseBOLAWBs || []).map((houseBOL) =>
      Object.values(mapper.houseBOLMapper(houseBOL)).join(",")
    );

    // records
    const records = data.records.map((record) => {
      // record
      const header = Object.values(mapper.recordMapper(record)).join(",");

      // record charges
      const recordCharges = record.charges.map((charge) =>
        Object.values(mapper.chargesMapper(charge, "record")).join(",")
      );

      // record duty tax
      const recordDutyTaxes = record.tax.map((tax) =>
        Object.values(mapper.recordTaxMapper(tax)).join(",")
      );

      // record additional information
      const recordAdditionalInformation = record.additionalInformation.map(
        (info) =>
          Object.values(mapper.additionalInfoMapper(info, "record")).join(",")
      );

      return [
        header,
        ...recordCharges,
        ...recordDutyTaxes,
        ...recordAdditionalInformation,
      ].join("\n");
    });

    // result
    const result = [
      header,
      ...headerCharges,
      ...containers,
      ...headerAdditionalInformation,
      ...houseBOLs,
      ...records,
    ].join("\n");

    return `${result}\nR70,${(result.split(/\n/g)?.length || 0) + 1}`;
  }
}
