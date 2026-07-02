import Image from "next/image";
import Link from "next/link";
import { fetchAllSessions } from "@/lib/data-detail-session";
import {
  ArrowUpRightIcon,
  PersonSimpleTaiChiIcon,
  TimerIcon,
  LockSimpleIcon,
  LightbulbIcon
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

  return <SessionGridLayout sessions={filtered} />
}

// ---------- Layout: semua unlocked → grid 3 kolom ----------
function SessionGridLayout({ sessions }: { sessions: SessionData[] }) {
  return (
    <div className="grid 2md:grid-cols-2 grid-cols-1 2xs:gap-3.5 gap-2 w-full">
      {sessions.map((session) => (
        <Link
          key={session.slug}
          href={session.is_locked ? "#" : (`/session/${session.slug}` as Route)}
          scroll={false}
          className={`
            group flex 2xs:flex-row flex-col items-start 2xs:gap-6 gap-3
            2md:rounded-[20px] rounded-lg w-full overflow-hidden transition-shadow p-3
            2xs:bg-transparent bg-background
            ${session.is_locked 
              ? "cursor-not-allowed opacity-70" 
              : "hover:bg-background hover:dark:bg-secondary hover:shadow-md"
            }
          `}
        >
          <div className="h-full">
            <h3 className="font-bold text-5xl text-muted-foreground/30 uppercase">0{session.week_number}</h3>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <div className="flex flex-col gap-1">
              <p className={`xs:text-lg/4.5 text-sm/3.5 font-semibold w-full text-left underline-offset-3 ${!session.is_locked && "group-hover:underline"}`}>
                {session.session_name}
              </p>
              <p className="text-pretty xs:text-p/5 text-sm/4 2md:max-w-140 font-medium line-clamp-3 text-muted-foreground text-left">
                {session.detail_short}
              </p>
            </div>
            
            <div className="relative w-full lg:h-60 3md:h-40 sm:h-60 xs:h-44 h-34 rounded-sm overflow-hidden">
              <Image
                src={session.image_cover}
                alt={`session ${session.session_name}`}
                fill
                unoptimized
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className={`w-full h-full object-cover bg-muted-foreground/10 transition-transform duration-300 ${!session.is_locked && " rounded-sm"}`}
              />

              {session.is_locked && (
                <div className="absolute inset-0 flex 2xs:flex-row flex-col  items-center gap-3 justify-center bg-background/40 dark:bg-black/40 backdrop-blur-sm z-10 animate-fade-in rounded-sm">
                  <div className="bg-background dark:bg-secondary p-3 rounded-full shadow-lg border border-border/40">
                    <LockSimpleIcon className="h-6 w-6 text-foreground" weight="fill" />
                  </div>
                  <div>
                    <p className="2xs:text-p/5 text-xs/4">Sesi berikutnya segera hadir</p>
                  </div>
                </div>
              )}

              <div className="absolute bottom-4 right-4 rounded-sm p-2 flex flex-col xs:gap-1 gap-0 transition items-end 
              md:bg-muted-foreground/40 bg-background md:text-background text-muted-foreground group-hover:bg-background/86  group-hover:text-muted-foreground group-hover:dark:text-foreground              
              ">
                <span className="flex items-center gap-1">
                  <p className="md:text-sm/5 xs:text-xs/4 text-2xs font-medium">
                    {session.total_instruction} Instruksi
                  </p>
                  <LightbulbIcon className="h-3 w-3" weight="fill" />
                </span>

                <span className="flex items-center gap-1">
                  <p className="md:text-sm/5 xs:text-xs/4 text-2xs font-medium">
                    {session.duration}
                  </p>
                  <TimerIcon className="h-3 w-3" weight="fill" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}