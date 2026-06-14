import Image from "next/image";
import Link from "next/link";
import { fetchAllSessions } from "@/lib/data-detail-session";
import { ArrowUpRightIcon, PersonSimpleTaiChiIcon, TimerIcon } from "@phosphor-icons/react/dist/ssr";
import { Route } from "next";
import { Button } from "@/components/ui/button";

// A tiny 1×1 pixel base64 placeholder — the browser shows this blurred
// while the real cover image loads. Using a warm neutral that fits the app tone.
const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9HQAI8gMBfTQ1BQAAAABJRU5ErkJggg==";

interface Props {
  excludeSlug?: string;
}

// This is an async Server Component — no "use client", no useEffect.
// Next.js runs this on the server and streams the result to the browser.
export async function SessionListServer({ excludeSlug }: Props) {
  const sessions = await fetchAllSessions();

  const filtered = excludeSlug
    ? sessions.filter((s) => s.slug !== excludeSlug)
    : sessions;

  return (
    <div
      className="
        grid 2lg:grid-cols-4 3md:grid-cols-3 2xs:grid-cols-2 grid-cols-1 gap-3.5 
        w-full
      "
    >
      {filtered.map((session) => (
        <Link
          key={session.slug}
          href={`/session/${session.slug}` as Route}
          className="
            group flex flex-col 2md:items-start items-end 2md:gap-3 gap-0
            bg-background 2md:rounded-[20px] rounded-lg border border-foreground w-full overflow-hidden hover:shadow-md transition-shadow 
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
              <p className="text-p/5 max-w-140 font-semibold group-hover:underline underline-offset-2 2md:text-left text-left">
                {session.session_name}
              </p>
              <Button
                variant={"default"}
                className="[&_svg]:size-6 font-foreground bg-none rounded-none border-none p-0 2md:hidden block"
              >
                <ArrowUpRightIcon />
              </Button>
            </div>

            <p className="text-pretty 2md:mt-0 -mt-2 xs:text-p/5 text-sm/4 2md:max-w-140 font-medium line-clamp-3 2md:min-h-[3lh] text-muted-foreground 2md:text-left text-left">
              {session.detail_short}
            </p>

            <div className="flex-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <PersonSimpleTaiChiIcon
                  className="h-3 w-3 text-muted-foreground"
                  weight="fill"
                />
                <p className="sm:text-sm/5 text-xs/4 font-medium text-muted-foreground">
                  {session.total_instruction} Instruksi
                </p>
              </span>

              <span className="flex items-center gap-1">
                <TimerIcon className="h-3 w-3" weight="fill" />
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