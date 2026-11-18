#!/usr/bin/env node
/**
 * Берёт N тем со статусом pending из content/blog-plan.json, генерирует статьи
 * через scripts/generate-article.mjs и отмечает темы как done.
 * Использование: ANTHROPIC_API_KEY=... node scripts/weekly-articles.mjs [N]
 */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const count = Number(process.argv[2]) || 2
const root = process.cwd()
const planPath = path.join(root, 'content', 'blog-plan.json')
const blogDir = path.join(root, 'content', 'blog')
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
const today = new Date().toISOString().slice(0, 10)
const REQUIRED = ['slug', 'title', 'description', 'bodyMarkdown']

const pending = plan.filter(t => t.status === 'pending' && (t.attempts || 0) < 3)
if (pending.length === 0) {
  console.error('В плане нет тем со статусом pending. Добавь темы в content/blog-plan.json')
  process.exit(2)
}

let made = 0
for (const item of pending.slice(0, count)) {
  const before = new Set(fs.readdirSync(blogDir))
  console.log('Генерирую:', item.topic)
  try {
    execFileSync('node', ['scripts/generate-article.mjs', item.topic], { stdio: 'inherit', env: process.env })
    const added = fs.readdirSync(blogDir).filter(f => !before.has(f) && f.endsWith('.json'))
    if (added.length !== 1) throw new Error('ожидался 1 новый файл, получено: ' + added.length)
    const file = path.join(blogDir, added[0])
    const article = JSON.parse(fs.readFileSync(file, 'utf8'))
    const missing = REQUIRED.filter(k => !article[k])
    if (missing.length) throw new Error('в статье нет полей: ' + missing.join(', '))
    article.publishedAt = today
    if (item.city && !article.city) article.city = item.city
    if (item.cluster && !article.cluster) article.cluster = item.cluster
    fs.writeFileSync(file, JSON.stringify(article, null, 2) + '\n')
    item.status = 'done'
    item.slug = article.slug
    item.doneAt = today
    made++
  } catch (e) {
    console.error('Не удалось:', item.topic, '-', e.message)
    item.attempts = (item.attempts || 0) + 1
  }
}

fs.writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n')
console.log('Готово статей:', made, '| осталось pending:', plan.filter(t => t.status === 'pending').length)
if (made === 0) process.exit(1)
