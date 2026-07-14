import { BCDCpcDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdCpcModel } from "../models/bcd-cpcs.model";

export class BCDCpcService extends BaseService<BCDCpcDocument> {
  constructor() {
    super({
      model: bcdCpcModel,
    });
  }
}
