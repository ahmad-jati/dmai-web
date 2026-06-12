import { useRef, useCallback } from 'react'

// Simple narration playback hook.
// No duck/restore — BGM volume is never touched here.
// playNarration(url, muted)  — plays audio at full volume, or silently if muted.
// pauseNarration()           — pauses (preserves position).
// resumeNarration()          — resumes from where it was paused.
// stopNarration()            — immediately stops and discards the current audio.
// fadeMute(muted)            — smoothly mute/unmute the currently playing narration.

interface NarrationControls {
  playNarration: (url: string, muted: boolean) => void
  pauseNarration: () => void
  resumeNarration: () => void
  stopNarration: () => void
  fadeMute: (muted: boolean) => void
}

export function useNarrationPlayback(): NarrationControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fadeTimerRef = useRef<number | null>(null)
  // Track whether we've started playing (so resume works even before first play)
  const hasPlayedRef = useRef(false)

  const cancelFade = () => {
    if (fadeTimerRef.current) {
      cancelAnimationFrame(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }

  const stopNarration = useCallback(() => {
    cancelFade()
    hasPlayedRef.current = false
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
  }, [])

  const pauseNarration = useCallback(() => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
    }
  }, [])

  const resumeNarration = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.play().catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('[Narration] resume failed:', err)
      }
    })
  }, [])

  const playNarration = useCallback((url: string, muted: boolean) => {
    // Stop whatever was playing first
    cancelFade()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }

    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.src = url
    audio.volume = muted ? 0 : 1
    audioRef.current = audio
    hasPlayedRef.current = true

    audio.play().catch((err) => {
      // Autoplay blocked or element was replaced before play resolved — ignore
      if (err.name !== 'AbortError') {
        console.warn('[Narration] play failed:', err)
      }
    })
  }, [])

  // Smooth mute/unmute of the currently playing narration only.
  // Does NOT touch BGM.
  const fadeMute = useCallback((muted: boolean) => {
    const audio = audioRef.current
    if (!audio) return

    cancelFade()
    const target = muted ? 0 : 1
    const start = audio.volume
    const startTime = performance.now()
    const duration = 300

    const animate = (now: number) => {
      if (!audioRef.current) return
      const progress = Math.min((now - startTime) / duration, 1)
      audioRef.current.volume = Math.max(0, Math.min(1, start + (target - start) * progress))
      if (progress < 1) {
        fadeTimerRef.current = requestAnimationFrame(animate)
      } else {
        fadeTimerRef.current = null
      }
    }
    fadeTimerRef.current = requestAnimationFrame(animate)
  }, [])

  return { playNarration, pauseNarration, resumeNarration, stopNarration, fadeMute }
}