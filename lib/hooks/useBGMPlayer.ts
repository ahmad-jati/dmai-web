import { useRef, useCallback, useState, useEffect } from 'react'

// No BGM_VOLUME constant — we never set volume programmatically.
// The audio element plays at whatever the user's system/browser volume is (1.0 by default).
// Fades only happen for smooth start/stop/switch transitions, always targeting 0 or 1.

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
}

export function useBGMPlayer(): BGMControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<number | null>(null)
  const isBGMStoppedRef = useRef(true)

  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [isBGMStopped, setIsBGMStopped] = useState(true)

  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.loop = true
    audio.volume = 1
    audioRef.current = audio
    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  // Cancels any in-progress fade, then animates volume from current → target.
  const smoothFade = useCallback((targetVolume: number, duration = 600) => {
    if (!audioRef.current) return
    if (fadeTimerRef.current) {
      cancelAnimationFrame(fadeTimerRef.current)
      fadeTimerRef.current = null
    }

    const startVolume = audioRef.current.volume
    const startTime = performance.now()

    const animate = (now: number) => {
      if (!audioRef.current) return
      const progress = Math.min((now - startTime) / duration, 1)
      audioRef.current.volume = Math.max(0, Math.min(1, startVolume + (targetVolume - startVolume) * progress))
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

  // Fade in from 0 → 1 on first play (avoids abrupt start).
  const play = useCallback(async () => {
    if (!audioRef.current) return
    audioRef.current.volume = 0
    await audioRef.current.play()
    isBGMStoppedRef.current = false
    setIsBGMStopped(false)
    smoothFade(1, 1200)
  }, [smoothFade])

  // Fade out → pause (does NOT reset currentTime).
  const pause = useCallback(() => {
    if (!audioRef.current) return
    smoothFade(0, 500)
    setTimeout(() => {
      audioRef.current?.pause()
    }, 520)
  }, [smoothFade])

  // Fade back in from wherever volume is → resume playback.
  const resume = useCallback(async () => {
    if (!audioRef.current) return
    if (!audioRef.current.paused) return
    try {
      audioRef.current.volume = 0
      await audioRef.current.play()
      isBGMStoppedRef.current = false
      setIsBGMStopped(false)
      smoothFade(1, 600)
    } catch (err) {
      console.warn('[BGM] resume failed:', err)
    }
  }, [smoothFade])

  // Fade out → pause + reset position.
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
    }, 520)
  }, [smoothFade])

  // Switch track immediately with a quick crossfade:
  // 1. Fade current out (if playing)
  // 2. Swap src + start playing at volume 0
  // 3. Fade in
  // This always autoplays — whether BGM was playing or was user-stopped.
  const switchTrack = useCallback(async (src: string) => {
    if (!audioRef.current) return

    // Cancel any pending fade first
    if (fadeTimerRef.current) {
      cancelAnimationFrame(fadeTimerRef.current)
      fadeTimerRef.current = null
    }

    // Fade out if currently audible
    const wasPlaying = !audioRef.current.paused
    if (wasPlaying) {
      smoothFade(0, 400)
      await new Promise<void>((r) => setTimeout(r, 420))
      audioRef.current?.pause()
    }

    if (!audioRef.current) return

    // Swap the source
    audioRef.current.src = src
    audioRef.current.currentTime = 0
    audioRef.current.volume = 0
    audioRef.current.load()
    setCurrentTrack(src)

    // Always autoplay the new track
    try {
      await audioRef.current.play()
      isBGMStoppedRef.current = false
      setIsBGMStopped(false)
      smoothFade(1, 600)
    } catch (err) {
      console.warn('[BGM] switchTrack play failed:', err)
    }
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
  }
}