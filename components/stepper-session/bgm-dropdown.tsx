'use client'

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { MusicNotesIcon, CaretDownIcon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export type BgmTrack = {
  id: string
  title: string
  composer: string | null
  audio_url: string
  duration_seconds: number | null
}

type BgmDropdownProps = {
  tracks: BgmTrack[]
  currentTrackIndex: number
  isBGMStopped: boolean
  onSelectTrack: (index: number) => void
  onStop: () => void
  className?: string
}

export function BgmDropdown({
  tracks,
  currentTrackIndex,
  isBGMStopped,
  onSelectTrack,
  onStop,
  className,
}: BgmDropdownProps) {
  const currentTrack = tracks[currentTrackIndex]
  const bgmLabel = isBGMStopped ? 'Tanpa Musik' : currentTrack?.title ?? 'Musik Latar'
  const bgmSublabel = !isBGMStopped && currentTrack?.composer ? currentTrack.composer : null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'group flex items-center gap-3 px-4 py-2 2md:rounded-lg rounded-xl bg-white dark:bg-card text-foreground/80 hover:bg-white/90 hover:cursor-pointer transition-all duration-150 ease-out w-full shrink-0 h-13 border border-border',
            className
          )}
        >
          <MusicNotesIcon
            weight="fill"
            className={cn('w-3.5 h-3.5 shrink-0', isBGMStopped ? 'opacity-40' : 'opacity-100')}
          />
          <div className="flex flex-1 flex-col min-w-0 text-left">
            <span className="text-xs font-semibold leading-tight truncate">{bgmLabel}</span>
            {bgmSublabel && (
              <span className="text-xs leading-tight truncate font-medium text-muted-foreground">
                {bgmSublabel}
              </span>
            )}
          </div>
          <CaretDownIcon
            weight="bold"
            className="w-4 h-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        sideOffset={8}
        style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
        className="bg-white dark:bg-card text-foreground border border-border 2md:rounded-lg rounded-xl p-2.5 flex flex-col gap-0.5 z-9999 group"
      >
        <span className="text-xs font-bold tracking-[0.18em] uppercase px-2 pb-1.5">Musik Latar</span>
        {tracks.map((track, index) => (
          <DropdownMenuItem
            key={track.id}
            onSelect={() => onSelectTrack(index)}
            className={cn(
              'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-md cursor-pointer',
              index === currentTrackIndex && !isBGMStopped
                ? 'border-foreground/40 bg-celeste dark:bg-foreground/20 shadow-sm'
                : 'hover:bg-foreground hover:dark:bg-foreground/20'
            )}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/40" />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-foreground">{track.title}</span>
              {track.composer && <span className="text-xs text-foreground">{track.composer}</span>}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="m-1 bg-muted-foreground/25 dark:bg-background/20" />
        <DropdownMenuItem
          onSelect={onStop}
          className={cn(
            'flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg cursor-pointer',
            isBGMStopped
              ? 'border-foreground/40 bg-celeste dark:bg-foreground/20 shadow-sm'
              : 'hover:bg-foreground hover:dark:bg-foreground/20'
          )}
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-muted-foreground/40" />
          <span className="text-xs font-semibold text-foreground">Tanpa Musik</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}