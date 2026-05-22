/**
 * Audio Preloader with Priority-Based Loading
 * 
 * Priority 1: All step metadata (done immediately)
 * Priority 2: Current narration audio (started immediately, plays first)
 * Priority 3: Next narration audios (prefetched in background)
 * Priority 4: BGM single file (loaded once for entire session)
 */

export interface AudioPreloadConfig {
  currentStepIndex: number
  totalSteps: number
  narrationUrls: string[]
  bgmUrl?: string
}

export interface AudioPreloadState {
  current: HTMLAudioElement | null
  next: HTMLAudioElement | null
  bgm: HTMLAudioElement | null
  preloadedSteps: Set<number>
}

/**
 * Creates audio elements with proper crossOrigin for CORS
 */
function createAudioElement(src: string): HTMLAudioElement {
  const audio = new Audio()
  audio.crossOrigin = 'anonymous'
  audio.src = src
  return audio
}

/**
 * Preloads current narration audio (Priority 2)
 */
export async function preloadCurrentNarration(
  audioUrl: string
): Promise<HTMLAudioElement> {
  const audio = createAudioElement(audioUrl)
  
  return new Promise((resolve) => {
    const handleCanPlay = () => {
      audio.removeEventListener('canplay', handleCanPlay)
      resolve(audio)
    }
    
    audio.addEventListener('canplay', handleCanPlay, { once: true })
    audio.load()
    
    // Fallback after 3 seconds
    setTimeout(() => {
      audio.removeEventListener('canplay', handleCanPlay)
      resolve(audio)
    }, 3000)
  })
}

/**
 * Preloads next narration audio in background (Priority 3)
 * Does not block, returns immediately
 */
export function preloadNextNarration(
  audioUrl: string
): HTMLAudioElement {
  const audio = createAudioElement(audioUrl)
  audio.preload = 'metadata'
  // Start loading in background without waiting
  audio.load()
  return audio
}

/**
 * Loads BGM once for the entire session (Priority 4)
 */
export async function preloadBGM(bgmUrl: string): Promise<HTMLAudioElement> {
  const audio = createAudioElement(bgmUrl)
  audio.loop = true
  
  return new Promise((resolve) => {
    const handleCanPlay = () => {
      audio.removeEventListener('canplay', handleCanPlay)
      resolve(audio)
    }
    
    audio.addEventListener('canplay', handleCanPlay, { once: true })
    audio.load()
    
    // Fallback after 2 seconds
    setTimeout(() => {
      audio.removeEventListener('canplay', handleCanPlay)
      resolve(audio)
    }, 2000)
  })
}

/**
 * Intelligently preloads audio based on priorities
 * - Current narration: blocks until ready to play
 * - Next narrations: prefetch in background (2-3 steps ahead)
 * - BGM: load once at session start
 */
export async function smartPreloadAudio(config: AudioPreloadConfig) {
  const { currentStepIndex, totalSteps, narrationUrls, bgmUrl } = config
  
  // Priority 1: All step metadata is already available
  // (passed in as narrationUrls array)
  
  // Priority 2: Current narration - block until ready
  const currentNarration = narrationUrls[currentStepIndex]
  const currentAudio = currentNarration 
    ? await preloadCurrentNarration(currentNarration)
    : null

  // Priority 3: Next narrations - start prefetching immediately
  const nextSteps: HTMLAudioElement[] = []
  const preloadAhead = 2 // Prefetch up to 2 steps ahead
  
  for (let i = 1; i <= preloadAhead && currentStepIndex + i < totalSteps; i++) {
    const nextUrl = narrationUrls[currentStepIndex + i]
    if (nextUrl) {
      const nextAudio = preloadNextNarration(nextUrl)
      nextSteps.push(nextAudio)
    }
  }

  // Priority 4: BGM - load once, reuse for entire session
  const bgmAudio = bgmUrl ? await preloadBGM(bgmUrl) : null

  return {
    currentAudio,
    nextAudios: nextSteps,
    bgmAudio,
  }
}

/**
 * Cleans up audio resources
 */
export function cleanupAudioResources(audios: (HTMLAudioElement | null)[]) {
  audios.forEach((audio) => {
    if (audio) {
      audio.pause()
      audio.src = ''
    }
  })
}
