'use client'
import { useEffect, useRef } from 'react'
import { useUI } from '@/context/UIContext'

export function ExitIntentTrigger() {
  const { openExit } = useUI()
  const triggered = useRef(false)

  useEffect(() => {
    if (sessionStorage.getItem('exit_shown')) return

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !triggered.current) {
        triggered.current = true
        sessionStorage.setItem('exit_shown', '1')
        openExit()
      }
    }

    const timer = setTimeout(() => {
      if (!triggered.current && !sessionStorage.getItem('exit_shown')) {
        triggered.current = true
        sessionStorage.setItem('exit_shown', '1')
        openExit()
      }
    }, 60000)

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      clearTimeout(timer)
    }
  }, [openExit])

  return null
}
