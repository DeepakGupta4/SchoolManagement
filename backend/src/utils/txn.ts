import mongoose from "mongoose";

/**
 * Runs `fn` inside a MongoDB transaction and returns its result. The whole body
 * commits together or not at all, so a multi-collection cascade (rename a class →
 * update students + teachers + timetable + …) can never half-apply if the process
 * dies mid-way. Atlas is a replica set, so transactions are available.
 *
 * IMPORTANT: a single session processes ONE operation at a time — inside `fn`,
 * `await` every DB call sequentially (never `Promise.all` them on this session),
 * and pass the `session` to every read and write so they join the transaction.
 * `withTransaction` auto-retries on a transient write conflict; because an abort
 * rolls everything back, `fn` simply re-runs from a clean state, so keep it free
 * of side effects other than the DB writes it performs.
 */
export async function withTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result as T;
  } finally {
    await session.endSession();
  }
}
