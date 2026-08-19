# 06 — PWA и деплой

## Манифест

```ts
// vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
  manifest: {
    name: 'Calories Count',
    short_name: 'Calories',
    description: 'Персональный счётчик калорий',
    lang: 'ru',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b0b0c',
    theme_color: '#0b0b0c',
    icons: [
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
    navigateFallback: '/index.html',
  },
})
```

`base` в Vite остаётся `'/'` — приложение живёт в корне кастомного домена. Именно ради этого домен и нужен: на служебном адресе GitLab Pages сайт лежал бы в `/<project>/`, и префикс пришлось бы протаскивать в `base`, в scope service worker'а и в роутер.

`globPatterns` включает `webp` — фотографии блюд обязаны попасть в прекэш, иначе офлайн приложение окажется без картинок. Ориентир по объёму: 300 фото × ~50 КБ ≈ 15 МБ.

## Особенности iOS

- Установка возможна **только через Safari**: Поделиться → «На экран Домой». Chrome и Firefox на iOS этого не умеют. Системного предложения установки не будет, поэтому инструкция вынесена в настройки.
- В `index.html` нужны:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

- `viewport-fit=cover` вместе с `env(safe-area-inset-*)` в стилях — иначе нижняя панель уедет под домашнюю полосу.
- Фоновая синхронизация и периодические фоновые задачи на iOS недоступны. Приложению они и не нужны.

## Устойчивость хранилища

```ts
if (navigator.storage?.persist) {
  await navigator.storage.persist()   // best-effort
}
```

Запрашивается один раз при первом запуске. На Android/Chrome это реально защищает IndexedDB от автоматической очистки. В Safari на iOS гарантий нет — система может вычистить хранилище установленного PWA.

Из этого следует ровно один вывод, уже заложенный в спецификацию: **экспорт в JSON входит в MVP, а не в «когда-нибудь»**. Разумная привычка — раз в месяц выгружать файл.

## Обновления

`registerType: 'autoUpdate'` — новый service worker берёт управление и страница перезагружается. Поскольку каталог блюд едет вместе со сборкой, это единственный механизм доставки новых блюд на телефон.

Здесь важен инвариант из [02-data-model.md](02-data-model.md): записи дневника хранят снапшот калорийности, поэтому приезжающее обновление каталога **не пересчитывает историю задним числом**.

## GitLab Pages

**Ключевой нюанс.** По умолчанию GitLab Pages публикует папку с именем `public`. У Vite `public/` — это папка статических ассетов, где лежат фотографии блюд. Прямая коллизия. Решается указанием директории публикации явно:

```yaml
# .gitlab-ci.yml
image: node:24

stages:
  - build

create-pages:
  stage: build
  script:
    - npm ci
    - npm run lint
    - npm run test:unit
    - npm run build
  pages:
    publish: dist
  artifacts:
    paths:
      - dist
  rules:
    - if: $CI_COMMIT_BRANCH == $CI_DEFAULT_BRANCH
```

Начиная с GitLab 17.10 значение `pages.publish` автоматически добавляется в `artifacts:paths`, но явное указание не мешает и работает на более старых версиях.

**SPA-fallback.** Файл `public/_redirects` (Vite скопирует его в `dist/`):

```
/* /index.html 200
```

Статус 200 — это честный rewrite, а не редирект. Без него прямой заход на `/stats` или обновление страницы вернёт 404, потому что такого файла на диске нет.

**Кастомный домен** настраивается в Settings → Pages: добавляется домен, GitLab выдаёт TXT-запись для верификации владения и целевой адрес для A/CNAME. Сертификат Let's Encrypt выпускается автоматически. Файл `CNAME` в репозитории — это механизм GitHub Pages, на GitLab он не нужен и игнорируется.

HTTPS обязателен: без него service worker не зарегистрируется и PWA не установится.

## Проверка перед релизом

1. Lighthouse → раздел PWA: installable, офлайн-режим.
2. Режим «в самолёте» на установленном приложении: открывается, показывает фото, позволяет добавить запись.
3. Прямой заход на `/stats` в адресной строке — не 404.
4. Установка на iPhone через Safari, проверка отступов вокруг выреза и домашней полосы.
5. Деплой нового блюда → открытие приложения на телефоне → блюдо появилось, вчерашние итоги не изменились.
