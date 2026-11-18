# Автоблог PLATFORMA (режим «очередь»)

## Как это работает
- Готовые статьи лежат файлами в `content/blog-queue/*.json` (по алфавиту имён, поэтому нумерация 01-, 02-...).
- Action `Weekly blog from queue` (`.github/workflows/weekly-blog-queue.yml`) по средам и четвергам
  около 09:00-12:00 МСК (время плавает) берёт 2-3 статьи, переносит в `content/blog/`,
  ставит дату публикации, проверяет `tsc` и `npm run build`, коммитит в main
  и запускает `yandex-recrawl.yml` (деплой + пинг Яндекса и IndexNow).
- Если сборка упала, ничего не публикуется. Если slug уже есть в `content/blog/`, статья пропускается,
  существующие статьи не затираются.
- API-вариант (`weekly-blog.yml`, генерация через Anthropic API) сохранён, но без расписания:
  нужен ключ `ANTHROPIC_API_KEY` с деньгами на счету. Запускается только вручную.

## Запуск вручную (Termux)
gh workflow run weekly-blog-queue.yml --ref main -f count=1
gh run list --workflow=weekly-blog-queue.yml --limit 1

## Проверить очередь
ls ~/platforma-next-v2/content/blog-queue | wc -l

## Как попросить новую партию у Claude в чате
Написать: «ещё статей» (или «напиши N статей про <тема/город>»).
Claude присылает по одной команде на 1-2 статьи, каждая кладёт файл в `content/blog-queue/`.
Потом: git add content/blog-queue, коммит с [skip ci], push в main.

## Формат файла статьи
Поля: slug (латиница-через-дефис), title, description (до 160 символов), keywords (3-6),
cluster (materials | delivery | seasonal | comparison), city (название или null), excerpt,
bodyMarkdown (700-1200 слов, заголовки ##). publishedAt ставит скрипт.

## Правила написания (для Claude)
- Сначала изучать репозиторий, существующий код и статьи не переписывать и не затирать.
- Внутренние ссылки только на существующие страницы: /blog/<slug> (файл есть в content/blog),
  /dostavka/<город> (slug есть в src/lib/cities.ts), /catalog/group/krovlya и другие реальные адреса.
  После создания статей проверять ссылки командой с циклом ok/НЕТ.
- Не обещать конкретные цены, скидки и сроки, которых нет в данных. Не придумывать факты о складах.
- Города партнёрских складов (Москва, Пушкино, Серпухов, Иваново, Кинешма) пишутся как отгрузка со склада партнёра.
- Новые slug не должны совпадать с существующими в content/blog и content/blog-queue.
- Один шаг за раз: одна команда, пользователь присылает вывод. Пуш только после показа diff и согласия.
- В Termux нет /tmp: временные файлы класть в ~/ и удалять. Нужен Node (pkg install nodejs-lts).
- Деплой нежелателен: в коммитах с контентом очереди писать [skip ci].

## Города на сайте (страницы /dostavka/<slug>)
Свой склад/ближний круг: ramenskoe, novoharitonovo, gzhel, voskresensk, bronnitsy, zhukovskiy,
kratovo, ilyinskiy, rodniki, bykovo, sofyino, malahovka, udelnaya, tomilino, lyubertsy, domodedovo,
beloozerskiy, egorevsk, kolomna. Партнёрские: moskva, ivanovo, serpukhov, pushkino, kineshma.
Актуальный список: src/lib/cities.ts.

## Отключить / вернуть
Actions -> Weekly blog from queue -> меню ... -> Disable workflow.

## Если статья плохая
Удалить файл content/blog/<slug>.json и закоммитить в main.

## Если очередь кончилась
Action завершится с ошибкой (код 2). Попросить у Claude новую партию.
