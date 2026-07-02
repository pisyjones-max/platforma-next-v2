'use client'
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { normalizePhone } from '@/lib/phone'

interface CardContextValue {
  verified: boolean
  phone: string          // "7XXXXXXXXXX" в каноничном виде, либо ''
  checking: boolean
  error: string
  verify: (rawPhone: string) => Promise<boolean>
  markVerified: (rawPhone: string) => void   // мгновенно отмечает как проверенный (после оформления карты)
  reset: () => void
}

const CardContext = createContext<CardContextValue | null>(null)
const LS_KEY = 'platforma_card_phone'

export function CardProvider({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false)
  const [phone, setPhone] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  // При загрузке — если телефон уже сохранён локально, тихо сверяем с сервером
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null
    if (!saved) return
    setPhone(saved)
    fetch('/api/card/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: saved }),
    })
      .then(r => r.json())
      .then(d => setVerified(!!d.valid))
      .catch(() => {})
  }, [])

  const verify = useCallback(async (rawPhone: string): Promise<boolean> => {
    const p = normalizePhone(rawPhone)
    if (!p) {
      setError('Введите корректный номер телефона')
      return false
    }
    setChecking(true)
    setError('')
    try {
      const res = await fetch('/api/card/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: p }),
      })
      const data = await res.json()
      if (data.valid) {
        setVerified(true)
        setPhone(p)
        localStorage.setItem(LS_KEY, p)
        return true
      }
      setVerified(false)
      setError('Карта с этим номером не найдена')
      return false
    } catch {
      setError('Не получилось проверить, попробуйте ещё раз')
      return false
    } finally {
      setChecking(false)
    }
  }, [])

  // Вызывается сразу после успешного оформления карты в LoyaltyModal
  const markVerified = useCallback((rawPhone: string) => {
    const p = normalizePhone(rawPhone)
    if (!p) return
    setVerified(true)
    setPhone(p)
    localStorage.setItem(LS_KEY, p)
  }, [])

  const reset = useCallback(() => {
    setVerified(false)
    setPhone('')
    setError('')
    localStorage.removeItem(LS_KEY)
  }, [])

  return (
    <CardContext.Provider value={{ verified, phone, checking, error, verify, markVerified, reset }}>
      {children}
    </CardContext.Provider>
  )
}

export function useCard() {
  const ctx = useContext(CardContext)
  if (!ctx) throw new Error('useCard must be used within CardProvider')
  return ctx
}
