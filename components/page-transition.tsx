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
    }, 600)
    return () => clearTimeout(timer)
  }, [pathname, children])

  return (
    <div
      style={{
        animation:
          transitionStage === 'enter'
            ? 'pageEnter 800ms cubic-bezier(0.34, 1.56, 0.64, 1)'
            : 'pageExit 600ms ease-in-out',
      }}
    >
      <style>{`
        @keyframes pageExit {
          from {
            opacity: 1;
            transform: translateY(0px);
          }
          to {
            opacity: 0;
            transform: translateY(-12px);
          }
        }
        @keyframes pageEnter {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }
      `}</style>
      {displayChildren}
    </div>
  )
}
