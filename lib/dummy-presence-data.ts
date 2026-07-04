import type { PresencePayload } from '@/lib/hooks/usePresence'

// ─── Dummy data for load-testing the online activity page ───────────────────────
// Generated once, not live — purely for previewing how the UI looks with
// hundreds of users across multiple sessions. Delete this file (and its
// import in page.tsx) once you're done testing.

const DUMMY_SESSIONS = [
  { id: 'dummy-sess-1', name: 'Latihan Pernapasan', slug: 'latihan-pernapasan' },
  { id: 'dummy-sess-2', name: 'Mindfulness Dasar', slug: 'mindfulness-dasar' },
  { id: 'dummy-sess-3', name: 'Relaksasi Otot Progresif', slug: 'relaksasi-otot-progresif' },
  { id: 'dummy-sess-4', name: 'Journaling Emosi', slug: 'journaling-emosi' },
  { id: 'dummy-sess-5', name: 'Body Scan Meditation', slug: 'body-scan-meditation' },
]

const FIRST_NAMES = [
  'Budi', 'Siti', 'Andi', 'Dewi', 'Rizki', 'Wati', 'Agus', 'Lina', 'Eko', 'Maya',
  'Joko', 'Fitri', 'Bambang', 'Nina', 'Hadi', 'Sari', 'Doni', 'Ayu', 'Yusuf', 'Tia',
]
const LAST_NAMES = [
  'Santoso', 'Rahayu', 'Wijaya', 'Lestari', 'Pratama', 'Hidayat', 'Saputra',
  'Wulandari', 'Setiawan', 'Kusuma',
]

function buildDummyUsers(count: number, perSession: number, activeRatio: number): PresencePayload[] {
  const users: PresencePayload[] = []

  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length]
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length]
    const name = `${first} ${last}`
    const email = `${name.toLowerCase().replace(/\s+/g, '.')}${i}@dummy.dmai`

    const isActive = (i % 100) / 100 < activeRatio
    const session = isActive ? null : DUMMY_SESSIONS[Math.floor(i / perSession) % DUMMY_SESSIONS.length]

    users.push({
      user_id: `dummy-${i}`,
      email,
      status: isActive ? 'active' : 'in_session',
      session_id: session?.id,
      session_name: session?.name,
      session_slug: session?.slug,
      joined_at: new Date(Date.now() - i * 1000).toISOString(),
    })
  }

  return users
}

// 400 dummy users, ~60 per session, 15% just browsing (not in a session)
export const DUMMY_PRESENCE_USERS: PresencePayload[] = buildDummyUsers(400, 60, 0.15)