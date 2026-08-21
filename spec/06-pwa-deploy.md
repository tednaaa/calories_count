# 06 — PWA и деплой

## Манифест

```ts
// vite.config.ts
VitePWA({
	registerType: "autoUpdate",
	includeAssets: ["favicon.svg", "apple-touch-icon.png"],
	manifest: {
		name: "Calories Count",
		short_name: "Calories",
		description: "Персональный счётчик калорий",
		lang: "ru",
		start_url: "/",
		scope: "/",
		display: "standalone",
		orientation: "portrait",
		background_color: "#0b0b0c",
		theme_color: "#0b0b0c",
		icons: [
			{ src: "/icons/192.png", sizes: "192x192", type: "image/png" },
			{ src: "/icons/512.png", sizes: "512x512", type: "image/png" },
			{
				src: "/icons/maskable-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable",
			},
		],
	},
	workbox: {
		globPatterns: ["**/*.{js,css,html,svg,png,webp,woff2}"],
		navigateFallback: "/index.html",
	},
});
```

`base` в Vite остаётся `'/'` — приложение живёт в корне кастомного домена. Именно ради этого домен и нужен: на служебном адресе GitHub Pages сайт лежал бы в `/<repo>/`, и префикс пришлось бы протаскивать в `base`, в `scope` манифеста, в service worker и в роутер.

`globPatterns` включает `webp` — фотографии блюд обязаны попасть в прекэш, иначе офлайн приложение окажется без картинок. Ориентир по объёму: 300 фото × ~50 КБ ≈ 15 МБ.

## Особенности iOS

- Установка возможна **только через Safari**: Поделиться → «На экран Домой». Chrome и Firefox на iOS этого не умеют. Системного предложения установки не будет, поэтому инструкция вынесена в настройки.
- В `index.html` нужны:

