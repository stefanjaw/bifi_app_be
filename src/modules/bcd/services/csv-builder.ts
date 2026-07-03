import { BCDDocument } from "@mongodb-types";
import * as mapper from "../models/bcd-mapper";

export class CsvBuilderService {
  /**
   * Create a CSV string based on the given BCD document.
   * @param {BCDDocument} data - The BCD document to create the CSV string from.
   * @returns {string} - The created CSV string.
   */
  create(data: BCDDocument) {
    const lines: string[] = [];

    // Header
    lines.push(Object.values(mapper.headerMapper(data)).join(","));

    // Header Charges
    data.charges.forEach((charge) => {
      lines.push(
        Object.values(mapper.chargesMapper(charge, "header")).join(","),
      );
    });

    // Containers
    data.containerIds.forEach((container) => {
      lines.push(Object.values(mapper.containerMapper(container)).join(","));
    });

    // Header Additional Info
    (data.additionalInformation || []).forEach((info) => {
      lines.push(
        Object.values(mapper.additionalInfoMapper(info, "header")).join(","),
      );
    });

    // House BOL
    (data.houseBOLAWBs || []).forEach((houseBOL) => {
      lines.push(Object.values(mapper.houseBOLMapper(houseBOL)).join(","));
    });

    // Records
    data.records.forEach((record) => {
      lines.push(Object.values(mapper.recordMapper(record)).join(","));

      record.charges.forEach((charge) => {
        lines.push(
          Object.values(mapper.chargesMapper(charge, "record")).join(","),
        );
      });

      (record.tax || []).forEach((tax) => {
        lines.push(Object.values(mapper.recordTaxMapper(tax)).join(","));
      });

      (record.additionalInformation || []).forEach((info) => {
        lines.push(
          Object.values(mapper.additionalInfoMapper(info, "record")).join(","),
        );
      });
    });

    // Trailer
    lines.push(`R70,${lines.length + 1}`);

    return lines.join("\r\n");
  }
}
