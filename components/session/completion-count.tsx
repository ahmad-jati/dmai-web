import { HeartIcon } from "@phosphor-icons/react/dist/ssr"

export function CompletionCount({ count }: { count: number | null }) {
  return (
    <div className="flex items-center gap-1">
      <HeartIcon className="w-4 h-4" weight="fill" />
      <p className="font-medium xs:text-sm/5 text-xs/3.5">
        {count === null
          ? "Masuk untuk melihat progres sesi ini"
          : count === 0
            ? "Kamu belum pernah mengikuti sesi ini"
            : `Kamu telah mengikuti sesi ini ${count} kali`}
      </p>
    </div>
  )
}

export function CompletionCountMobile({ count }: { count: number | null }) {
  return (
    <div className="2md:hidden flex justify-center text-muted-foreground items-center gap-1 w-full">
      <HeartIcon className="w-4 h-4" weight="fill" />
      <p className="font-medium 2xs:text-p/5 text-xs/3.5">
        {count === null
          ? "Masuk untuk melihat progres sesi ini"
          : count === 0
            ? "Belum mengikuti sesi ini"
            : `Sesi diikuti ${count} kali`}
      </p>
    </div>
  )
}