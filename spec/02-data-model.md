# 02 — Модель данных

## Слой 1: каталог (статика из репозитория)

```ts
// src/entities/food/lib/ — types.ts + catalog.ts

export interface Food {
  /** Стабильный слаг. Задаётся один раз и НИКОГДА не меняется и не переиспользуется. */
  id: string
  /** Отображаемое название: «Рис с говядиной» */
  name: string
  /** Калорийность ОДНОЙ порции. Целое число. */
  kcal: number
  /** Имя файла в public/foods/. По соглашению — `${id}.webp` */
  photo: string
  /** Категория для фильтра на экране добавления */
  category: CategoryId
  /** Дополнительные слова для поиска: ['рис', 'говядина', 'мясо'] */
  tags?: string[]
  /** Блюдо больше не готовится: скрыто в выборе, но старые записи остаются валидными. */
  archived?: boolean
}

export const foods: Food[] = [
  { id: 'coffee-black',  name: 'Кофе чёрный',   kcal: 5,   photo: 'coffee-black.webp',  category: 'drinks' },
  { id: 'egg-boiled',    name: 'Яйцо варёное',  kcal: 78,  photo: 'egg-boiled.webp',    category: 'basics' },
  { id: 'rice-beef',     name: 'Рис с говядиной', kcal: 620, photo: 'rice-beef.webp',   category: 'meals', tags: ['рис', 'мясо'] },
]
```

Правила ведения каталога — в [03-catalog.md](03-catalog.md).

## Слой 2: личные данные (IndexedDB)

### Entry — запись дневника

```ts
export interface Entry {
  /** crypto.randomUUID() */
  id: string
  /** Локальная календарная дата, 'YYYY-MM-DD'. Ключ группировки по дням. */
  date: string
  /** epoch ms — момент создания, задаёт порядок внутри дня */
  createdAt: number
  /** Ссылка на каталог. Может указывать на удалённое блюдо. */
  foodId: string
  /** Количество порций. Целое >= 1. */
  qty: number

  /** СНАПШОТ калорийности одной порции на момент записи. */
  kcalPerPortion: number
  /** СНАПШОТ названия на момент записи. */
  name: string
}
```

Калорийность записи = `qty * kcalPerPortion`. Всегда считается от снапшота, никогда от каталога.

### Profile — профиль и цель

```ts
export type Sex = 'male' | 'female'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'veryHigh'
export type Goal = 'cut' | 'cutMild' | 'maintain' | 'bulkMild' | 'bulk'

export interface Profile {
  /** Всегда 'me' — в таблице ровно одна запись */
  id: 'me'
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: ActivityLevel
  goal: Goal

  /** Итоговая дневная норма в ккал — то, что показывается на главной */
  targetKcal: number
  /** true, если пользователь переопределил норму вручную и она не пересчитывается */
  targetOverridden: boolean

  createdAt: number
  updatedAt: number
}
```

### WeightRecord — история веса

```ts
export interface WeightRecord {
  id?: number          // автоинкремент
  date: string         // 'YYYY-MM-DD'
  kg: number
  createdAt: number
}
```

Экрана с графиком сейчас нет. Запись создаётся автоматически при каждом изменении `profile.weightKg` — чтобы к моменту появления весов история уже накопилась. Если за один день вес меняли несколько раз, запись за эту дату перезаписывается.

## Схема Dexie

```ts
// src/shared/db/index.ts
import type { Table } from 'dexie'
import type { Entry, Profile, WeightRecord } from './types'
import Dexie from 'dexie'

export type AppDatabase = Dexie & {
  entries: Table<Entry, string>
  profile: Table<Profile, string>
  weightLog: Table<WeightRecord, number>
}

export const db = new Dexie('calories-count') as AppDatabase

db.version(1).stores({
  entries: 'id, date, foodId',
  profile: 'id',
  weightLog: '++id, &date',
})
```

