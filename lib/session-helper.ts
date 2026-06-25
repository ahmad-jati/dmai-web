// ─── Timezone helper ────────────────────────────────────────────────────────
// Indonesia has 3 timezones: WIB (UTC+7), WITA (UTC+8), WIT (UTC+9)
// We detect from the browser's local offset and label accordingly.

function getWibOffset(): number { return 7 * 60 }
function getWitaOffset(): number { return 8 * 60 }
function getWitOffset(): number { return 9 * 60 }

function tzLabel(offsetMinutes: number): string {
  if (offsetMinutes === getWitOffset()) return "WIT"
  if (offsetMinutes === getWitaOffset()) return "WITA"
  return "WIB"
}

// Format ISO datetime to local time with WIB/WITA/WIT label
// Output: "23 Jun 2026, 20:14 WIB"
export function fmtLocalTime(iso: string | null): string {
  if (!iso) return "—"
  const date = new Date(iso)
  const offsetMinutes = -date.getTimezoneOffset()
  const label = tzLabel(offsetMinutes)
  const formatted = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
  return `${formatted} ${label}`
}

// Format ISO date only (no time)
// Output: "23 Jun 2026"
export function fmtDate(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

// ─── Duration helper ─────────────────────────────────────────────────────────
// Output: "mm:ss" e.g. "04:32"

export function fmtDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt || !completedAt) return "—";

  const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();
  console.log(startedAt, completedAt)
  console.log(diffMs)
  
  if (diffMs <= 0) return "00:00"; 

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(seconds).padStart(2, "0");
  console.log(totalSeconds)
  console.log(formattedMinutes)

  return `${formattedMinutes}:${formattedSeconds}`;
}

// ─── Group by day helper ─────────────────────────────────────────────────────
// Groups an array of items by local date string (e.g. "23 Jun 2026")

export function groupByDay<T>(
  items: T[],
  dateKey: keyof T
): { label: string; items: T[] }[] {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const raw = item[dateKey]
    const label = fmtDate(typeof raw === "string" ? raw : null)
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(item)
  }
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }))
}

// ─── Shared types ────────────────────────────────────────────────────────────

export type FormAnswer = {
  label: string
  value: string | number | null
}

export type FormStep = {
  step_number: number
  step_title: string | null
  answers: FormAnswer[]
}

export type BodyMapResponse = {
  selected_parts: string[]
  sensation: string | null
  note: string | null
}

export type CompletionRecord = {
  id: string
  user_id: string
  started_at: string | null
  completed_at: string | null
  full_name: string | null
  email: string
  form_responses: FormStep[]
  body_map_responses: BodyMapResponse[]
}

export type SessionHistoryRecord = {
  id: string
  session_id: string
  session_name: string
  week_number: number | null
  started_at: string | null
  completed_at: string | null
  form_responses: FormStep[]
  body_map_responses: BodyMapResponse[]
}

export type SessionInfo = {
  id: string
  session_name: string
  week_number: number | null
}

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  created_at: string | null
}

export type SessionSummary = {
  id: string
  session_name: string
  week_number: number | null
  total_completed: number
}

export type RecentCompletion = {
  id: string
  user_id: string
  session_id: string
  session_name: string
  started_at: string | null
  completed_at: string | null
  full_name: string | null
  email: string
}