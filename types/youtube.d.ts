export {}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          events?: {
            onReady?: (event: { target: YTPlayer }) => void
            onStateChange?: (event: { data: number; target: YTPlayer }) => void
            onError?: (event: { data: number }) => void
          }
        }
      ) => YTPlayer
    }
    onYouTubeIframeAPIReady: (() => void) | undefined
  }

  interface YTPlayer {
    destroy: () => void
    playVideo: () => void
    pauseVideo: () => void
    getCurrentTime: () => number
  }
}