import { BaseController } from "../../../system";
import { JournalDocument } from "../models/journal.model";
import { JournalService } from "../services/journal-service";

const journalService = new JournalService();

export class JournalController extends BaseController<JournalDocument> {
  constructor() {
    super({ service: journalService });
  }
}
