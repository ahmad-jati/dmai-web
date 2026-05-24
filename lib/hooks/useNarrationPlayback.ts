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
  const lastSrcRef = useRef<string | null>(null)

  const playNarration = useCallback(
    async (
      audioSrc: string,
      isMuted: boolean,
      onDuckBGM: () => void,
      onRestoreBGM: () => void
    ) => {
      if (!audio.ref.current || !audioSrc) return

      const narration = audio.ref.current

      // Always clean up previous listeners when starting a new narration
      listenerCleanupRef.current()

      // Stop current playback and reset position
      narration.pause()
      narration.currentTime = 0

      // Only set new source if it changed
      if (narration.src !== audioSrc) {
        narration.src = audioSrc
        narration.load()
      }

      // Set volume before playing
      narration.volume = isMuted ? 0 : 1
      lastSrcRef.current = audioSrc

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
          narration.currentTime = 0
          isPlayingRef.current = false
        }
      } catch (error) {
        console.warn('[v0] Narration play failed:', error)
        isPlayingRef.current = false
        onRestoreBGM()
      }
    },
    [audio, onNarrationEnd]
  )

  const stopNarration = useCallback(() => {
    listenerCleanupRef.current()
    if (audio.ref.current) {
      audio.ref.current.pause()
      audio.ref.current.currentTime = 0
    }
    isPlayingRef.current = false
    lastSrcRef.current = null
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
