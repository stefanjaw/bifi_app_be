import { BCDTypeDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdTypeModel } from "../models/bcd-type.model";

export class BCDTypeService extends BaseService<BCDTypeDocument> {
  constructor() {
    super({ model: bcdTypeModel });
  }
}
