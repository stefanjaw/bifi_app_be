import mongoose, { ClientSession } from "mongoose";

/**
 * Runs a callback function within a transaction.
 * If a session is provided, it uses that session for the transaction.
 * If no session is provided, it creates a new one.
 * The callback function is called with the session as an argument.
 * If the callback function throws an error, the transaction is aborted.
 * If the callback function resolves successfully, the transaction is committed.
 * The function returns the result of the callback function.
 * @param session The optional client session to use for the transaction.
 * @param callback The callback function to run within the transaction.
 * @returns The result of the callback function.
 */
export const runTransaction = async <T>(
  session: ClientSession | undefined,
  callback: (newSession: ClientSession) => Promise<T>
): Promise<T> => {
  const newSession = session ? session : await mongoose.startSession();

  try {
    if (!session) newSession.startTransaction();

    // run the callback function
    const result = await callback(newSession);

    if (!session) await newSession.commitTransaction();
    return result as T;
  } catch (error) {
    if (!session) await newSession.abortTransaction();
    throw error;
  } finally {
    if (!session) await newSession.endSession();
  }
};
