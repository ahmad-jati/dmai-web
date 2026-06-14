import { Suspense } from "react";
import { SessionListServer } from "./session-list-server";
import { SessionListSkeleton } from "./session-list-skeleton";

interface Props {
  excludeSlug?: string;
}

export function SessionList({ excludeSlug }: Props) {
  return (
    <div id="session-list" className="flex flex-col gap-6 items-start">
      <div className="flex flex-col w-full 2md:items-start items-center gap-2 sm:max-w-180 2md:max-w-80">
        <h2 className="sm:text-h2/7 text-xl/5.5 font-semibold sm:text-left text-center">
          All Session
        </h2>
        <p className="xs:text-p/5 text-sm/4 sm:max-w-140 font-medium sm:text-left text-center text-pretty">
          Mulai perlahan, pilih satu sesi yang terasa paling dekat denganmu.
        </p>
      </div>

      <Suspense fallback={<SessionListSkeleton />}>
        <SessionListServer excludeSlug={excludeSlug} />
      </Suspense>
    </div>
  );
}