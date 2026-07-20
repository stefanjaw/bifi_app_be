import { BaseRoutes, authorizeMiddleware } from "../../../../system";
import { ProgressNoteDocument } from "@mongodb-types";
import { ProgressNoteController } from "../controllers/progress-note-controller";
import {
  ProgressNoteDTO,
  UpdateProgressNoteDTO,
} from "../models/progress-note.dto";

const progressNoteController = new ProgressNoteController();

/** Route definitions for progress note endpoints */
export class ProgressNoteRouter extends BaseRoutes<ProgressNoteDocument> {
  constructor() {
    super({
      controller: progressNoteController,
      endpoint: "/progress-notes",
      dtoCreateClass: ProgressNoteDTO,
      dtoUpdateClass: UpdateProgressNoteDTO,
    });
  }

  protected override initRoutes() {
    super.initRoutes();

    this.router.put(
      "/progress-notes/:id/add-user-readby",
      authorizeMiddleware("progress-notes", "update"),
      progressNoteController.addUserReadBy,
    );

    this.router.put(
      "/progress-notes/:id/remove-user-readby",
      authorizeMiddleware("progress-notes", "update"),
      progressNoteController.removeUserReadBy,
    );
  }
}
