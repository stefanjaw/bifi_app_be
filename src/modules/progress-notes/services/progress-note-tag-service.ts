import { BaseService } from "../../../system";
import { progressNoteTagModel } from "../models/progress-note-tag.model";
import { PatientProgressNoteTagDocument } from "@mongodb-types";

/** Business logic service for progress-note-tag operations */
export class ProgressNoteTagService extends BaseService<PatientProgressNoteTagDocument> {
  constructor() {
    super({
      model: progressNoteTagModel,
      refFields: [],
    });
  }
}
