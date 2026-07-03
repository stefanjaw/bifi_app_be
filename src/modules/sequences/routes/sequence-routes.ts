import { authorizeMiddleware } from "../../../system/middlewares";
import { BaseRoutes } from "../../../system";
import { SequenceController } from "../controllers/sequence-controller";
import { SequenceDTO, UpdateSequenceDTO } from "../models/sequence.dto";
import { SequenceDocument } from "../models/sequence.model";

const sequenceController = new SequenceController();

export class SequenceRouter extends BaseRoutes<SequenceDocument> {
  constructor() {
    super({
      controller: sequenceController,
      endpoint: "/sequences",
      dtoCreateClass: SequenceDTO,
      dtoUpdateClass: UpdateSequenceDTO,
    });
  }

  protected override initRoutes(): void {
    this.router.post(
      `${this.endpoint}/next`,
      this.upload.any(),
      authorizeMiddleware(`${this.resource}/next`, "read"),
      sequenceController.getNextNumber,
    );

    super.initRoutes();
  }
}
