import { useRef, useCallback, useState, useEffect } from 'react'

const BGM_VOLUME = 0.6
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

export function useBGMPlayer(): BGMControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<number | null>(null)
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

  // Smooth fade via requestAnimationFrame. Cancels any in-progress fade first.
  const smoothFade = useCallback((targetVolume: number, duration = 800) => {
    if (!audioRef.current) return
    if (fadeTimerRef.current) cancelAnimationFrame(fadeTimerRef.current)

    const startVolume = audioRef.current.volume
    const startTime = performance.now()

    const animate = (now: number) => {
      if (!audioRef.current) return
      const progress = Math.min((now - startTime) / duration, 1)
      const raw = startVolume + (targetVolume - startVolume) * progress
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

  // Start from silence and fade in. Re-throws on autoplay block.
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

    // FIX: treat "user explicitly stopped" (Tanpa Musik) as intent to play again
    // when they pick a new track. Previously only checked !paused, which was
    // false after stop(), so the new track loaded but never played.
    const shouldPlay = !audioRef.current.paused || isBGMStoppedRef.current

    if (!audioRef.current.paused) {
      // Currently playing — fade out first before swapping src
      smoothFade(0, 500)
      await new Promise<void>((r) => setTimeout(r, 500))
    }

    audioRef.current.src = src
    audioRef.current.currentTime = 0
    audioRef.current.load()
    setCurrentTrack(src)

    if (shouldPlay) {
      try {
        // Explicitly reset to 0 before play so there's no full-volume flash
        audioRef.current.volume = 0
        await audioRef.current.play()
        isBGMStoppedRef.current = false
        setIsBGMStopped(false)
        smoothFade(BGM_VOLUME, 500)
      } catch (err) {
        console.warn('[BGM] track switch play failed:', err)
      }
    }
  }, [smoothFade])

  const duck = useCallback(() => smoothFade(BGM_DUCK_VOLUME, 200), [smoothFade])

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