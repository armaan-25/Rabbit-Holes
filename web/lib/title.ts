export function cleanRabbitHoleTitle(title?: string | null, fallback = "Current Investigation"): string {
  const cleaned = String(title || "")
    .replace(/[\\]+/g, "")
    .replace(/[\/|]+$/g, "")
    .replace(/^["'`]+|["'`.]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 64);

  return cleaned || fallback;
}

export function isGenericRabbitHoleTitle(title?: string | null): boolean {
  const clean = cleanRabbitHoleTitle(title, "").toLowerCase();
  return /^(untitled|rabbit research|current investigation|investigation \d+|research tool)$/.test(clean);
}
