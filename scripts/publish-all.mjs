#!/usr/bin/env node
/**
 * Публикация ВСЕХ статей блога PLATFORMA за один прогон.
 *
 * Использование:
 *   node scripts/publish-all.mjs
 *   GITHUB_TOKEN=ghp_xxx node scripts/publish-all.mjs   (если нет настроенного remote с доступом на push)
 *
 * Что делает:
 *   1. Валидирует каждый content/blog/*.json (обязательные поля + имя файла = slug).
 *   2. Один раз: npx tsc --noEmit + npm run build — если что-то не соберётся, публикация отменяется целиком.
 *   3. Один git add/commit/push всех статей разом (а не по одной, как publish-article.mjs).
 *   4. Пуш в main запускает существующий workflow yandex-recrawl.yml автоматически.
 *
 * ВАЖНО: токен передавай только через переменную окружения, никогда не хранить в коде и не пушить в git.
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')
const REQUIRED_FIELDS = ['slug', 'title', 'description', 'publishedAt', 'bodyMarkdown', 'excerpt', 'cluster']

function run(cmd) {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

if (!fs.existsSync(BLOG_DIR)) {
  console.error(`Директория не найдена: ${BLOG_DIR}`)
  process.exit(1)
}

const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.json'))
if (files.length === 0) {
  console.error('В content/blog нет ни одного .json файла — публиковать нечего.')
  process.exit(1)
}

console.log(`Найдено файлов статей: ${files.length}`)

const articles = []
let hasErrors = false

for (const file of files) {
  const filePath = path.join(BLOG_DIR, file)
  let article
  try {
    article = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (e) {
    console.error(`✗ ${file}: невалидный JSON — ${e.message}`)
    hasErrors = true
    continue
  }

  const missing = REQUIRED_FIELDS.filter(key => !article[key])
  if (missing.length > 0) {
    console.error(`✗ ${file}: не хватает полей — ${missing.join(', ')}`)
    hasErrors = true
    continue
  }

  const expectedFilename = `${article.slug}.json`
  if (file !== expectedFilename) {
    console.error(`✗ ${file}: имя файла не совпадает со slug (ожидалось "${expectedFilename}")`)
    hasErrors = true
    continue
  }

  console.log(`✓ ${file} — "${article.title}"`)
  articles.push({ file, article })
}

if (hasErrors) {
  console.error('\nЕсть ошибки в статьях выше — публикация отменена. Исправь и запусти заново.')
  process.exit(1)
}

console.log('\nПроверка типов...')
run('npx tsc --noEmit')

console.log('Пробная сборка...')
run('npm run build')

console.log('\nКоммит и пуш всех статей разом...')
const token = process.env.GITHUB_TOKEN
const remote = token
  ? `https://${token}@github.com/pisyjones-max/platforma-next-v2.git`
  : null

run('git add content/blog src/app/sitemap.ts')

const commitTitle =
  articles.length === 1
    ? `blog: добавлена статья — ${articles[0].article.title}`
    : `blog: добавлено статей — ${articles.length}`
const commitBody = articles.map(a => `- ${a.article.title}`).join('\n')

fs.writeFileSync('.commit-msg-tmp.txt', `${commitTitle}\n\n${commitBody}\n`)
try {
  run('git commit -F .commit-msg-tmp.txt')
} catch {
  console.log('Нечего коммитить (файлы не изменились) — пропускаю коммит.')
} finally {
  fs.rmSync('.commit-msg-tmp.txt', { force: true })
}

if (remote) {
  run(`GIT_TERMINAL_PROMPT=0 git push ${remote} HEAD:main`)
} else {
  run('GIT_TERMINAL_PROMPT=0 git push origin HEAD:main')
}

console.log(`\nГотово. Опубликовано статей: ${articles.length}`)
for (const { article } of articles) {
  console.log(`  https://platforma-msk.ru/blog/${article.slug}`)
}
console.log('Пуш в main запустит yandex-recrawl.yml автоматически.')
