import { BaseRoutes, authorizeMiddleware } from "../../../system";
import { JournalEntryDocument } from "../models/journal-entry.model";
import { JournalEntryController } from "../controllers/journal-entry-controller";
import { JournalEntryDTO, UpdateJournalEntryDTO } from "../models/journal-entry.dto";

const journalEntryController = new JournalEntryController();

export class JournalEntryRouter extends BaseRoutes<JournalEntryDocument> {
  constructor() {
    super({
      controller: journalEntryController,
      endpoint: "/accounting/journal-entries",
      dtoCreateClass: JournalEntryDTO,
      dtoUpdateClass: UpdateJournalEntryDTO,
    });
  }

  protected override initRoutes() {
    super.initRoutes();
    this.router.put(
      `/accounting/journal-entries/:id/post`,
      authorizeMiddleware("accounting/journal-entries", "update"),
      (req, res, next) => journalEntryController.postEntry(req, res, next)
    );
  }
}
