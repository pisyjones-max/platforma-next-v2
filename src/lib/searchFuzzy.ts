// «Умный» поиск: терпимость к ошибкам в написании, раскладке и транслиту.
// Рассчитан на тех, кто плохо знает русский (террасная / тераса / терасная,
// гипсакартон, металачерепица) и на тех, кто набрал запрос не в той раскладке.

// Фонетическая свёртка: убираем различия, в которых чаще всего ошибаются.
//  - ё/е/э/ы/й → и, о → а (безударные гласные), ъ/ь выкидываем
//  - двойные буквы схлопываем (терраса = тераса)
export function fold(input: string): string {
  let s = input.toLowerCase()
  s = s.replace(/[ъь]/g, '')
  s = s.replace(/[ёеэый]/g, 'и')
  s = s.replace(/о/g, 'а')
  s = s.replace(/([а-яa-z])\1+/g, '$1')
  return s
}

// Грубое отсечение окончаний («террасные» → «террасн»), только для слов от 6 букв
export function stemRaw(token: string): string {
  if (token.length < 6) return token
  const stem = token.replace(/(ая|яя|ой|ый|ий|ое|ее|ые|ие|ую|юю|ов|ев|ам|ям|ах|ях|ом|ем|а|я|ы|и|е|у|ю|о)$/, '')
  return stem.length >= 4 ? stem : token
}

const LAYOUT: Record<string, string> = {
  q: 'й', w: 'ц', e: 'у', r: 'к', t: 'е', y: 'н', u: 'г', i: 'ш', o: 'щ', p: 'з', '[': 'х', ']': 'ъ',
  a: 'ф', s: 'ы', d: 'в', f: 'а', g: 'п', h: 'р', j: 'о', k: 'л', l: 'д', ';': 'ж', "'": 'э',
  z: 'я', x: 'ч', c: 'с', v: 'м', b: 'и', n: 'т', m: 'ь', ',': 'б', '.': 'ю',
}

// «nthhfcyfz» → «террасная» (набрали на английской раскладке)
export function layoutSwap(s: string): string {
  return s.toLowerCase().replace(/[a-z\[\];',.]/g, ch => LAYOUT[ch] ?? ch)
}

const TRANSLIT_MULTI: [string, string][] = [
  ['sch', 'щ'], ['shch', 'щ'], ['zh', 'ж'], ['kh', 'х'], ['ts', 'ц'], ['ch', 'ч'], ['sh', 'ш'],
  ['ya', 'я'], ['yu', 'ю'], ['yo', 'е'], ['ye', 'е'], ['ee', 'и'],
]
const TRANSLIT_ONE: Record<string, string> = {
  a: 'а', b: 'б', c: 'к', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'й', k: 'к', l: 'л', m: 'м',
  n: 'н', o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т', u: 'у', v: 'в', w: 'в', x: 'кс', y: 'ы', z: 'з',
}

// «terrasnaya doska» → «террасная доска»
export function translit(s: string): string {
  let out = s.toLowerCase()
  for (const [lat, cyr] of TRANSLIT_MULTI) out = out.split(lat).join(cyr)
  return out.replace(/[a-z]/g, ch => TRANSLIT_ONE[ch] ?? ch)
}

export const hasLatin = (s: string) => /[a-z]/i.test(s)
export const hasCyrillic = (s: string) => /[а-яё]/i.test(s)

// Расстояние Левенштейна с отсечкой: возвращает max+1, если больше max
export function lev(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur.push(v)
      if (v < rowMin) rowMin = v
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

// Бытовые синонимы: что человек пишет → что реально встречается в каталоге
const SYNONYMS_RAW: Record<string, string[]> = {
  'крыша': ['кровл', 'кровельн'],
  'крышу': ['кровл', 'кровельн'],
  'кровля': ['крыша'],
  'профлист': ['профнастил'],
  'профнастил': ['профлист', 'профилированн'],
  'минвата': ['утеплител', 'минеральн'],
  'вата': ['утеплител', 'минеральн'],
  'утеплитель': ['минвата', 'изоляци'],
  'гкл': ['гипсокартон'],
  'гипсокартон': ['гкл', 'гипсоволокнист'],
  'штакетник': ['евроштакетник'],
  'евроштакетник': ['штакетник'],
  'забор': ['заборн', 'ограждени', 'штакетник', 'профнастил'],
  'ограда': ['ограждени', 'заборн'],
  'черепица': ['металлочерепиц'],
  'водосток': ['водосточн', 'желоб'],
  'желоб': ['водосточн'],
  'терраса': ['террасн', 'дпк'],
  'веранда': ['террасн', 'дпк'],
  'дпк': ['террасн'],
  'саморез': ['шуруп'],
  'шуруп': ['саморез'],
  'пароизоляция': ['пароизоляцион'],
  'гидроизоляция': ['гидроизоляцион'],
  'фасад': ['фасадн', 'сайдинг'],
  'мансарда': ['мансардн'],
  'окно': ['мансардн'],
  'лестница': ['лестниц'],
  'труба': ['дымоход', 'водосточн'],
  'краска': ['защитн', 'антисептик'],
  'антисептик': ['защита древесин'],
}
export const SYNONYMS: Map<string, string[]> = (() => {
  const m = new Map<string, string[]>()
  for (const [k, v] of Object.entries(SYNONYMS_RAW)) m.set(fold(k), v.map(x => fold(x)))
  return m
})()

export interface Vocab { words: string[]; freq: Map<string, number> }

export function buildVocab(texts: Iterable<string>): Vocab {
  const freq = new Map<string, number>()
  for (const t of texts) {
    for (const w of t.split(/[^a-zа-я0-9]+/)) {
      if (w.length < 3 || /^\d+$/.test(w)) continue
      freq.set(w, (freq.get(w) ?? 0) + 1)
    }
  }
  return { words: Array.from(freq.keys()), freq }
}

// Слова словаря, похожие на опечатанный токен (оба — уже после fold)
export function nearWords(tok: string, vocab: Vocab, limit = 8): string[] {
  if (tok.length < 4 || /\d/.test(tok)) return []
  // токен и так встречается где-то в словаре как подстрока — исправлять нечего
  for (const w of vocab.words) if (w.includes(tok)) return []
  const max = tok.length >= 8 ? 2 : 1
  const scored: { w: string; d: number }[] = []
  for (const w of vocab.words) {
    if (w.length + max < tok.length) continue
    // сравниваем и со словом целиком, и с его началом (пользователь мог не дописать)
    const d = Math.min(lev(tok, w, max), w.length > tok.length ? lev(tok, w.slice(0, tok.length), max) : max + 1)
    if (d <= max) scored.push({ w, d })
  }
  scored.sort((a, b) => a.d - b.d || (vocab.freq.get(b.w) ?? 0) - (vocab.freq.get(a.w) ?? 0))
  return scored.slice(0, limit).map(s => s.w)
}
