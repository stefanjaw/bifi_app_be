import { BCDAdditionalInformationTypeDocument } from "@mongodb-types";
import { BaseService } from "../../../system";
import { bcdAdditionalInformationTypeModel } from "../models/bcd-additional-information-type.model";

export class BCDAdditionalInformationTypeService extends BaseService<BCDAdditionalInformationTypeDocument> {
  constructor() {
    super({ model: bcdAdditionalInformationTypeModel });
  }
}
