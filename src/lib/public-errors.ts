export function safePublicError(
  fallback: string,
  error: unknown,
  context?: string,
): string {
  if (import.meta.env.DEV) {
    const value = error instanceof Error ? error.message : String(error);
    // Internal-only logging for development troubleshooting.
    console.warn(context ?? "[public-ui]", value);
  }
  return fallback;
}

