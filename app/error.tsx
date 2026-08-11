'use client'

import { ErrorState } from "@/components/error-state";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center md:px-16 px-6 gap-8 lg:max-w-7xl mx-auto w-full flex-1 justify-center">
      <ErrorState error={error} reset={reset} />
    </div>
  );
}