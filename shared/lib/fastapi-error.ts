export function parseFastApiError(text: string): string {
  try {
    const j = JSON.parse(text) as { detail?: unknown };
    if (j.detail == null) return text;
    if (Array.isArray(j.detail)) {
      return j.detail
        .map(
          (d: { loc?: unknown[]; msg?: string }) =>
            `${(d.loc ?? []).join(".")}: ${d.msg ?? ""}`,
        )
        .join("; ");
    }
    return String(j.detail);
  } catch {
    return text;
  }
}
