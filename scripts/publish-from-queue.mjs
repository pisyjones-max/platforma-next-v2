#!/usr/bin/env node
/**
 * Берёт N готовых статей из content/blog-queue/*.json (по алфавиту имён файлов),
 * проверяет поля, ставит publishedAt = сегодня и переносит в content/blog/.
 * Использование: node scripts/publish-from-queue.mjs [N]
 */
import fs from 'node:fs'
import path from 'node:path'

const count = Number(process.argv[2]) || 2
const queueDir = path.join(process.cwd(), 'content', 'blog-queue')
const blogDir = path.join(process.cwd(), 'content', 'blog')
const today = new Date().toISOString().slice(0, 10)
const REQUIRED = ['slug', 'title', 'description', 'excerpt', 'bodyMarkdown']

const files = fs.existsSync(queueDir)
  ? fs.readdirSync(queueDir).filter(f => f.endsWith('.json')).sort()
  : []
if (files.length === 0) {
  console.error('Очередь content/blog-queue пуста. Добавь готовые статьи.')
  process.exit(2)
}

let published = 0
for (const f of files.slice(0, count)) {
  const src = path.join(queueDir, f)
  try {
    const article = JSON.parse(fs.readFileSync(src, 'utf8'))
    const missing = REQUIRED.filter(k => !article[k])
    if (missing.length) throw new Error('нет полей: ' + missing.join(', '))
    if (!/^[a-z0-9-]+$/.test(article.slug)) throw new Error('плохой slug: ' + article.slug)
    const dest = path.join(blogDir, article.slug + '.json')
    if (fs.existsSync(dest)) throw new Error('статья со slug уже есть: ' + article.slug)
    article.publishedAt = today
    if (article.city === undefined) article.city = null
    fs.writeFileSync(dest, JSON.stringify(article, null, 2) + '\n')
    fs.unlinkSync(src)
    console.log('Опубликована:', article.slug)
    published++
  } catch (e) {
    console.error('Пропущена', f, '-', e.message)
  }
}
console.log('Статей опубликовано:', published, '| осталось в очереди:', fs.readdirSync(queueDir).filter(f => f.endsWith('.json')).length)
if (published === 0) process.exit(1)
