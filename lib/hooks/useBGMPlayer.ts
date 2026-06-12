import { useRef, useCallback, useState, useEffect } from 'react'

/**
 * BGM player using Web Audio API for fade operations.
 *
 * Why Web Audio API instead of rAF on volume?
 * ─ GainNode.linearRampToValueAtTime runs entirely off the main thread in the
 *   browser's audio worklet. On a "potato" phone the JS thread can be starved
 *   by layout/paint, causing rAF-based fades to stutter or freeze. The audio
 *   scheduler is decoupled from that and never drops frames.
 *
 * The audio element still owns src/loop/preload; it is connected to the Web
 * Audio graph via createMediaElementSource so we get both declarative loading
 * AND smooth fades.
 *
 * Note: MediaElementSourceNode can only be created once per HTMLAudioElement,
 * so we create both together and keep them for the lifetime of the hook.
 */

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

// How long (ms) audio context creation is deferred after mount
const LAZY_INIT_DELAY = 200

export function useBGMPlayer(): BGMControls {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const [currentTrack, setCurrentTrack] = useState<string | null>(null)
  const [isBGMStopped, setIsBGMStopped] = useState(true)

  const ensureContext = useCallback(() => {
    if (ctxRef.current) return

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const gain = ctx.createGain()
    gain.gain.value = 0
    gain.connect(ctx.destination)
    ctxRef.current = ctx
    gainRef.current = gain

    if (audioRef.current && !sourceRef.current) {
      const src = ctx.createMediaElementSource(audioRef.current)
      src.connect(gain)
      sourceRef.current = src
    }
  }, [])

  // ── Audio element: created once, never re-created ────────────
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.loop = true
    // 'none' = browser won't preload until we set .src and call .load()
    // This matters on low-end devices: no wasted bandwidth/decode at init.
    audio.preload = 'none'
    audioRef.current = audio

    // Defer AudioContext setup slightly so the page can finish its first paint
    const t = setTimeout(() => {
      ensureContext()
    }, LAZY_INIT_DELAY)

    return () => {
      clearTimeout(t)
      audio.pause()
      audio.src = ''
      ctxRef.current?.close()
    }
  }, [ensureContext])

  // ── Fade helper using Web Audio scheduler ────────────────────
  // targetVolume: 0–1, durationMs: milliseconds
  const scheduleFade = useCallback((targetVolume: number, durationMs: number) => {
    const gain = gainRef.current
    const ctx = ctxRef.current
    if (!gain || !ctx) return

    const now = ctx.currentTime
    const durationSec = durationMs / 1000

    // Cancel any running automation, snap to current value, then ramp
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(
      Math.max(0, Math.min(1, targetVolume)),
      now + durationSec
    )
  }, [])

  // ── Resume suspended AudioContext (required after user gesture) ─
  const resumeContext = useCallback(async () => {
    if (ctxRef.current?.state === 'suspended') {
      await ctxRef.current.resume()
    }
  }, [])

  // ── load ─────────────────────────────────────────────────────
  const load = useCallback(async (src: string) => {
    const audio = audioRef.current
    if (!audio) return
    audio.preload = 'auto'
    audio.src = src
    audio.load()
    setCurrentTrack(src)
    setIsLoaded(true)
  }, [])

  // ── play (first start, fade in 0→1) ─────────────────────────
  const play = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    ensureContext()
    await resumeContext()
    // Start silent then fade in — avoids the harsh pop on slow-loading audio
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.cancelScheduledValues(ctxRef.current.currentTime)
      gainRef.current.gain.setValueAtTime(0, ctxRef.current.currentTime)
    }
    try {
      await audio.play()
      setIsBGMStopped(false)
      scheduleFade(1, 1200)
    } catch (err) {
      console.warn('[BGM] play failed:', err)
    }
  }, [ensureContext, resumeContext, scheduleFade])

  // ── pause (fade out then pause, keep position) ───────────────
  const pause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    scheduleFade(0, 500)
    setTimeout(() => audio.pause(), 520)
  }, [scheduleFade])

  // ── resume (fade back in) ────────────────────────────────────
  const resume = useCallback(async () => {
    const audio = audioRef.current
    if (!audio || !audio.paused) return
    ensureContext()
    await resumeContext()
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.cancelScheduledValues(ctxRef.current.currentTime)
      gainRef.current.gain.setValueAtTime(0, ctxRef.current.currentTime)
    }
    try {
      await audio.play()
      setIsBGMStopped(false)
      scheduleFade(1, 600)
    } catch (err) {
      console.warn('[BGM] resume failed:', err)
    }
  }, [ensureContext, resumeContext, scheduleFade])

  // ── stop (fade out, reset position) ─────────────────────────
  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    scheduleFade(0, 500)
    setTimeout(() => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
      setIsBGMStopped(true)
    }, 520)
  }, [scheduleFade])

  // ── switchTrack (crossfade swap) ─────────────────────────────
  const switchTrack = useCallback(async (src: string) => {
    const audio = audioRef.current
    if (!audio) return
    ensureContext()

    const wasPlaying = !audio.paused
    if (wasPlaying) {
      scheduleFade(0, 300)
      await new Promise<void>((r) => setTimeout(r, 320))
      audio.pause()
    }

    audio.src = src
    audio.currentTime = 0
    audio.preload = 'auto'
    audio.load()
    setCurrentTrack(src)

    // Snap gain to 0 before the new track starts
    if (gainRef.current && ctxRef.current) {
      gainRef.current.gain.cancelScheduledValues(ctxRef.current.currentTime)
      gainRef.current.gain.setValueAtTime(0, ctxRef.current.currentTime)
    }

    await resumeContext()
    try {
      await audio.play()
      setIsBGMStopped(false)
      scheduleFade(1, 600)
    } catch (err) {
      console.warn('[BGM] switchTrack play failed:', err)
    }
  }, [ensureContext, resumeContext, scheduleFade])

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