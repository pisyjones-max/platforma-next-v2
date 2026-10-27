'use client'
import { useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number
  onChange: (n: number) => void
}

// Числовое поле, которое можно стереть полностью и ввести любое число.
// Пока поле пустое — наружу отдаём 0 (родитель сам подставит свой минимум),
// но на экране остаётся пусто, а не «0».
export function NumInput({ value, onChange, ...rest }: Props) {
  const [text, setText] = useState(value === 0 ? '' : String(value))
  const [lastEmitted, setLastEmitted] = useState(value)

  // значение поменялось снаружи (не из этого поля) — подтягиваем в текст
  if (value !== lastEmitted) {
    setLastEmitted(value)
    if (text !== '') setText(String(value))
  }

  return (
    <input
      placeholder="0"
      {...rest}
      type="number"
      inputMode="decimal"
      value={text}
      onChange={e => {
        const n = parseFloat(e.target.value.replace(',', '.')) || 0
        setText(e.target.value)
        setLastEmitted(n)
        onChange(n)
      }}
    />
  )
}
