'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function usePageTransition(duration = 400) {
  const router = useRouter()
  const [isTransitioning, setIsTransitioning] = useState(false)

  const navigate = (href: string) => {
    if (isTransitioning) return
    setIsTransitioning(true)
    setTimeout(() => {
      router.push(href)
      setTimeout(() => setIsTransitioning(false), duration)
    }, duration)
  }

  return { navigate, isTransitioning }
}
