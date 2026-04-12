/** Base URL for browser → Next rewrite, or direct/internal backend URL. */
export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_CATEGORY_API_BASE) {
    return process.env.NEXT_PUBLIC_CATEGORY_API_BASE.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    return "/api/category-proxy";
  }
  return process.env.CATEGORY_API_INTERNAL_URL ?? "http://127.0.0.1:8000";
}
