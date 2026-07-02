/** Форматирует ввод в маску +7 (XXX) XXX-XX-XX */
export function formatPhone(raw: string): string {
  let v = raw.replace(/\D/g, '')
  if (v.startsWith('8')) v = '7' + v.slice(1)
  if (v.length > 0 && !v.startsWith('7')) v = '7' + v
  v = v.slice(0, 11)
  let out = v.length > 0 ? '+7' : ''
  if (v.length > 1) out += ' (' + v.slice(1, 4)
  if (v.length >= 4) out += ') ' + v.slice(4, 7)
  if (v.length >= 7) out += '-' + v.slice(7, 9)
  if (v.length >= 9) out += '-' + v.slice(9, 11)
  return out
}

/** Приводит ввод телефона к каноничному виду "7XXXXXXXXXX" для хранения/сверки в БД. Возвращает null, если номер некорректный. */
export function normalizePhone(raw: string): string | null {
  let v = String(raw ?? '').replace(/\D/g, '')
  if (v.startsWith('8')) v = '7' + v.slice(1)
  if (v.length === 10) v = '7' + v
  if (v.length !== 11 || !v.startsWith('7')) return null
  return v
}
