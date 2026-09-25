/**
 * Returns `next` only if it is a same-site path, else null. Rejects
 * "//host" and "/\host", which browsers treat as another site.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/")) return null;
  if (next.startsWith("//") || next.includes("\\")) return null;
  return next;
}
