import { BCDPortDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdPortModel } from "../models/bcd-port.model";

export class BCDPortService extends BaseService<BCDPortDocument> {
  constructor() {
    super({
      model: bcdPortModel,
    });
  }
}