```html
<meta
	name="viewport"
	content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
/>
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta
	name="apple-mobile-web-app-status-bar-style"
	content="black-translucent"
/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- `viewport-fit=cover` вместе с `env(safe-area-inset-*)` в стилях — иначе нижняя панель уедет под домашнюю полосу.
- **Зум отключён целиком — и двойной тап, и щипок.** Экран добавления это сетка мелких целей вплотную, палец ходит по ней быстро и не всегда точно. Любой зум здесь оказывается промахом, а не намерением: масштаб уезжает, и следующий тап приходит не туда. Обычный довод против отключения — мелкий текст — тут не работает: читать в приложении нечего, фотографии и так миниатюры.
- **Одного способа не хватает, их три.** `maximum-scale=1, user-scalable=no` во вьюпорте гасит и щипок, и двойной тап: этому верит Chrome, а Safari — только в установленном PWA, но именно так приложение и открывается. Во вкладке Safari вьюпорт игнорируется, поэтому рядом лежат две подпорки: `preventDefault` на `gesturestart`/`gesturechange`/`gestureend` в `blockPinchZoom()` — это вебкитовские события щипка и единственный способ перехватить его во вкладке — и `touch-action: manipulation` на ссылках и кнопках против двойного тапа.
- **`touch-action` висит на кнопках и ссылках, а не на `html`.** Глобальное ограничение ломает поля ввода в установленном PWA на iOS: тап по полю не поднимает клавиатуру, писать нечем. Во вкладке браузера при этом всё работает, так что баг легко не заметить. Ограничивать всю страницу и незачем: двойной тап случается там, где по чему-то тапают, а тапать по абзацу текста в этом приложении незачем.
- **Поле ввода не зумит при фокусе,** пока его шрифт не меньше 16 px. `Input` из shonk-ui приходит с `text-base md:text-sm` ровно поэтому: 16 на телефоне, 14 на десктопе. Уменьшать его локально нельзя — Safari подтянет страницу к полю и обратно уже не отпустит.
- Фоновая синхронизация и периодические фоновые задачи на iOS недоступны. Приложению они и не нужны.

## Устойчивость хранилища

```ts
if (navigator.storage?.persist) {
	await navigator.storage.persist(); // best-effort
}
```

Запрашивается при каждом запуске из `main.ts`. Спецификация сначала говорила «один раз», но повторный вызов ничего не стоит и ничего не спрашивает, если разрешение уже выдано, — зато отказ или переустановка сами собой залечиваются при следующем открытии, а хранить флаг «уже спрашивали» негде, кроме той самой базы, которую мы и защищаем. На Android/Chrome это реально защищает IndexedDB от автоматической очистки. В Safari на iOS гарантий нет — система может вычистить хранилище установленного PWA.

Из этого следует ровно один вывод, уже заложенный в спецификацию: **экспорт в JSON входит в MVP, а не в «когда-нибудь»**. Разумная привычка — раз в месяц выгружать файл.

## Иконки

Генерируются скриптом `pnpm icons` из одного описания в `scripts/icons.ts` — рисунок повторяет кольцо прогресса с главного экрана. Результат коммитится: CI ничего не рисует, он только собирает.

| Файл                              | Зачем                                                           |
| --------------------------------- | --------------------------------------------------------------- |
| `public/favicon.svg`              | вкладка браузера                                                |
| `public/icons/192.png`, `512.png` | манифест                                                        |
| `public/icons/maskable-512.png`   | Android-адаптив, поэтому без скруглений — маску наложит система |
| `public/apple-touch-icon.png`     | 180 px, иконка на домашнем экране iPhone                        |

## Обновления

`registerType: 'autoUpdate'` — новый service worker берёт управление и страница перезагружается. Поскольку каталог блюд едет вместе со сборкой, это единственный механизм доставки новых блюд на телефон.

Здесь важен инвариант из [02-data-model.md](02-data-model.md): записи дневника хранят снапшот калорийности, поэтому приезжающее обновление каталога **не пересчитывает историю задним числом**.

## GitHub Pages

Публикация идёт из workflow, а не из ветки: `actions/upload-pages-artifact` забирает `dist/`, `actions/deploy-pages` выкладывает. Ветка `gh-pages` в репозитории не заводится, а коллизия с `public/` — папкой статических ассетов Vite — при таком способе не возникает вовсе: путь публикации указывается явно.

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches:
      - main
    tags:
      - v[0-9]+.[0-9]+.[0-9]+
  pull_request:

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/setup
      - run: pnpm lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/setup
      - run: pnpm test:unit

  pages:
    if: startsWith(github.ref, 'refs/tags/v')
    needs:
      - lint
      - test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    concurrency:
      group: pages
      cancel-in-progress: false
    steps:
      - uses: actions/checkout@v7
      - uses: ./.github/actions/setup
      - uses: actions/configure-pages@v6
      - run: pnpm build
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v5
```

```yaml
# .github/actions/setup/action.yml
name: Setup
description: Install pnpm, Node and project dependencies

runs:
  using: composite
  steps:
    - uses: pnpm/action-setup@v6

    - uses: actions/setup-node@v7
      with:
        node-version: 24.19.0
        cache: pnpm

    - run: pnpm install --frozen-lockfile
      shell: bash
```

