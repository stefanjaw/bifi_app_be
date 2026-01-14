import { BCDDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdModel } from "../models/bcd.model";

export class BCDService extends BaseService<BCDDocument> {
  constructor() {
    super({
      model: bcdModel,
    });
  }
}