**Почему пересечение типов, а не подкласс Dexie.** Привычная запись `class AppDatabase extends Dexie { entries!: Table<Entry, string> }` в этом проекте ломается молча. При `useDefineForClassFields`, который включён в целевой конфигурации, объявление поля в подклассе выполняется **после** конструктора Dexie и затирает уже присвоенную таблицу на `undefined`. Сборка и типы при этом в порядке — падает рантайм на первом же запросе к базе. Объявление таблиц типом, а не полями класса, убирает эту возможность полностью: полей, которые можно затереть, просто нет.

Индексы:
- `date` — выборка дня и диапазона за неделю, основная операция приложения;
- `foodId` — подсчёт частоты использования для сортировки каталога;
- `&date` в `weightLog` — уникальность: одна запись веса на дату.

**Правило миграций.** Схема меняется только через `db.version(N).stores({...})` с `.upgrade()` при необходимости. Существующие версии не редактируются никогда — иначе у устройств, где база уже создана, схема разъедется с кодом.

## Инварианты

Три правила, нарушение которых ломает данные:

**1. Отображение никогда не читает калорийность из каталога.**
Лента дня, итог дня, недельная статистика — всё считается из `entry.kcalPerPortion`. Каталог обновляется деплоем без участия пользователя; если бы итоги считались из него, правка «риса» с 620 на 700 ккал переписала бы всю историю за прошлые месяцы задним числом.

**2. `foodId` может указывать в пустоту.**
Блюдо могли удалить из каталога между записью и просмотром. Любое обращение к каталогу по `foodId` — опциональное:

```ts
const food = foods.find((f) => f.id === entry.foodId)  // Food | undefined
// name и kcal берём из entry, фото — из food?.photo ?? заглушка
```

**3. `id` блюда не переиспользуется.**
Удалил `rice-beef` — этот слаг мёртв навсегда. Иначе старые записи начнут показывать фото другого блюда. Для «блюдо больше не готовлю» есть `archived: true` — это предпочтительный способ, удаление стоит оставить для явных ошибок.

## Работа с датами

День — **локальный календарный**, граница в полночь по времени устройства. Никакого UTC, никаких смещений «день начинается в 4 утра».

```ts
// src/shared/lib/date.ts
export function toDateKey(d: Date = new Date()): string {
  // 'YYYY-MM-DD' по локальному времени, БЕЗ toISOString()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
```

`toISOString().slice(0, 10)` использовать **нельзя**: он переводит в UTC, и в вечерние часы при положительном смещении даёт завтрашнюю дату.

Неделя — последние 7 календарных дней включая сегодня, а не «с понедельника». Для дневника скользящее окно информативнее.

## Экспорт и импорт

Единственная страховка от потери данных: на iOS система может вычистить IndexedDB, а `navigator.storage.persist()` в Safari не даёт гарантий.

```ts
interface Backup {
  version: 1
  exportedAt: string       // ISO
  profile: Profile | null
  entries: Entry[]
  weightLog: WeightRecord[]
}
```

Экспорт — скачивание `calories-count-YYYY-MM-DD.json`. Импорт — выбор файла, с явным выбором режима: **заменить всё** или **дополнить** (записи с существующим `id` пропускаются). Импорт всегда требует подтверждения с указанием количества записей в файле.

## Расширение до БЖУ

Заложено так, чтобы включение не потребовало миграции базы:

1. В `Food` добавляются опциональные `protein`/`fat`/`carbs` — заполняются постепенно, старые блюда остаются без них.
2. В `Entry` при добавлении БЖУ появятся такие же опциональные снапшот-поля. Старые записи останутся без них — по ним просто не будет статистики, что корректно.
3. В `Profile` добавятся целевые граммовки, вычисляемые от `targetKcal` и цели.

Каталог живёт в репозитории, поэтому шаг 1 — это правка TypeScript-файла, а не миграция данных пользователя. В этом и был смысл решения хардкодить каталог.
