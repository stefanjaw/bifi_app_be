import { BaseRoutes } from "../../../system";
import { PatientProgressNoteTagDocument } from "@mongodb-types";
import { ProgressNoteTagController } from "../controllers/progress-note-tag-controller";
import {
  ProgressNoteTagDTO,
  UpdateProgressNoteTagDTO,
} from "../models/progress-note-tag.dto";

const progressNoteTagController = new ProgressNoteTagController();

/** Route definitions for progress-note-tag endpoints */
export class ProgressNoteTagRouter extends BaseRoutes<PatientProgressNoteTagDocument> {
  constructor() {
    super({
      controller: progressNoteTagController,
      endpoint: "/progress-note-tags",
      dtoCreateClass: ProgressNoteTagDTO,
      dtoUpdateClass: UpdateProgressNoteTagDTO,
    });
  }
}
