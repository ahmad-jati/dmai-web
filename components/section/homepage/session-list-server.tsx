import Image from "next/image";
import Link from "next/link";
import { fetchAllSessions } from "@/lib/data-detail-session";
import {
  ArrowUpRightIcon,
  PersonSimpleTaiChiIcon,
  TimerIcon,
  LockSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Route } from "next";
import { Button } from "@/components/ui/button";

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9HQAI8gMBfTQ1BQAAAABJRU5ErkJggg==";

interface Props {
  excludeSlug?: string;
}

type SessionData = Awaited<ReturnType<typeof fetchAllSessions>>[number];

export async function SessionListServer({ excludeSlug }: Props) {
  const sessions = await fetchAllSessions();

  const filtered = excludeSlug
    ? sessions.filter((s) => s.slug !== excludeSlug)
    : sessions;

  const hasLockedSession = filtered.some((s) => s.is_locked);

  return hasLockedSession ? (
    <SessionChainLayout sessions={filtered} />
  ) : (
    <SessionGridLayout sessions={filtered} />
  );
}

// ---------- Layout: semua unlocked → grid 3 kolom ----------
function SessionGridLayout({ sessions }: { sessions: SessionData[] }) {
  return (
    <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-3.5 w-full">
      {sessions.map((session) => (
        <Link
          key={session.slug}
          href={`/session/${session.slug}` as Route}
          scroll={false}
          className="
            group flex flex-col 2md:items-start items-end 2md:gap-3 gap-0
            bg-background dark:bg-secondary 2md:rounded-[20px] rounded-lg border border-foreground w-full overflow-hidden hover:shadow-md transition-shadow 
            p-3
          "
        >
          <div className="md:w-full md:h-40 2xs:w-34 2xs:h-30 w-24 h-20 2md:rounded-[14px] rounded-[10px] overflow-hidden">
            <Image
              src={session.image_cover}
              alt={`session ${session.session_name}`}
              width={2000}
              height={2000}
              priority
              unoptimized
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="w-full h-full object-cover bg-muted-foreground/10 group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div className="flex flex-col items-start gap-1.5 2md:px-1 w-full">
            <div className="flex items-center w-full gap-2">
              <p className="text-p/5 max-w-140 font-semibold group-hover:underline underline-offset-2 2md:text-left text-left text-foreground">
                {session.session_name}
              </p>
              <Button
                variant={"default"}
                className="[&_svg]:size-6 font-foreground bg-transparent rounded-none border-none p-0 2md:hidden block"
              >
                <ArrowUpRightIcon />
              </Button>
            </div>

            <p className="text-pretty 2md:mt-0 -mt-2 xs:text-p/5 text-sm/4 2md:max-w-140 font-medium line-clamp-3 2md:min-h-[3lh] text-muted-foreground 2md:text-left text-left">
              {session.detail_short}
            </p>

            <div className="flex-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <PersonSimpleTaiChiIcon className="h-3 w-3 text-muted-foreground" weight="fill" />
                <p className="sm:text-sm/5 text-xs/4 font-medium text-muted-foreground">
                  {session.total_instruction} Instruksi
                </p>
              </span>

              <span className="flex items-center gap-1">
                <TimerIcon className="h-3 w-3 text-muted-foreground" weight="fill" />
                <p className="sm:text-sm/5 text-xs/4 font-medium text-muted-foreground">
                  {session.duration}
                </p>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

// ---------- Layout: ada locked → chain vertikal ----------
function SessionChainLayout({ sessions }: { sessions: SessionData[] }) {
  const sorted = [...sessions].sort((a, b) => a.week_number - b.week_number);

  return (
    <div className="flex flex-col w-full">
      {sorted.map((session, idx) => {
        const isLast = idx === sorted.length - 1;

        const cardContent = (
          <>
            {/* thumbnail */}
            <div className="relative w-24 h-20 rounded-[14px] overflow-hidden shrink-0">
              <Image
                src={session.image_cover}
                alt={`session ${session.session_name}`}
                fill
                unoptimized
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className={`object-cover ${
                  session.is_locked
                    ? "grayscale opacity-60"
                    : "group-hover:scale-105 transition-transform duration-300"
                }`}
              />
              {session.is_locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/20">
                  <LockSimpleIcon className="h-5 w-5 text-foreground/60" weight="fill" />
                </div>
              )}
            </div>

            {/* text */}
            <div className="flex flex-col items-start gap-1.5 flex-1 min-w-0 py-0.5">
              <p
                className={`text-p/5 font-semibold truncate w-full ${
                  session.is_locked
                    ? "text-muted-foreground/60"
                    : "text-foreground group-hover:underline underline-offset-2"
                }`}
              >
                {session.session_name}
              </p>

              <p className="text-pretty text-sm/4 font-medium line-clamp-2 text-muted-foreground">
                {session.detail_short}
              </p>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <PersonSimpleTaiChiIcon className="h-3 w-3 text-muted-foreground" weight="fill" />
                  <p className="text-xs/4 font-medium text-muted-foreground">
                    {session.total_instruction} Instruksi
                  </p>
                </span>
                <span className="flex items-center gap-1">
                  <TimerIcon className="h-3 w-3 text-muted-foreground" weight="fill" />
                  <p className="text-xs/4 font-medium text-muted-foreground">
                    {session.duration}
                  </p>
                </span>
              </div>
            </div>
          </>
        );

        return (
          /**
           * Struktur per item:
           *
           * [dot] [label "Minggu X"]       ← baris atas, items-center
           *  |    [card]                   ← baris bawah, garis di kiri
           *  |
           *  (gap ke item berikutnya)
           */
          <div key={session.slug} className="flex gap-3 w-full">

            {/* ── kolom kiri: dot + garis vertikal ── */}
            <div className="flex flex-col items-center" style={{ width: 16, flexShrink: 0 }}>
              {/* dot */}
              <div
                className={`
                  w-4 h-4 rounded-full shrink-0 mt-[3px]
                  ${session.is_locked
                    ? "border-2 border-foreground/25 bg-background"
                    : "bg-foreground"
                  }
                `}
              />
              {/* garis dari bawah dot sampai ke bawah card — termasuk gap ke item berikutnya */}
              {!isLast && (
                <div className="w-px bg-foreground/15 flex-1 mt-1.5" />
              )}
            </div>

            {/* ── kolom kanan: label + card + spacer ── */}
            <div className={`flex flex-col flex-1 min-w-0 ${!isLast ? "pb-6" : ""}`}>
              {/* label minggu sejajar dengan dot */}
              <p className="text-sm/5 font-semibold text-foreground mb-2">
                Minggu {session.week_number}
              </p>

              {/* card */}
              {session.is_locked ? (
                <div
                  className="
                    group flex items-start gap-3 w-full rounded-[20px]
                    border border-foreground/10
                    bg-muted/40 dark:bg-secondary/30
                    opacity-60 cursor-not-allowed
                    p-3
                  "
                >
                  {cardContent}
                </div>
              ) : (
                <Link
                  href={`/session/${session.slug}` as Route}
                  scroll={false}
                  className="
                    group flex items-start gap-3 w-full rounded-[20px]
                    border border-foreground
                    bg-background dark:bg-secondary
                    hover:shadow-md transition-shadow
                    p-3
                  "
                >
                  {cardContent}
                </Link>
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
}