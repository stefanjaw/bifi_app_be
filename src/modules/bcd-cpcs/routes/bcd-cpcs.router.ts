import { BCDCpcsDocument } from "@mongodb-types";
import { BaseRoutes } from "../../../system";
import { BCDCpcsController } from "../controllers/bcd-cpcs-controller";
import { BCDCpcsDTO, UpdateBCDCpcsTO } from "../models/bcd-cpcs.dto";

export class BCDCpcsRouter extends BaseRoutes<BCDCpcsDocument> {
constructor() {

    super({
        controller: new BCDCpcsController(),
        endpoint: "/bcd-cpcs",
        dtoCreateClass: BCDCpcsDTO,
        dtoUpdateClass: UpdateBCDCpcsTO
    });
}
}