- **Составное действие вместо YAML-якоря.** В GitHub Actions якорей нет, но есть локальные составные действия: установка описана один раз в `.github/actions/setup` и подключается из всех трёх джоб. Чтобы такое действие вообще нашлось, `actions/checkout` обязан идти первым шагом.
- **`pnpm/action-setup` без поля `version`** берёт номер из `packageManager` в `package.json` — версия по-прежнему живёт в одном месте. Заодно отпадает `npm install --global corepack@latest` из старой конфигурации: corepack здесь не участвует вообще, pnpm ставит само действие.
- **Кэш зависимостей** — `cache: pnpm` у `actions/setup-node`, ключ считается по `pnpm-lock.yaml`. Отдельная джоба `cache` не нужна.
- **`concurrency` вместо `interruptible`.** На уровне workflow группа привязана к ветке и гасит незаконченный прогон предыдущего коммита. Джоба `pages` переопределяет её на `group: pages` с `cancel-in-progress: false` — ровно тот же смысл, что был у `interruptible` на `lint` и `test`, но не на публикации.
- **Дубля «ветка + merge request» нет по построению.** `push` слушает только `main`, ветки под pull request'ом попадают в пайплайн через сам `pull_request`.
- **Публикует тег, а не ветка.** Фильтр `v[0-9]+.[0-9]+.[0-9]+` — это не регулярное выражение, а шаблон GitHub, где `+` означает «один и более предыдущий символ». Пуш в `main` прогоняет линт и тесты и ничего не выкладывает. Условие `if` на джобе всё равно нужно: workflow запускается и на ветке тоже.
- **Права выданы точечно.** По умолчанию `contents: read`, и только `pages` получает `pages: write` и `id-token: write` — последнее нужно `deploy-pages` для OIDC-токена, которым он подтверждает деплой.
- **`environment: github-pages`** обязателен для `deploy-pages`, а `url` из его вывода показывается ссылкой в интерфейсе прогона.
- **`actions/configure-pages`** читает настройки Pages и валит прогон рано и с понятной ошибкой, если публикация из Actions не включена. Сам он её не включает: у входа `enablement` по умолчанию `false`, и работает он только с отдельным токеном, а не с `GITHUB_TOKEN`. Один раз это делается руками в Settings → Pages → Source: GitHub Actions.

**SPA-fallback.** `_redirects` — механизм GitLab Pages и Netlify, GitHub Pages его не понимает. Его заменяет `404.html` в корне сайта: на любой несуществующий путь отдаётся он. Файл делается копией `index.html` — плагином `spa-fallback` в `vite.config.ts`, а не шагом в CI, чтобы локальная сборка совпадала с уезжающей.

Отдаётся такая страница со статусом 404, а не 200, и это единственное отличие от честного rewrite. Для приложения оно ничего не меняет: скрипты на 404-странице выполняются, роутер читает адрес и рисует нужный экран. После установки service worker'а прямые заходы до сервера вообще не доходят — их обслуживает `navigateFallback`.

`globIgnores: ['**/404.html']` в настройках workbox — чтобы копия `index.html` не легла в прекэш вторым экземпляром.

**Кастомный домен** настраивается в Settings → Pages → Custom domain, дальше DNS-запись у регистратора и автоматический сертификат Let's Encrypt. При публикации из workflow файл `CNAME` в репозитории **не создаётся и не читается** — домен хранится в настройках Pages. (При публикации из ветки всё наоборот, именно оттуда растёт привычка коммитить `CNAME`.)

HTTPS обязателен: без него service worker не зарегистрируется и PWA не установится.

## Релиз

Тег ставится не руками, а скриптом `pnpm release` (`scripts/release.ts`):

1. спрашивает, какой разряд поднять, и показывает получающийся номер;
2. поднимает `version` в `package.json` через `bumpp`;
3. собирает `CHANGELOG.md` из коммитов после предыдущего тега — заголовок из `subject`, тело коммита абзацем под ним, ссылка на коммит собирается из `remote.origin.url`, поэтому переезд между хостингами её не ломает; сами релизные коммиты из списка выкидываются;
4. делает коммит `chore: release vX.Y.Z` и останавливается, чтобы changelog можно было вычитать и поправить — правки доклеиваются в тот же коммит;
5. ставит аннотированный тег и пушит с `--follow-tags`.

Если что-то падает по дороге, `package.json` и `CHANGELOG.md` возвращаются в исходное состояние: половинчатого релиза не остаётся.

Номер версии на экране «О приложении» берётся из `version` в `package.json` — того самого поля, которое поднимает скрипт. Тег и показанная версия расходятся, только если тег поставлен руками в обход `pnpm release`.

## Проверка перед релизом

1. Lighthouse → раздел PWA: installable, офлайн-режим.
2. Режим «в самолёте» на установленном приложении: открывается, показывает фото, позволяет добавить запись.
3. Прямой заход на `/stats` в адресной строке — открывается нужный экран, а не страница ошибки.
4. Установка на iPhone через Safari, проверка отступов вокруг выреза и домашней полосы.
5. Деплой нового блюда → открытие приложения на телефоне → блюдо появилось, вчерашние итоги не изменились.
