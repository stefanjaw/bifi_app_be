import { BCDCpcsDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdCpcsModel } from "../models/bcd-cpcs.model";

export class BCDCpcsService extends BaseService<BCDCpcsDocument> {

  constructor() {
    super({
      model: bcdCpcsModel,
    });
  }
}