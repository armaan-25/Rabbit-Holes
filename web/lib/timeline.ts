import type { TimelineEvent } from "./types";

function normalizeTitle(title: string): string {
  return title.toLowerCase().trim().replace(/[“”]/g, '"').replace(/\s+/g, " ");
}

function minuteBucket(at: string): string {
  const time = new Date(at);
  if (Number.isNaN(+time)) return at;
  time.setSeconds(0, 0);
  return time.toISOString();
}

export function cleanTimelineEvents(events: TimelineEvent[]): TimelineEvent[] {
  const seen = new Set<string>();
  const sorted = [...events].sort((a, b) => +new Date(a.at) - +new Date(b.at));
  const cleaned: TimelineEvent[] = [];
  for (const event of sorted) {
    const key = `${event.kind}:${normalizeTitle(event.title)}:${(event.detail ?? "").toLowerCase().trim()}:${minuteBucket(event.at)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(event);
  }
  return cleaned;
}
