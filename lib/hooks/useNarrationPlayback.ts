import { useRef, useCallback, useEffect } from 'react'

// Simple narration playback hook using a DOM audio element.
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

  // Initialize the DOM audio element on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Create a hidden audio element in the DOM
    let audio = document.getElementById('narration-audio') as HTMLAudioElement
    if (!audio) {
      audio = document.createElement('audio')
      audio.id = 'narration-audio'
      audio.crossOrigin = 'anonymous'
      audio.style.display = 'none'
      document.body.appendChild(audio)
    }
    audioRef.current = audio

    return () => {
      // Don't remove on unmount — keep it for the next session
    }
  }, [])

  const cancelFade = () => {
    if (fadeTimerRef.current) {
      cancelAnimationFrame(fadeTimerRef.current)
      fadeTimerRef.current = null
    }
  }

  const stopNarration = useCallback(() => {
    cancelFade()
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      audio.src = ''
    }
  }, [])

  const pauseNarration = useCallback(() => {
    cancelFade()
    const audio = audioRef.current
    if (!audio) return
    audio.pause() // panggil aja langsung, idempotent kalau udah paused
  }, [])

  const resumeNarration = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audio.src === '') return
    cancelFade()
    audio.play().catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('[Narration] resume failed:', err)
      }
    })
  }, [])

  const playNarration = useCallback((url: string, muted: boolean) => {
    const audio = audioRef.current
    if (!audio) return

    // Stop and reset current playback
    cancelFade()
    audio.pause()
    audio.currentTime = 0
    audio.src = url
    audio.volume = muted ? 0 : 1

    // Play the audio
    audio.play().catch((err) => {
      if (err.name !== 'AbortError') {
        console.warn('[Narration] play failed:', err)
      }
    })
  }, [])

  // Smooth mute/unmute of the currently playing narration only.
  const fadeMute = useCallback((muted: boolean) => {
    const audio = audioRef.current
    if (!audio || audio.src === '') return

    cancelFade()
    const target = muted ? 0 : 1

    // If audio is paused, just set volume directly
    if (audio.paused) {
      audio.volume = target
      return
    }

    // Animate the volume transition
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
