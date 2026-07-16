import { BaseController } from "../../../system";
import { PatientProgressNoteTagDocument } from "@mongodb-types";
import { ProgressNoteTagService } from "../services/progress-note-tag-service";

const progressNoteTagService = new ProgressNoteTagService();

/** Express controller for progress-note-tag CRUD operations */
export class ProgressNoteTagController extends BaseController<PatientProgressNoteTagDocument> {
  constructor() {
    super({ service: progressNoteTagService });
  }
}
