import { useRef, useCallback, useEffect } from 'react'

interface NarrationControls {
  ref: React.MutableRefObject<HTMLAudioElement | null>
  playNarration: (
    audioSrc: string,
    isMuted: boolean,
    onDuckBGM: () => void,
    onRestoreBGM: () => void
  ) => void
  stopNarration: () => void
}

/**
 * Manages narration audio with a single internal Audio element.
 *
 * ROOT CAUSE FIX for the narration loop bug:
 *   The original hook returned an `audio` object in its return value and
 *   listed it in useCallback deps. Since the return object is new every
 *   render, `playNarration` was recreated every render. The effect in
 *   StepperExercise that called `playNarration` would then re-run every
 *   render → stopNarration() → playNarration() every ~16ms → the 1-2 s
 *   audio restart loop.
 *
 *   Fix:
 *   1. Creates ONE Audio() element on mount, kept in audioRef.
 *   2. `playNarration` and `stopNarration` have `[]` dep arrays — they
 *      are ALWAYS the same function reference. The narration effect in
 *      StepperExercise can safely list them in deps without re-running.
 *   3. No DOM <audio> element needed in JSX.
 */
export function useNarrationPlayback(): NarrationControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  // Holds the cleanup for the currently active narration listener
  const cleanupRef = useRef<() => void>(() => {})

  // Create the Audio element once on mount
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio
    return () => {
      cleanupRef.current()
      audio.pause()
      audio.src = ''
    }
  }, [])

  const stopNarration = useCallback(() => {
    cleanupRef.current()
    cleanupRef.current = () => {}
  }, []) // stable — reads from refs only

  const playNarration = useCallback(
    (
      audioSrc: string,
      isMuted: boolean,
      onDuckBGM: () => void,
      onRestoreBGM: () => void
    ) => {
      const audio = audioRef.current
      if (!audio || !audioSrc) return

      // Tear down any previous playback and listener
      cleanupRef.current()

      audio.pause()
      audio.currentTime = 0

      // Only reload if the URL changed (avoids unnecessary network hit)
      if (!audio.src.endsWith(audioSrc) && audio.src !== audioSrc) {
        audio.src = audioSrc
        audio.load()
      }

      audio.volume = isMuted ? 0 : 1

      const onEnded = () => {
        onRestoreBGM()
        cleanupRef.current = () => {}
      }

      audio.addEventListener('ended', onEnded, { once: true })

      // Cleanup: remove listener, stop audio, restore BGM
      cleanupRef.current = () => {
        audio.removeEventListener('ended', onEnded)
        audio.pause()
        audio.currentTime = 0
        onRestoreBGM()
      }

      audio.play()
        .then(() => {
          onDuckBGM()
        })
        .catch((err) => {
          console.warn('[Narration] play failed:', err)
          audio.removeEventListener('ended', onEnded)
          cleanupRef.current = () => {}
        })
    },
    [] // stable — reads from refs only
  )

  return {
    ref: audioRef,
    playNarration,
    stopNarration,
  }
}