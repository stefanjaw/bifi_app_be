import { BaseService } from "../../../../system";
import { progressNoteModel } from "../models/progress-note.model";
import { ProgressNoteDocument } from "@mongodb-types";

/** Business logic service for progress note operations */
export class ProgressNoteService extends BaseService<ProgressNoteDocument> {
  constructor() {
    super({
      model: progressNoteModel,
      refFields: [],
    });
  }
}
