import { BCDDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdModel } from "../models/bcd.model";
import { BCDService } from "./bcd-service";

export class CsvBuilderService {
  create(data: BCDDocument) {
    return data;
  }

  private createHeader(data: BCDDocument) {
    
  }
}
