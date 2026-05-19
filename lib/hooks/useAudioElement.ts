import { useRef, useCallback } from 'react'

interface AudioElementControls {
  ref: React.MutableRefObject<HTMLAudioElement | null>
  load: (src: string) => void
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  getCurrentTime: () => number
  getDuration: () => number
}

/**
 * Custom hook for managing HTML audio element
 * Provides a clean API for audio playback control
 */
export function useAudioElement(): AudioElementControls {
  const audioRef = useRef<HTMLAudioElement>(null)

  const load = useCallback((src: string) => {
    if (!audioRef.current) return
    audioRef.current.src = src
    audioRef.current.load()
  }, [])

  const play = useCallback(async () => {
    if (!audioRef.current) return
    try {
      await audioRef.current.play()
    } catch (error) {
      console.warn('[v0] Audio play failed:', error)
    }
  }, [])

  const pause = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
  }, [])

  const stop = useCallback(() => {
    if (!audioRef.current) return
    audioRef.current.pause()
    audioRef.current.currentTime = 0
  }, [])

  const setVolume = useCallback((volume: number) => {
    if (!audioRef.current) return
    audioRef.current.volume = Math.max(0, Math.min(1, volume))
  }, [])

  const setCurrentTime = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
  }, [])

  const getCurrentTime = useCallback(() => {
    return audioRef.current?.currentTime ?? 0
  }, [])

  const getDuration = useCallback(() => {
    return audioRef.current?.duration ?? 0
  }, [])

  return {
    ref: audioRef,
    load,
    play,
    pause,
    stop,
    setVolume,
    setCurrentTime,
    getCurrentTime,
    getDuration,
  }
}
