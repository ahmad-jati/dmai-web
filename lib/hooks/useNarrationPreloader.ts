import { useEffect, useRef, useCallback, useState } from 'react'

interface NarrationPreloadState {
  currentLoaded: boolean
  nextQueued: string[]
  totalSteps: number
}

interface NarrationPreloaderControls {
  state: NarrationPreloadState
  preloadStep: (stepIndex: number, audioUrl: string) => void
  preloadNextSteps: (stepIndex: number, narrationUrls: string[]) => void
}

/**
 * Hook for intelligent narration audio preloading
 * Preloads current step narration + next 2-3 steps in background
 */
export function useNarrationPreloader(
  totalSteps: number,
  narrationUrls: string[]
): NarrationPreloaderControls {
  const [state, setState] = useState<NarrationPreloadState>({
    currentLoaded: false,
    nextQueued: [],
    totalSteps,
  })

  const audioElementsRef = useRef<Map<number, HTMLAudioElement>>(new Map())
  const preloadTimeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  // Preload a specific step's narration
  const preloadStep = useCallback((stepIndex: number, audioUrl: string) => {
    if (!audioUrl || audioElementsRef.current.has(stepIndex)) {
      return // Already loaded
    }

    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.src = audioUrl
    audio.preload = 'auto'

    audioElementsRef.current.set(stepIndex, audio)
    audio.load()
  }, [])

  // Intelligently preload next steps
  const preloadNextSteps = useCallback(
    (currentStepIndex: number, allNarrationUrls: string[]) => {
      // Clear old timeouts
      preloadTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      preloadTimeoutsRef.current.clear()

      // Preload next 2-3 steps with staggered timing
      const preloadAhead = 3
      const staggerMs = 500 // Wait between preloads to not overload network

      for (let i = 1; i <= preloadAhead && currentStepIndex + i < totalSteps; i++) {
        const stepIndex = currentStepIndex + i
        const audioUrl = allNarrationUrls[stepIndex]

        if (audioUrl && !audioElementsRef.current.has(stepIndex)) {
          // Stagger the preload requests
          const timeout = setTimeout(() => {
            preloadStep(stepIndex, audioUrl)
          }, staggerMs * i)

          preloadTimeoutsRef.current.set(stepIndex, timeout)
        }
      }
    },
    [totalSteps, preloadStep]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clear timeouts
      preloadTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))

      // Cleanup audio elements
      audioElementsRef.current.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })

      audioElementsRef.current.clear()
      preloadTimeoutsRef.current.clear()
    }
  }, [])

  return {
    state,
    preloadStep,
    preloadNextSteps,
  }
}

/**
 * Hook for managing BGM audio with lazy loading
 * Loads only once for the entire session
 */
export function useBGMPreloader() {
  const bgmElementRef = useRef<HTMLAudioElement | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const loadingPromiseRef = useRef<Promise<HTMLAudioElement> | null>(null)

  const preloadBGM = useCallback(async (bgmUrl: string) => {
    if (isLoaded && bgmElementRef.current) {
      return bgmElementRef.current
    }

    if (loadingPromiseRef.current) {
      return loadingPromiseRef.current
    }

    const promise = new Promise<HTMLAudioElement>((resolve) => {
      const audio = new Audio()
      audio.crossOrigin = 'anonymous'
      audio.src = bgmUrl
      audio.loop = true
      audio.preload = 'auto'

      const handleCanPlay = () => {
        audio.removeEventListener('canplay', handleCanPlay)
        bgmElementRef.current = audio
        setIsLoaded(true)
        loadingPromiseRef.current = null
        resolve(audio)
      }

      audio.addEventListener('canplay', handleCanPlay, { once: true })
      audio.load()

      // Fallback: resolve after 2 seconds even if not fully loaded
      setTimeout(() => {
        if (bgmElementRef.current === null) {
          bgmElementRef.current = audio
          setIsLoaded(true)
          loadingPromiseRef.current = null
          resolve(audio)
        }
      }, 2000)
    })

    loadingPromiseRef.current = promise
    return promise
  }, [isLoaded])

  useEffect(() => {
    return () => {
      if (bgmElementRef.current) {
        bgmElementRef.current.pause()
        bgmElementRef.current.src = ''
      }
    }
  }, [])

  return {
    preloadBGM,
    isLoaded,
  }
}
