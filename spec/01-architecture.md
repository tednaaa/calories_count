# 01 — Архитектура

## Стек

| Слой | Выбор | Почему именно так |
|---|---|---|
| Фреймворк | **Vue 3** (Composition API, `<script setup>`) | У проекта есть собственный UI kit на npm, написанный только под Vue. Это решающий аргумент |
| Язык | **TypeScript** | Каталог блюд ведётся руками в коде — типы ловят опечатку в поле и дубль `id` до коммита |
| Сборка | **Vite** | — |
| Роутинг | **vue-router** (history mode) | 5 экранов |
| Хранилище | **Dexie** поверх IndexedDB | Тонкая обёртка, чтобы не писать сырые транзакции. Есть `liveQuery` |
| Стили | **Tailwind** | — |
| PWA | **vite-plugin-pwa** (Workbox) | Манифест, service worker, прекэш |
| UI | собственный UI kit из npm | — |
| Хостинг | **GitLab Pages** + кастомный домен | См. [06-pwa-deploy.md](06-pwa-deploy.md) |

## Почему Vue, а не Svelte

Помимо UI kit, стоит зафиксировать цифры, чтобы к вопросу не возвращаться.

Vue 3 с Vite и tree-shaking: **~16 КБ gzip** на минимальном приложении, **~27 КБ** если задействовать вообще все возможности фреймворка. Svelte — единицы килобайт рантайма, но скомпилированный код каждого компонента крупнее, поэтому с ростом их числа разрыв сокращается. На пяти экранах реальная разница — 10–15 КБ.

Это PWA: после установки всё лежит в кэше service worker'а и по сети не запрашивается вообще. 15 КБ единоразово против переписывания всего UI kit — вопрос закрыт.

**Про «лёгкие версии» Vue.** Существуют две разные вещи, их легко перепутать:

- **petite-vue** (~6 КБ, без сборки) — для оживления серверного HTML, замена Alpine.js. Не поддерживает SFC, роутер, и сторонние компонентные библиотеки. Нам не подходит.
- **Vapor Mode** — компиляция шаблонов в прямые DOM-операции минуя virtual DOM, ровно тот подход, за счёт которого быстр Svelte. Это фича **Vue 3.6**, которая на момент написания находится в бете (`3.6.0-beta.3`). В основу проекта не берём. Включается покомпонентно (`<script setup vapor>`) и совместим с обычным Vue через `vaporInteropPlugin` — то есть это апгрейд на будущее, а не архитектурная развилка сейчас.

## Почему нет Pinia

Единственный источник правды — IndexedDB. Глобальный стор поверх неё был бы вторым источником, который надо руками держать в синхроне: записал приём пищи → обнови базу → не забудь обновить стор → не забудь пересчитать итог дня.

Вместо этого используется `liveQuery` из Dexie: реактивная подписка на запрос, которая сама переизлучает результат при любом изменении затронутых таблиц. Компонент подписывается на «записи за сегодня» и перерисовывается сам.

Чтобы не тащить rxjs ради `useObservable` из `@vueuse/rxjs`, пишем свой композабл на 15 строк:

```ts
// src/composables/useLiveQuery.ts
import { liveQuery } from 'dexie'
import { ref, onScopeDispose, type Ref } from 'vue'

export function useLiveQuery<T>(querier: () => T | Promise<T>, initial: T): Ref<T> {
  const value = ref(initial) as Ref<T>
  const subscription = liveQuery(querier).subscribe({
    next: (result) => { value.value = result },
    error: (err) => console.error('[liveQuery]', err),
  })
  onScopeDispose(() => subscription.unsubscribe())
  return value
}
```

Использование:

```ts
const entries = useLiveQuery(() => db.entries.where('date').equals(today()).toArray(), [])
```

Локальное UI-состояние (содержимое корзины на экране добавления, открытые модалки) живёт в обычных `ref` внутри компонентов и в базу не попадает до подтверждения.

## Структура проекта

```
spec/                       — эта спецификация
scripts/
  optimize-foods.mjs        — сжатие фотографий блюд перед коммитом
raw-photos/                 — исходники с телефона, в сборку не идут (.gitignore)
public/
  foods/                    — оптимизированные фото, <food-id>.webp
  icons/                    — иконки PWA
  _redirects                — SPA-fallback для GitLab Pages
src/
  data/
    foods.ts                — КАТАЛОГ: захардкоженный список блюд
    categories.ts           — справочник категорий
  db/
    index.ts                — экземпляр Dexie, схема, версии
    types.ts                — Entry, Profile, WeightRecord
  domain/
    calories.ts             — Mifflin-St Jeor, TDEE, цели
    date.ts                 — локальная календарная дата, границы дня/недели
  composables/
    useLiveQuery.ts
    useProfile.ts
    useToday.ts
    useFrequentFoods.ts
  components/
  views/
    OnboardingView.vue
    TodayView.vue
    AddView.vue
    StatsView.vue
    SettingsView.vue
  router/index.ts
  main.ts
.gitlab-ci.yml
vite.config.ts
```

## Разделение ответственности

Два слоя данных, которые нельзя смешивать:

**Статика из репозитория** — `src/data/foods.ts` и `public/foods/*.webp`. Read-only в рантайме, обновляется только деплоем, одинакова на всех устройствах.

**Личные данные устройства** — IndexedDB. Пишется только приложением, никогда не покидает телефон, у каждого устройства своя.

Граница между ними проходит по одному правилу, описанному в [02-data-model.md](02-data-model.md): **запись дневника хранит снапшот калорийности, а не ссылку на неё**. Без этого правила правка каталога переписывала бы историю задним числом при каждом деплое.
