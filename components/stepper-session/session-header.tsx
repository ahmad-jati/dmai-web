'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeftIcon } from '@phosphor-icons/react'
import { BgmDropdown, type BgmTrack } from './bgm-dropdown'

type SessionHeaderProps = {
  onBack: () => void
  currentStep: number
  totalSteps: number
  tracks: BgmTrack[]
  currentTrackIndex: number
  isBGMStopped: boolean
  onSelectTrack: (index: number) => void
  onStop: () => void
}

// Single header used by every layout (narration/non-narration, mobile/desktop)
// so the back button, BGM control, and step counter always sit in the same
// place regardless of step type.
export function SessionHeader({
  onBack,
  currentStep,
  totalSteps,
  tracks,
  currentTrackIndex,
  isBGMStopped,
  onSelectTrack,
  onStop,
}: SessionHeaderProps) {
  return (
    <div className='flex 2md:flex-row flex-col items-center gap-2 w-full 2md:px-8  2md:py-0 py-2'>
      <div className="flex items-center justify-between gap-2 w-full 2md:py-2">
        <Button
          onClick={onBack}
          variant="link"
          size="sm"
          className="[&_svg]:size-4 gap-1.5 px-1 text-foreground shrink-0"
        >
          <ArrowLeftIcon weight="bold" />
          Kembali
        </Button>

        <div className="flex-1 min-w-0 2md:flex hidden justify-center">
          <BgmDropdown
            tracks={tracks}
            currentTrackIndex={currentTrackIndex}
            isBGMStopped={isBGMStopped}
            onSelectTrack={onSelectTrack}
            onStop={onStop}
            className="max-w-xs"
          />
        </div>

        <div className="bg-white dark:bg-white/14 border border-foreground/20 px-3 py-1.5 rounded-lg flex items-center shrink-0">
          <span className="sm:text-sm text-xs font-semibold text-muted-foreground  dark:text-foreground">
            Tahap {currentStep + 1} / {totalSteps}
          </span>
        </div>
      </div>

      <div className="w-full 2md:hidden flex justify-center">
          <BgmDropdown
            tracks={tracks}
            currentTrackIndex={currentTrackIndex}
            isBGMStopped={isBGMStopped}
            onSelectTrack={onSelectTrack}
            onStop={onStop}
            className="w-full"
          />
        </div>
    </div>
  )
}