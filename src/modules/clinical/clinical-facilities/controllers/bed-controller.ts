import { BaseController } from "../../../../system";
import { BedDocument } from "@mongodb-types";
import { BedService } from "../services/bed-service";

const bedService = new BedService();

export class BedController extends BaseController<BedDocument> {
  constructor() {
    super({ service: bedService });
  }
}
