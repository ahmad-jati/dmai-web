import { useEffect } from 'react'

export function useExerciseFullscreen() {
  useEffect(() => {
    document.body.classList.add('exercise-fullscreen')
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.classList.remove('exercise-fullscreen')
      document.body.style.overflow = prev
    }
  }, [])
}