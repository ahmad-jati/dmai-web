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

function groupSessionsByWeek(sessions: SessionData[]) {
  const groups = new Map<number, SessionData[]>();

  for (const session of sessions) {
    const week = session.week_number;
    if (!groups.has(week)) groups.set(week, []);
    groups.get(week)!.push(session);
  }

  return Array.from(groups.entries())
    .sort(([weekA], [weekB]) => weekA - weekB)
    .map(([week_number, items]) => ({
      week_number,
      items: [...items].sort((a, b) => a.week_number - b.week_number),
    }));
}

export async function SessionListServer({ excludeSlug }: Props) {
  const sessions = await fetchAllSessions();

  const filtered = excludeSlug
    ? sessions.filter((s) => s.slug !== excludeSlug)
    : sessions;

  const hasLockedSession = filtered.some((s) => s.is_locked);

  return hasLockedSession ? (
    <SessionStepperLayout sessions={filtered} />
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

// ---------- Layout: ada locked → stepper per week_number ----------
function SessionStepperLayout({ sessions }: { sessions: SessionData[] }) {
  const weeks = groupSessionsByWeek(sessions);

  return (
    <div className="flex flex-col w-full gap-8">
      {weeks.map(({ week_number, items }) => (
        <div key={week_number} className="flex flex-col gap-4 w-full">
          <h3 className="text-p/5 font-semibold text-foreground">
            Minggu {week_number}
          </h3>

          <div className="flex flex-col w-full">
            {items.map((session, idx) => {
              const isLast = idx === items.length - 1;

              const cardContent = (
                <div className="relative w-full">
                  <div className="w-full flex gap-4">
                    <div className="relative md:w-40 md:h-28 w-24 h-20 rounded-[14px] overflow-hidden shrink-0">
                    <Image
                      src={session.image_cover}
                      alt={`session ${session.session_name}`}
                      fill
                      unoptimized
                      placeholder="blur"
                      blurDataURL={BLUR_DATA_URL}
                      className={`object-cover ${
                        session.is_locked
                          ? "grayscale opacity-70"
                          : "group-hover:scale-105 transition-transform duration-300"
                      }`}
                    />
                  </div>
                  

                  <div className="flex flex-col items-start gap-1.5 flex-1 min-w-0 py-1">
                    <div className="flex items-center gap-2 w-full">
                      <p
                        className={`text-p/5 font-semibold truncate ${
                          session.is_locked
                            ? "text-muted-foreground"
                            : "text-foreground group-hover:underline underline-offset-2"
                        }`}
                      >
                        {session.session_name}
                      </p>
                    </div>

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
                  </div>

                  {session.is_locked && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <LockSimpleIcon className="h-6 w-6 text-foreground" weight="fill" />
                        <p>Sesi ini akan terbuka pada minggu ke-{session.week_number}</p>
                      </div>
                    )}
                </div>
              );

              return (
                <div key={session.slug} className="flex gap-4 w-full">
                  {/* timeline / connector */}
                  {/* <div className="flex flex-col items-center">
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 ${
                        session.is_locked
                          ? "bg-muted border-foreground/15"
                          : "bg-primary border-primary"
                      }`}
                    >
                      {session.is_locked ? (
                        <LockSimpleIcon className="h-4 w-4 text-muted-foreground" weight="fill" />
                      ) : (
                        <span className="text-xs font-semibold text-primary-foreground">
                          {idx + 1}
                        </span>
                      )}
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-foreground/15 my-1" />}
                  </div> */}

                  {/* card: locked = div (non-clickable, gelap), unlocked = Link */}
                  {session.is_locked ? (
                    <div
                      className="
                        flex items-start gap-4 w-full rounded-[20px] border border-foreground/10
                        bg-muted/50 dark:bg-secondary/40 opacity-60 cursor-not-allowed
                        p-3 mb-5
                      "
                    >
                      {cardContent}
                    </div>
                  ) : (
                    <Link
                      href={`/session/${session.slug}` as Route}
                      scroll={false}
                      className="
                        group flex items-start gap-4 w-full rounded-[20px] border border-foreground
                        bg-background dark:bg-secondary hover:shadow-md transition-shadow
                        p-3 mb-5
                      "
                    >
                      {cardContent}
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}