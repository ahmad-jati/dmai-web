import { useRef, useCallback, useState, useEffect } from 'react'

// BGM plays at 50% of device volume so narration stays audible over it
const BGM_VOLUME = 0.5
const BGM_DUCK_VOLUME = 0.1 // drops further while narration speaks

interface BGMControls {
  ref: React.MutableRefObject<HTMLAudioElement | null>
  isLoaded: boolean
  currentTrack: string | null
  isBGMStopped: boolean
  load: (src: string) => Promise<void>
  play: () => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => void
  switchTrack: (src: string) => Promise<void>
  duck: () => void
  restore: () => void
  setVolume: (volume: number) => void
}

/**
 * Custom hook for managing background music.
 * Handles smooth fade in/out for pause/resume/track-switch.
 *
 * Key fixes vs. original:
 *  1. smoothFade clamps volume to [0, 1] → no more IndexSizeError
 *  2. BGM_VOLUME = 0.5  → plays at 50% device volume
 *  3. isBGMStoppedRef mirrors state so `restore` stays stable
 *     (doesn't need isBGMStopped in its dep array, which prevented
 *      the narration useEffect from looping on every render)
 *  4. resume() guards against calling play() on an already-playing
 *     element (prevents a volume-flash when the effect fires twice)
 */
export function useBGMPlayer(): BGMControls {
  const audioRef = useRef<HTMLAudioElement>(null)
  const fadeTimerRef = useRef<number | null>(null)
  const targetVolumeRef = useRef(BGM_VOLUME)
  // Stable ref that mirrors isBGMStopped state.
  // `restore` reads this instead of the state value so it never needs
  // isBGMStopped in its useCallback dep array — keeping it stable.
  const isBGMStoppedRef = useRef(true)

  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [isBGMStopped, setIsBGMStopped] = useState(true)

  // ── Smooth fade via requestAnimationFrame ─────────────────────────
  // FIX: clamp newVolume to [0, 1] — floating-point progress can
  //      momentarily exceed 1 and throw an IndexSizeError.
  const smoothFade = useCallback((targetVolume: number, duration = 800) => {
    if (!audioRef.current) return

    if (fadeTimerRef.current) cancelAnimationFrame(fadeTimerRef.current)

    targetVolumeRef.current = targetVolume
    const startVolume = audioRef.current.volume
    const startTime = performance.now()

    const animate = (now: number) => {
      if (!audioRef.current) return
      const progress = Math.min((now - startTime) / duration, 1)
      const raw = startVolume + (targetVolume - startVolume) * progress
      // ← THE FIX: always clamp so .volume never goes outside [0, 1]
      audioRef.current.volume = Math.max(0, Math.min(1, raw))

      if (progress < 1) {
        fadeTimerRef.current = requestAnimationFrame(animate)
      } else {
        fadeTimerRef.current = null
      }
    }

    fadeTimerRef.current = requestAnimationFrame(animate)
  }, [])

  // ── Load a track URL into the element ────────────────────────────
  const load = useCallback(async (src: string) => {
    if (!audioRef.current) return
    audioRef.current.src = src
    audioRef.current.load()
    setCurrentTrack(src)
    setIsLoaded(true)
  }, [])

  // ── Start playback with fade-in (throws on autoplay block) ───────
  const play = useCallback(async () => {
    if (!audioRef.current) return
    audioRef.current.volume = 0
    await audioRef.current.play() // re-throws so callers can detect block
    isBGMStoppedRef.current = false
    setIsBGMStopped(false)
    smoothFade(BGM_VOLUME, 1200) // 1.2 s fade-in on session start
  }, [smoothFade])

  // ── Fade out then pause (exercise paused) ────────────────────────
  const pause = useCallback(() => {
    if (!audioRef.current) return
    smoothFade(0, 500)
    setTimeout(() => audioRef.current?.pause(), 500)
  }, [smoothFade])

  // ── Resume from paused state with fade-in ────────────────────────
  const resume = useCallback(async () => {
    if (!audioRef.current) return
    // Guard: if already playing, do nothing — prevents a volume-reset
    // flash when the sync effect accidentally calls resume twice.
    if (!audioRef.current.paused) return
    try {
      audioRef.current.volume = 0
      await audioRef.current.play()
      isBGMStoppedRef.current = false
      setIsBGMStopped(false)
      smoothFade(BGM_VOLUME, 500)
    } catch (err) {
      console.warn('[BGM] resume failed:', err)
    }
  }, [smoothFade])

  // ── Fade out, reset, mark as explicitly stopped (user action) ────
  const stop = useCallback(() => {
    if (!audioRef.current) return
    smoothFade(0, 500)
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      isBGMStoppedRef.current = true
      setIsBGMStopped(true)
    }, 500)
  }, [smoothFade])

  // ── Cross-fade to a new track ─────────────────────────────────────
  const switchTrack = useCallback(async (src: string) => {
    if (!audioRef.current) return
    const wasPlaying = !audioRef.current.paused

    if (wasPlaying) {
      await new Promise<void>((resolve) => {
        smoothFade(0, 500)
        setTimeout(resolve, 500)
      })
    }

    audioRef.current.src = src
    audioRef.current.currentTime = 0
    audioRef.current.load()
    setCurrentTrack(src)

    if (wasPlaying) {
      try {
        await audioRef.current.play()
        smoothFade(BGM_VOLUME, 500)
      } catch (err) {
        console.warn('[BGM] track switch play failed:', err)
      }
    }
  }, [smoothFade])

  // ── Duck BGM quickly while narration plays ───────────────────────
  const duck = useCallback(() => {
    smoothFade(BGM_DUCK_VOLUME, 200)
  }, [smoothFade])

  // ── Restore BGM after narration ───────────────────────────────────
  // Uses isBGMStoppedRef (not state) so this callback is always stable.
  // Stable = narration useEffect never re-runs just because BGM state changed.
  const restore = useCallback(() => {
    if (!isBGMStoppedRef.current) {
      smoothFade(BGM_VOLUME, 300)
    }
  }, [smoothFade])

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return
    audioRef.current.volume = Math.max(0, Math.min(1, volume))
    targetVolumeRef.current = volume
  }, [])

  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) cancelAnimationFrame(fadeTimerRef.current)
    }
  }, [])

  return {
    ref: audioRef,
    isLoaded,
    currentTrack,
    isBGMStopped,
    load,
    play,
    pause,
    resume,
    stop,
    switchTrack,
    duck,
    restore,
    setVolume,
  }
}