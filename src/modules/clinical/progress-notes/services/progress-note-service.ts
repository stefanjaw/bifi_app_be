import { BaseService, NotFoundException } from "../../../../system";
import { progressNoteModel } from "../models/progress-note.model";
import { ProgressNoteDocument, ProgressNoteReadByDocument } from "@mongodb-types";
import { ClientSession } from "mongoose";

/** Business logic service for progress note operations */
export class ProgressNoteService extends BaseService<ProgressNoteDocument> {
  constructor() {
    super({
      model: progressNoteModel,
      refFields: [],
    });
  }

  /**
   * Adds a user to the read-by list of a progress note.
   * @param progressNoteId - The progress note ID
   * @param userId - The user ID to add
   * @param session - Optional Mongoose client session
   */
  async addUserReadBy(
    progressNoteId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<ProgressNoteDocument> {
    const note = await progressNoteModel
      .findById(progressNoteId)
      .session(session || null);
    if (!note) throw new NotFoundException("Progress note not found");

    const exists = note.readBy?.some(
      (r: ProgressNoteReadByDocument) => r.userId?.toString() === userId,
    );
    if (!exists) {
      note.readBy.push({
        userId,
        readAt: new Date(),
      });
      await note.save({ session: session || undefined });
    }

    return note;
  }

  /**
   * Removes a user from the read-by list of a progress note.
   * @param progressNoteId - The progress note ID
   * @param userId - The user ID to remove
   * @param session - Optional Mongoose client session
   */
  async removeUserReadBy(
    progressNoteId: string,
    userId: string,
    session?: ClientSession,
  ): Promise<ProgressNoteDocument> {
    const note = await progressNoteModel
      .findById(progressNoteId)
      .session(session || null);
    if (!note) throw new NotFoundException("Progress note not found");

    await progressNoteModel.updateOne(
      { _id: progressNoteId },
      { $pull: { readBy: { userId } } },
      { session: session || undefined },
    );

    return note;
  }
}
