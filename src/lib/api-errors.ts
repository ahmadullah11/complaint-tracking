// Helpers for turning server-side failures into safe, actionable API messages.

/**
 * Removes credentials from connection strings and secret-looking values before
 * an error message is returned to the browser or written to logs.
 */
export function redactSecrets(message: string): string {
  return message
    .replace(/(mongodb(?:\+srv)?:\/\/)[^@\s]+@/gi, "$1<credentials>@")
    .replace(/((?:MONGODB_URI|DATABASE_URL|JWT_SECRET)\s*[=:]\s*)\S+/gi, "$1<redacted>");
}

/**
 * Builds the error text returned to the client. The original driver message is
 * preserved so the red alert on /complaint shows what actually failed, with
 * extra hints for the two most common Vercel/Atlas problems.
 */
export function getPublicErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown server error.";

  const message = redactSecrets(raw).trim() || "Unknown server error.";
  const lower = message.toLowerCase();

  const connectionFailure =
    lower.includes("server selection") ||
    lower.includes("could not connect to any servers") ||
    lower.includes("econnrefused") ||
    lower.includes("etimedout") ||
    lower.includes("eai_again") ||
    lower.includes("enotfound") ||
    lower.includes("querysrv") ||
    lower.includes("buffering timed out");

  if (connectionFailure) {
    return (
      `Database connection failed: ${message} ` +
      "Check that MONGODB_URI is correct and that MongoDB Atlas allows Vercel connections " +
      "(Network Access → IP Access List → 0.0.0.0/0)."
    );
  }

  if (lower.includes("authentication failed") || lower.includes("bad auth") || lower.includes("auth failed")) {
    return (
      `Database authentication failed: ${message} ` +
      "Check the database username and password in MONGODB_URI."
    );
  }

  return message;
}
