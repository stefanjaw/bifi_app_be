import { BaseService } from "../../../../system";
import { noteModel } from "../models/note.model";
import { NoteDocument } from "@mongodb-types";

/** Business logic service for note operations */
export class NoteService extends BaseService<NoteDocument> {
  constructor() {
    super({
      model: noteModel,
      refFields: [],
    });
  }
}
