import { BaseController } from "../../../../system";
import { ProgressNoteDocument } from "@mongodb-types";
import { ProgressNoteService } from "../services/progress-note-service";

const progressNoteService = new ProgressNoteService();

/** Express controller for progress note CRUD operations */
export class ProgressNoteController extends BaseController<ProgressNoteDocument> {
  constructor() {
    super({ service: progressNoteService });
  }
}
