import { BCDTransportOptionDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdTransportOptionModel } from "../models/bcd-transport-option.model";

export class BCDTransportOptionService extends BaseService<BCDTransportOptionDocument> {
  constructor() {
    super({ model: bcdTransportOptionModel });
  }
}
