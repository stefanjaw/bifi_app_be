/** Safely extracts a human-readable error message from any thrown value. @param err - The caught error (any type). @returns A string representation of the error. */
export function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
