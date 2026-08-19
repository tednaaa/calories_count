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

`base` в Vite остаётся `'/'` — приложение живёт в корне кастомного домена. Именно ради этого домен и нужен: на служебном адресе GitLab Pages сайт лежал бы в `/<project>/`, и префикс пришлось бы протаскивать в `base`, в scope service worker'а и в роутер.

`globPatterns` включает `webp` — фотографии блюд обязаны попасть в прекэш, иначе офлайн приложение окажется без картинок. Ориентир по объёму: 300 фото × ~50 КБ ≈ 15 МБ.

## Особенности iOS

- Установка возможна **только через Safari**: Поделиться → «На экран Домой». Chrome и Firefox на iOS этого не умеют. Системного предложения установки не будет, поэтому инструкция вынесена в настройки.
- В `index.html` нужны:

```html
<meta
	name="viewport"
	content="width=device-width, initial-scale=1, viewport-fit=cover"
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

Генерируются скриптом `pnpm icons` из одного описания в `scripts/icons.mjs` — рисунок повторяет кольцо прогресса с главного экрана. Результат коммитится: CI ничего не рисует, он только собирает.

| Файл                            | Зачем                                                        |
| ------------------------------- | ------------------------------------------------------------ |
| `public/favicon.svg`            | вкладка браузера                                             |
| `public/icons/192.png`, `512.png` | манифест                                                 |
| `public/icons/maskable-512.png` | Android-адаптив, поэтому без скруглений — маску наложит система |
| `public/apple-touch-icon.png`   | 180 px, иконка на домашнем экране iPhone                     |

## Обновления

`registerType: 'autoUpdate'` — новый service worker берёт управление и страница перезагружается. Поскольку каталог блюд едет вместе со сборкой, это единственный механизм доставки новых блюд на телефон.

Здесь важен инвариант из [02-data-model.md](02-data-model.md): записи дневника хранят снапшот калорийности, поэтому приезжающее обновление каталога **не пересчитывает историю задним числом**.

## GitLab Pages

**Ключевой нюанс.** По умолчанию GitLab Pages публикует папку с именем `public`. У Vite `public/` — это папка статических ассетов, где лежат фотографии блюд. Прямая коллизия. Решается указанием директории публикации явно:

```yaml
# .gitlab-ci.yml
workflow:
  auto_cancel:
    on_new_commit: interruptible
  rules:
    - if: $CI_COMMIT_TAG
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUESTS
      when: never
    - if: $CI_COMMIT_BRANCH

stages:
  - lint
  - test
  - release

.node_base: &node_base
  image: node:24.19.0
  before_script:
    - npm install --global corepack@latest
    - corepack enable
    - pnpm config set store-dir .pnpm-store
    - pnpm install --frozen-lockfile
  cache:
    key:
      files:
        - pnpm-lock.yaml
    paths:
      - .pnpm-store

lint:
  <<: [*node_base]
  stage: lint
  interruptible: true
  script:
    - pnpm lint

test:
  <<: [*node_base]
  stage: test
  interruptible: true
  script:
    - pnpm test:unit

pages:
  <<: [*node_base]
  stage: release
  rules:
    - if: '$CI_COMMIT_TAG =~ /^v(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/'
  script:
    - pnpm build
  pages:
    publish: dist
  artifacts:
    paths:
      - dist
```

Начиная с GitLab 17.10 значение `pages.publish` автоматически добавляется в `artifacts:paths`, но явное указание не мешает и работает на более старых версиях.

Схема пайплайна повторяет соседние проекты, чтобы не держать в голове два разных набора привычек:

- **`workflow` с `auto_cancel: on_new_commit: interruptible`** — пуш в ветку гасит незаконченный прогон предыдущего коммита. Правила заодно убирают дубль «ветка + merge request»: пока по ветке открыт MR, пайплайн на саму ветку не запускается.
- **Якорь `.node_base`** — образ, corepack, стор pnpm и установка зависимостей описаны один раз.
- **`npm install --global corepack@latest`** — в образе `node:24` лежит старый corepack, который спотыкается о проверку подписей у свежих версий pnpm.
- **`corepack prepare` не нужен**: точная версия зафиксирована полем `packageManager` в `package.json`, и corepack берёт её оттуда. Дублировать номер в двух местах — значит однажды их разъехать.
- **Стадии `lint → test → release`** — публикация не начнётся, пока не прошли проверки. `lint` и `test` помечены `interruptible`, публикация — нет: её прерывать на полпути незачем.
- **Публикует тег, а не ветка.** Джоба `pages` запускается только на теге вида `v1.2.3`. Пуш в `main` прогоняет линт и тесты, но ничего не выкладывает, поэтому недописанное состояние не уезжает на телефон само по себе. Правило `- if: $CI_COMMIT_TAG` в `workflow` обязательно: без него пайплайн на тег вообще не запустится, и джоба со своим правилом никогда не получит шанса.

**SPA-fallback.** Файл `public/_redirects` (Vite скопирует его в `dist/`):

```
/* /index.html 200
```

Статус 200 — это честный rewrite, а не редирект. Без него прямой заход на `/stats` или обновление страницы вернёт 404, потому что такого файла на диске нет.

**Кастомный домен** настраивается в Settings → Pages: добавляется домен, GitLab выдаёт TXT-запись для верификации владения и целевой адрес для A/CNAME. Сертификат Let's Encrypt выпускается автоматически. Файл `CNAME` в репозитории — это механизм GitHub Pages, на GitLab он не нужен и игнорируется.

HTTPS обязателен: без него service worker не зарегистрируется и PWA не установится.

## Релиз

Тег ставится не руками, а скриптом `pnpm release` (`scripts/release.ts`):

1. спрашивает, какой разряд поднять, и показывает получающийся номер;
2. поднимает `version` в `package.json` через `bumpp`;
3. собирает `CHANGELOG.md` из коммитов после предыдущего тега — заголовок из `subject`, тело коммита абзацем под ним, ссылка на коммит в GitLab; сами релизные коммиты из списка выкидываются;
4. делает коммит `chore: release vX.Y.Z` и останавливается, чтобы changelog можно было вычитать и поправить — правки доклеиваются в тот же коммит;
5. ставит аннотированный тег и пушит с `--follow-tags`.

Если что-то падает по дороге, `package.json` и `CHANGELOG.md` возвращаются в исходное состояние: половинчатого релиза не остаётся.

Номер версии на экране «О приложении» берётся из `version` в `package.json` — того самого поля, которое поднимает скрипт. Тег и показанная версия расходятся, только если тег поставлен руками в обход `pnpm release`.

## Проверка перед релизом

1. Lighthouse → раздел PWA: installable, офлайн-режим.
2. Режим «в самолёте» на установленном приложении: открывается, показывает фото, позволяет добавить запись.
3. Прямой заход на `/stats` в адресной строке — не 404.
4. Установка на iPhone через Safari, проверка отступов вокруг выреза и домашней полосы.
5. Деплой нового блюда → открытие приложения на телефоне → блюдо появилось, вчерашние итоги не изменились.
