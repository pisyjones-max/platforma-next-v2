'use client'
import { useCallback } from 'react'
import { formatPhone } from '@/lib/phone'

interface Props {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
}

export function PhoneInput({ value, onChange, placeholder = '+7 (___) ___-__-__', className }: Props) {
  const handle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(formatPhone(e.target.value))
  }, [onChange])
  return (
    <input type="tel" value={value} onChange={handle}
      placeholder={placeholder} className={className} inputMode="tel" />
  )
}
