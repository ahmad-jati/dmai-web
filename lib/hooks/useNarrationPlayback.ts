import { useRef, useCallback, useEffect } from 'react'
import { useAudioElement } from './useAudioElement'

interface NarrationControls {
  ref: React.MutableRefObject<HTMLAudioElement | null>
  isPlaying: boolean
  playNarration: (audioSrc: string, isMuted: boolean, onDuckBGM: () => void, onRestoreBGM: () => void) => Promise<void>
  stopNarration: () => void
}

/**
 * Custom hook for managing narration playback
 * Handles audio unlocking, ducking BGM, and cleanup
 */
export function useNarrationPlayback(
  onNarrationEnd?: () => void
): NarrationControls {
  const audio = useAudioElement()
  const isPlayingRef = useRef(false)
  const listenerCleanupRef = useRef<() => void>(() => {})

  const playNarration = useCallback(
    async (
      audioSrc: string,
      isMuted: boolean,
      onDuckBGM: () => void,
      onRestoreBGM: () => void
    ) => {
      if (!audio.ref.current || !audioSrc) return

      // Clean up previous listeners
      listenerCleanupRef.current()

      const narration = audio.ref.current
      narration.src = audioSrc
      narration.volume = isMuted ? 0 : 1

      // Load and play
      narration.load()
      try {
        await narration.play()
        isPlayingRef.current = true
        onDuckBGM()

        const onEnded = () => {
          isPlayingRef.current = false
          onRestoreBGM()
          onNarrationEnd?.()
        }

        narration.addEventListener('ended', onEnded, { once: true })

        listenerCleanupRef.current = () => {
          narration.removeEventListener('ended', onEnded)
          narration.pause()
          isPlayingRef.current = false
        }
      } catch (error) {
        console.warn('[v0] Narration play failed:', error)
        isPlayingRef.current = false
      }
    },
    [audio, onNarrationEnd]
  )

  const stopNarration = useCallback(() => {
    listenerCleanupRef.current()
    audio.stop()
    isPlayingRef.current = false
  }, [audio])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      listenerCleanupRef.current()
    }
  }, [])

  return {
    ref: audio.ref,
    isPlaying: isPlayingRef.current,
    playNarration,
    stopNarration,
  }
}
