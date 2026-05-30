import { useRef, useCallback, useState, useEffect } from 'react'

const BGM_VOLUME = 0.5
const BGM_DUCK_VOLUME = 0.1

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
}

/**
 * Manages background music with smooth fade in/out.
 *
 * KEY CHANGE: Creates its own Audio() element on mount — does NOT rely on
 * a DOM <audio> element. This means NO <audio ref={bgmRef}> in JSX is needed.
 * The ref is still exposed so BackgroundMusicPlayer can read metadata if needed,
 * but the element lives entirely in JS memory.
 */
export function useBGMPlayer(): BGMControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<number | null>(null)
  // Mirrors isBGMStopped state — kept in a ref so `restore` stays stable
  // (doesn't need isBGMStopped in its dep array, which would break stability).
  const isBGMStoppedRef = useRef(true)

  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [isBGMStopped, setIsBGMStopped] = useState(true)

  // Create the Audio element once on mount
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.loop = true
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  // ── Smooth fade via requestAnimationFrame ─────────────────────
  const smoothFade = useCallback((targetVolume: number, duration = 800) => {
    if (!audioRef.current) return
    if (fadeTimerRef.current) cancelAnimationFrame(fadeTimerRef.current)

    const startVolume = audioRef.current.volume
    const startTime = performance.now()

    const animate = (now: number) => {
      if (!audioRef.current) return
      const progress = Math.min((now - startTime) / duration, 1)
      const raw = startVolume + (targetVolume - startVolume) * progress
      // Always clamp — floating-point can drift past 0 or 1
      audioRef.current.volume = Math.max(0, Math.min(1, raw))
      if (progress < 1) {
        fadeTimerRef.current = requestAnimationFrame(animate)
      } else {
        fadeTimerRef.current = null
      }
    }
    fadeTimerRef.current = requestAnimationFrame(animate)
  }, [])

  const load = useCallback(async (src: string) => {
    if (!audioRef.current) return
    audioRef.current.src = src
    audioRef.current.load()
    setCurrentTrack(src)
    setIsLoaded(true)
  }, [])

  // Starts playback with fade-in. Re-throws on autoplay block so caller can handle.
  const play = useCallback(async () => {
    if (!audioRef.current) return
    audioRef.current.volume = 0
    await audioRef.current.play()
    isBGMStoppedRef.current = false
    setIsBGMStopped(false)
    smoothFade(BGM_VOLUME, 1200)
  }, [smoothFade])

  const pause = useCallback(() => {
    if (!audioRef.current) return
    smoothFade(0, 500)
    setTimeout(() => audioRef.current?.pause(), 500)
  }, [smoothFade])

  const resume = useCallback(async () => {
    if (!audioRef.current) return
    // Guard: already playing → do nothing (prevents double-play volume flash)
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

  const switchTrack = useCallback(async (src: string) => {
    if (!audioRef.current) return
    const wasPlaying = !audioRef.current.paused
    if (wasPlaying) {
      smoothFade(0, 500)
      await new Promise<void>((r) => setTimeout(r, 500))
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

  const duck = useCallback(() => smoothFade(BGM_DUCK_VOLUME, 200), [smoothFade])

  // Uses isBGMStoppedRef (not state) so this callback is always stable —
  // the narration effect won't re-run just because BGM state changed.
  const restore = useCallback(() => {
    if (!isBGMStoppedRef.current) smoothFade(BGM_VOLUME, 300)
  }, [smoothFade])

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
  }
}