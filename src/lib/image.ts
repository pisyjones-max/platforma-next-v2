export function imgUrl(src: string): string {
  if (!src) return ''
  if (src.startsWith('http') || src.startsWith('/')) return src
  return '/' + src
}
