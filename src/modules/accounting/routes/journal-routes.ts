import { BaseRoutes } from "../../../system";
import { JournalDocument } from "../models/journal.model";
import { JournalController } from "../controllers/journal-controller";
import { JournalDTO, UpdateJournalDTO } from "../models/journal.dto";

const journalController = new JournalController();

export class JournalRouter extends BaseRoutes<JournalDocument> {
  constructor() {
    super({
      controller: journalController,
      endpoint: "/accounting/journals",
      dtoCreateClass: JournalDTO,
      dtoUpdateClass: UpdateJournalDTO,
    });
  }
}
