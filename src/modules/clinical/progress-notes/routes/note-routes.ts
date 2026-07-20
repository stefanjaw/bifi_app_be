import { BaseRoutes } from "../../../../system";
import { NoteDocument } from "@mongodb-types";
import { NoteController } from "../controllers/note-controller";
import { NoteDTO, UpdateNoteDTO } from "../models/note.dto";

const noteController = new NoteController();

/** Route definitions for note endpoints */
export class NoteRouter extends BaseRoutes<NoteDocument> {
  constructor() {
    super({
      controller: noteController,
      endpoint: "/notes",
      dtoCreateClass: NoteDTO,
      dtoUpdateClass: UpdateNoteDTO,
    });
  }
}
