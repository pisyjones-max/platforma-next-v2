# Автоблог PLATFORMA

Раз в неделю (среда и четверг, около 09:00–12:00 МСК, время плавает) Action `Weekly blog articles`
берёт 1–2 темы из `content/blog-plan.json`, генерирует статьи, проверяет сборку,
коммитит в main и запускает деплой + пинг Яндекса.

## Запустить вручную
Actions → Weekly blog articles → Run workflow, ветка main. В поле count можно указать число статей.

## Добавить темы
Дописать объект в `content/blog-plan.json`:
{"topic": "Тема статьи", "cluster": "materials", "city": null, "status": "pending"}
cluster: materials | delivery | seasonal | comparison. city: название города или null.

## Как читать план
- status pending: ещё не написана
- status done: написана, есть slug и doneAt
- attempts: сколько раз генерация падала; после 3 попыток тема пропускается

## Если темы кончились
Action завершится с ошибкой. Добавь темы в план.

## Отключить
Actions → Weekly blog articles → меню ... → Disable workflow.

## Если статья плохая
Удалить файл content/blog/<slug>.json и закоммитить в main.
