  'use client'

  import { RefObject } from 'react'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
  import { MusicNotesIcon, PlayIcon, StopIcon } from "@phosphor-icons/react"
  import { Button } from "./ui/button"

  type Track = {
    id: string
    title: string
    composer: string | null
    audio_url: string
    duration_seconds: number | null
  }

  type Props = {
    audioRef: RefObject<HTMLAudioElement | null>
    tracks: Track[]
    currentIndex: number
    isStopped: boolean
    onSelectTrack: (index: number) => void
    onStop: () => void
    isLoaded: boolean  
  }

  export function BackgroundMusicPlayer({
    audioRef,
    tracks,
    currentIndex,
    isStopped,
    onSelectTrack,
    onStop,
    isLoaded
  }: Props) {
    const currentTrack = tracks[currentIndex]

    return (
      <div className="bg-background flex items-center gap-2 justify-between w-full px-4 py-2 rounded-xl border border-foreground">
        <MusicNotesIcon className="w-4 h-4"/>

        <div className="flex-1 text-sm flex flex-col gap-0.5 items-center">
          {isStopped ? (
            <p className="text-muted-foreground">Musik dimatikan</p>
          ) : !isLoaded ? (
            <p className="text-muted-foreground">Memuat musik...</p>
          ) : tracks.length === 0 ? (
            <p className="text-muted-foreground">Tidak ada musik tersedia</p>
          ) : currentTrack ? (
            <>
              <p className="font-semibold">{currentTrack.title}</p>
              <p className="">{currentTrack.composer}</p>
            </>
          ) : null}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-5.5 h-5.5 p-1 [&_svg]:size-3 flex items-center justify-center rotate-90 bg-white"
            >
              <PlayIcon className="w-5 h-5" weight="fill"/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-74 bg-background">
            {tracks.map((track, index) => (
              <div key={track.id}>
                <DropdownMenuItem
                  className="py-0.5 px-1"
                  onSelect={() => onSelectTrack(index)}
                >
                  <Button
                    variant="ghost"
                    size="lg"
                    className={`rounded-sm p-2 flex-1 flex flex-col gap-0.5 items-start text-sm ${index === currentIndex && !isStopped ? 'font-bold' : ''}`}
                  >
                    <p className="font-bold">{track.title}</p>
                    <p className="">{track.composer}</p>
                  </Button>
                </DropdownMenuItem>
                {index < tracks.length - 1 && <DropdownMenuSeparator />}
              </div>
            ))}
            <DropdownMenuItem className="flex-col gap-2" onSelect={onStop}>
              <Button className="flex-1 flex gap-2 items-center text-sm rounded-full p-2 bg-white hover:bg-white/80 w-full">
                <StopIcon className="w-5 h-5" weight="fill"/>
                <p className="font-medium">Matikan Lagu</p>
              </Button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }