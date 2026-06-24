export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}d`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m < 60) return `${m}m ${s}d`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return `${h}j ${rem}m`
}