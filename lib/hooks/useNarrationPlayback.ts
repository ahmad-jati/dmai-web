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
  // Fades narration volume to 0 or 1 over MUTE_FADE_DURATION.
  // Does NOT stop/restart playback — just adjusts volume.
  fadeMute: (mute: boolean) => void
}

const FADE_DURATION = 500      // fade-in / fade-out on play/stop
const MUTE_FADE_DURATION = 300 // faster fade for mute/unmute toggle

/**
 * Fades audio.volume from its current value to `target` over `duration` ms.
 * Returns a cancel fn to abort mid-fade (e.g. if mute is toggled again quickly).
 */
function fadeVolume(
  audio: HTMLAudioElement,
  target: number,
  duration: number,
  onComplete?: () => void
): () => void {
  const start = audio.volume
  const startTime = performance.now()
  let rafId: number

  const tick = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1)
    audio.volume = Math.max(0, Math.min(1, start + (target - start) * progress))
    if (progress < 1) {
      rafId = requestAnimationFrame(tick)
    } else {
      onComplete?.()
    }
  }

  rafId = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(rafId)
}

/**
 * Manages narration audio with:
 *   - Fade-in on play, fade-out on stop
 *   - fadeMute() for smooth mute/unmute without restarting playback
 *   - Always stable callback refs ([] deps) — no render-loop risk
 */
export function useNarrationPlayback(): NarrationControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const cleanupRef = useRef<() => void>(() => {})
  // Active fade cancel for play/stop fades
  const cancelFadeRef = useRef<() => void>(() => {})
  // Active fade cancel specifically for mute/unmute (separate so they don't
  // collide with play/stop fades)
  const cancelMuteFadeRef = useRef<() => void>(() => {})
  // Track current muted state in a ref so fadeMute stays stable
  const isMutedRef = useRef(false)

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
    const audio = audioRef.current
    if (!audio) {
      cleanupRef.current()
      cleanupRef.current = () => {}
      return
    }

    // Cancel both play-fade and mute-fade
    cancelFadeRef.current()
    cancelMuteFadeRef.current()

    // Fade out then stop
    const cancel = fadeVolume(audio, 0, FADE_DURATION, () => {
      audio.pause()
      audio.currentTime = 0
      cleanupRef.current()
      cleanupRef.current = () => {}
    })
    cancelFadeRef.current = cancel
  }, [])

  const playNarration = useCallback(
    (
      audioSrc: string,
      isMuted: boolean,
      onDuckBGM: () => void,
      onRestoreBGM: () => void
    ) => {
      const audio = audioRef.current
      if (!audio || !audioSrc) return

      // Cancel all in-progress fades and previous playback
      cancelFadeRef.current()
      cancelMuteFadeRef.current()
      cancelFadeRef.current = () => {}
      cancelMuteFadeRef.current = () => {}
      cleanupRef.current()

      audio.pause()
      audio.currentTime = 0

      // Sync the muted ref with current state
      isMutedRef.current = isMuted

      if (!audio.src.endsWith(audioSrc) && audio.src !== audioSrc) {
        audio.src = audioSrc
        audio.load()
      }

      // Always start silent — fade in after play() resolves
      audio.volume = 0

      const onEnded = () => {
        cancelFadeRef.current()
        cancelMuteFadeRef.current()
        onRestoreBGM()
        cleanupRef.current = () => {}
      }

      audio.addEventListener('ended', onEnded, { once: true })

      // Cleanup always restores BGM — step change, stop, or error
      cleanupRef.current = () => {
        audio.removeEventListener('ended', onEnded)
        onRestoreBGM()
      }

      audio.play()
        .then(() => {
          onDuckBGM()
          // Only fade in if not muted — if muted, stay at 0
          if (!isMuted) {
            const cancel = fadeVolume(audio, 1, FADE_DURATION)
            cancelFadeRef.current = cancel
          }
        })
        .catch((err) => {
          console.warn('[Narration] play failed:', err)
          audio.removeEventListener('ended', onEnded)
          onRestoreBGM()
          cleanupRef.current = () => {}
        })
    },
    [] // stable
  )

  /**
   * Smoothly fade narration volume for mute/unmute toggle.
   * Cancels any previous mute-fade so rapid toggling doesn't stack.
   * Never stops/restarts the audio — just moves the volume knob.
   */
  const fadeMute = useCallback((mute: boolean) => {
    const audio = audioRef.current
    if (!audio) return

    isMutedRef.current = mute

    // Cancel any prior mute fade
    cancelMuteFadeRef.current()

    const target = mute ? 0 : 1
    const cancel = fadeVolume(audio, target, MUTE_FADE_DURATION)
    cancelMuteFadeRef.current = cancel
  }, []) // stable

  return {
    ref: audioRef,
    playNarration,
    stopNarration,
    fadeMute,
  }
}