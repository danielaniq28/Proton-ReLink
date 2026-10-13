const KNOWN = ["EMAS", "X90", "X70", "X50", "S70", "SAGA", "PERSONA", "IRIZ"] as const;

export function extractCarType(...parts: Array<string | null | undefined>): string {
  const blob = parts.filter(Boolean).join(" ").toUpperCase();
  for (const model of KNOWN) {
    if (blob.includes(model)) return model;
  }
  const named = parts.find((part) => part && part.trim());
  return named?.trim() || "PROTON";
}
