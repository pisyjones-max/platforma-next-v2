'use client'
import { useState, useCallback } from 'react'

export interface Toast {
  id: number
  msg: string
  type: 'default' | 'success' | 'error'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((msg: string, type: Toast['type'] = 'default') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2900)
  }, [])

  return { toasts, toast }
}
