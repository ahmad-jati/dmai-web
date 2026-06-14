'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [displayChildren, setDisplayChildren] = useState(children)
  const [transitionStage, setTransitionStage] = useState('enter')

  useEffect(() => {
    setTransitionStage('exit')
    const timer = setTimeout(() => {
      setDisplayChildren(children)
      setTransitionStage('enter')
    }, 300)
    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div
      style={{
        animation:
          transitionStage === 'enter'
            ? 'pageEnter 400ms ease-out'
            : 'pageExit 300ms ease-in',
      }}
    >
      <style>{`
        @keyframes pageExit {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(8px);
          }
        }
        @keyframes pageEnter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {displayChildren}
    </div>
  )
}
