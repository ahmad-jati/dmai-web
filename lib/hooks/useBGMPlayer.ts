import { useRef, useCallback, useState, useEffect } from 'react'

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
 * Custom hook for managing background music
 * Handles smooth fade in/out for pause/resume/track-switch
 * Does NOT fade on step navigation
 */
export function useBGMPlayer(): BGMControls {
  const audioRef = useRef<HTMLAudioElement>(null)
  const fadeTimerRef = useRef<number | null>(null)
  const targetVolumeRef = useRef(1)

  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [isBGMStopped, setIsBGMStopped] = useState(true)

  // Smooth fade using requestAnimationFrame
  const smoothFade = useCallback((targetVolume: number, duration = 800) => {
    if (!audioRef.current) return

    if (fadeTimerRef.current) {
      cancelAnimationFrame(fadeTimerRef.current)
    }

    targetVolumeRef.current = targetVolume
    const startVolume = audioRef.current.volume
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      const newVolume = startVolume + (targetVolume - startVolume) * progress

      if (audioRef.current) {
        audioRef.current.volume = newVolume
      }

      if (progress < 1) {
        fadeTimerRef.current = requestAnimationFrame(animate)
      } else {
        fadeTimerRef.current = null
      }
    }

    fadeTimerRef.current = requestAnimationFrame(animate)
  }, [])

  const load = useCallback(
    async (src: string) => {
      if (!audioRef.current) return
      audioRef.current.src = src
      audioRef.current.load()
      setCurrentTrack(src)
      setIsLoaded(true)
    },
    []
  )

  const play = useCallback(async () => {
    if (!audioRef.current) return
    try {
      audioRef.current.volume = 0
      await audioRef.current.play()
      setIsBGMStopped(false)
      smoothFade(1, 1000) // Fade in over 1 second
    } catch (error) {
      console.warn('[v0] BGM play failed:', error)
    }
  }, [smoothFade])

  const pause = useCallback(() => {
    if (!audioRef.current) return
    smoothFade(0, 500) // Fade out over 500ms
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }, 500)
  }, [smoothFade])

  const resume = useCallback(async () => {
    if (!audioRef.current) return
    try {
      audioRef.current.volume = 0
      await audioRef.current.play()
      setIsBGMStopped(false)
      smoothFade(1, 500) // Fade in over 500ms
    } catch (error) {
      console.warn('[v0] BGM resume failed:', error)
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
      setIsBGMStopped(true)
    }, 500)
  }, [smoothFade])

  const switchTrack = useCallback(
    async (src: string) => {
      if (!audioRef.current) return

      const wasPlaying = !audioRef.current.paused

      if (wasPlaying) {
        // Fade out, switch, fade in
        await new Promise((resolve) => {
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
          smoothFade(1, 500)
        } catch (error) {
          console.warn('[v0] BGM track switch failed:', error)
        }
      }
    },
    [smoothFade]
  )

  const duck = useCallback(() => {
    smoothFade(0.2, 200) // Quickly duck for narration
  }, [smoothFade])

  const restore = useCallback(() => {
    if (!isBGMStopped) {
      smoothFade(1, 300) // Restore after narration
    }
  }, [isBGMStopped, smoothFade])

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return
    audioRef.current.volume = Math.max(0, Math.min(1, volume))
    targetVolumeRef.current = volume
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        cancelAnimationFrame(fadeTimerRef.current)
      }
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
