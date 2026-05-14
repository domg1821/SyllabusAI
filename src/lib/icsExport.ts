import { SavedClass } from "./types";

function parseDueDate(raw: string): Date | null {
  if (!raw || /^tbd$/i.test(raw.trim())) return null;
  const direct = new Date(raw);
  if (!isNaN(direct.getTime())) return direct;
  const year = new Date().getFullYear();
  for (const y of [year, year + 1]) {
    const a = new Date(`${raw} ${y}`);
    if (!isNaN(a.getTime())) return a;
    const b = new Date(`${raw}, ${y}`);
    if (!isNaN(b.getTime())) return b;
  }
  return null;
}

function toIcsDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function nextDay(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

function escapeIcs(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  // RFC 5545: lines longer than 75 octets must be folded with CRLF + SPACE
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const chunks: string[] = [];
  let pos = 0;
  let first = true;
  while (pos < line.length) {
    const limit = first ? 75 : 74; // first line has no leading space
    first = false;
    chunks.push(line.slice(pos, pos + limit));
    pos += limit;
  }
  return chunks.join("\r\n ");
}

export function exportToIcs(classes: SavedClass[]): string {
  const now = new Date();
  const stamp =
    now.getUTCFullYear() +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0") +
    "T" +
    String(now.getUTCHours()).padStart(2, "0") +
    String(now.getUTCMinutes()).padStart(2, "0") +
    String(now.getUTCSeconds()).padStart(2, "0") +
    "Z";

  const events: string[] = [];

  for (const cls of classes) {
    for (const item of cls.items) {
      const date = parseDueDate(item.dueDate);
      if (!date) continue;

      const uid = `${cls.id}-${item.id}@syllabusai`;
      const summary = escapeIcs(`${cls.code ? `${cls.code} — ` : ""}${item.title}`);
      const description = escapeIcs(
        [
          cls.name,
          item.type.charAt(0).toUpperCase() + item.type.slice(1),
          item.points ? `${item.points} pts` : "",
          `Due: ${item.dueDate}`,
        ]
          .filter(Boolean)
          .join(" · ")
      );

      events.push(
        [
          "BEGIN:VEVENT",
          foldLine(`UID:${uid}`),
          `DTSTAMP:${stamp}`,
          `DTSTART;VALUE=DATE:${toIcsDate(date)}`,
          `DTEND;VALUE=DATE:${toIcsDate(nextDay(date))}`,
          foldLine(`SUMMARY:${summary}`),
          foldLine(`DESCRIPTION:${description}`),
          "END:VEVENT",
        ].join("\r\n")
      );
    }
  }

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SyllabusAI//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SyllabusAI Deadlines",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}
