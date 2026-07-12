#!/usr/bin/env node
/**
 * Публикация статьи блога PLATFORMA.
 *
 * Использование:
 *   node scripts/publish-article.mjs content/blog/moya-statya.json
 *
 * Что делает:
 *   1. Проверяет, что JSON статьи валиден и slug совпадает с именем файла.
 *   2. npx tsc --noEmit + npm run build — не даёт запушить то, что не соберётся.
 *   3. git add/commit/push в main через токен из переменной окружения GITHUB_TOKEN
 *      (или через уже настроенный git remote, если токен не передан).
 *   4. Пуш в main сам по себе запускает существующий workflow yandex-recrawl.yml —
 *      отдельно дёргать переобход не нужно.
 *
 * ВАЖНО: токен никогда не хранится в коде. Передавай его через переменную окружения:
 *   GITHUB_TOKEN=ghp_xxx node scripts/publish-article.mjs content/blog/moya-statya.json
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const articlePathArg = process.argv[2]
if (!articlePathArg) {
  console.error('Укажи путь к JSON-файлу статьи: node scripts/publish-article.mjs content/blog/slug.json')
  process.exit(1)
}

const articlePath = path.resolve(process.cwd(), articlePathArg)
if (!fs.existsSync(articlePath)) {
  console.error(`Файл не найден: ${articlePath}`)
  process.exit(1)
}

const article = JSON.parse(fs.readFileSync(articlePath, 'utf-8'))

const required = ['slug', 'title', 'description', 'publishedAt', 'bodyMarkdown', 'excerpt', 'cluster']
for (const key of required) {
  if (!article[key]) {
    console.error(`В статье не хватает обязательного поля "${key}"`)
    process.exit(1)
  }
}

const expectedFilename = `${article.slug}.json`
if (path.basename(articlePath) !== expectedFilename) {
  console.error(`Имя файла должно совпадать со slug: ожидалось "${expectedFilename}", получено "${path.basename(articlePath)}"`)
  process.exit(1)
}

const targetPath = path.join(process.cwd(), 'content', 'blog', expectedFilename)
if (path.resolve(targetPath) !== articlePath) {
  fs.copyFileSync(articlePath, targetPath)
  console.log(`Скопировано в ${targetPath}`)
}

function run(cmd) {
  console.log(`\n$ ${cmd}`)
  execSync(cmd, { stdio: 'inherit' })
}

console.log('Проверка типов...')
run('npx tsc --noEmit')

console.log('Пробная сборка...')
run('npm run build')

console.log('Коммит и пуш...')
const token = process.env.GITHUB_TOKEN
const remote = token
  ? `https://${token}@github.com/pisyjones-max/platforma-next-v2.git`
  : null

run(`git add content/blog/${expectedFilename} src/app/sitemap.ts`)
try {
  run(`git commit -m "blog: добавлена статья — ${article.title}"`)
} catch {
  console.log('Нечего коммитить (файл не изменился) — пропускаю коммит.')
}

if (remote) {
  run(`GIT_TERMINAL_PROMPT=0 git push ${remote} HEAD:main`)
} else {
  run(`GIT_TERMINAL_PROMPT=0 git push origin HEAD:main`)
}

console.log(`\nГотово: https://platforma-msk.ru/blog/${article.slug}`)
console.log('Пуш в main запустит yandex-recrawl.yml автоматически.')
