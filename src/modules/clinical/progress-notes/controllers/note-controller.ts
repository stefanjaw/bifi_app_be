import { BaseController } from "../../../../system";
import { NoteDocument } from "@mongodb-types";
import { NoteService } from "../services/note-service";

const noteService = new NoteService();

/** Express controller for note CRUD operations */
export class NoteController extends BaseController<NoteDocument> {
  constructor() {
    super({ service: noteService });
  }
}
