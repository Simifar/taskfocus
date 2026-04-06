# 🎯 Переструктурирование Dashboard - План действий

## Текущее состояние
```
ONE HUGE COMPONENT:
┌─────────────────────────────┐
│      Dashboard.tsx          │
│  (all-in-one, 750+ lines)   │
│  - Header                   │
│  - Stats                    │
│  - Energy filter            │
│  - Task list                │
│  - Dialogs                  │
└─────────────────────────────┘
```

## Новая архитектура
```
src/
├── app/
│   └── dashboard/
│       └── page.tsx (просто wrapper)
│
├── components/dashboard/
│   ├── dashboard-layout.tsx      (основной layout)
│   ├── sidebar/
│   │   ├── dashboard-sidebar.tsx (левая панель)
│   │   └── sidebar-nav.tsx       (навигация)
│   │
│   ├── views/
│   │   ├── today-view.tsx        (ГЛАВНЫЙ ВИД)
│   │   ├── inbox-view.tsx        (быстрое добавление)
│   │   ├── week-view.tsx         (по дням)
│   │   ├── calendar-view.tsx     (календарь)
│   │   └── category-view.tsx     (по категориям)
│   │
│   ├── shared/
│   │   ├── energy-filter.tsx     (фильтр энергии)
│   │   ├── energy-status.tsx     (статус энергии)
│   │   ├── task-list-item.tsx    (строка задачи)
│   │   └── quick-add-form.tsx    (быстрое добавление)
│   │
│   └── header/
│       └── dashboard-header.tsx  (верхняя панель)
│
└── hooks/
    └── useDashboardState.ts      (состояние для всех компонентов)
```

---

## 📐 Структура компонентов

### 1️⃣ `dashboard-layout.tsx` (ROOT)
```typescript
export function DashboardLayout() {
  const [currentView, setCurrentView] = useState("today");
  const [currentEnergy, setCurrentEnergy] = useState(3);
  
  return (
    <div className="flex h-screen">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 flex flex-col">
        <Header currentView={currentView} />
        <Content currentView={currentView} currentEnergy={currentEnergy} />
      </main>
    </div>
  );
}
```

### 2️⃣ `dashboard-sidebar.tsx` (ЛЕВАЯ ПАНЕЛЬ)
```
┌──────────────────┐
│ 🧠 TaskFocus     │
│ 👤 John Doe      │← (clickable → /profile)
├──────────────────┤
│ 📥 Inbox         │← (badge: count)
│ 📅 Today         │← (highlighted if TODAY)
│ 📆 This Week     │
│ 🎯 Energy Focus  │
├──────────────────┤
│ MY LISTS         │
│ • Работа (3)     │
│ • Личное (5)     │
│ • Хобби (2)      │
│ + New List       │
├──────────────────┤
│ 📊 Stats         │
│ 🎨 Settings      │
│ 🚪 Logout        │
└──────────────────┘
```

### 3️⃣ `today-view.tsx` (ГЛАВНЫЙ ВИД)
```
┌─────────────────────────────────┐
│ 📅 Today (Sunday, April 6)       │
│ [Energy ↓] [Sort ↓]             │
├─────────────────────────────────┤
│                                  │
│ ⚡ YOUR ENERGY NOW              │
│ 🔋 ████░░░░░░░░░░░░ 3/5        │
│ "You can tackle 3 tasks!"       │
│                                  │
│ 🎯 FOCUS ON (MAX 3)              │
│ ○ Task 1 [Energy 2] [15min]      │
│ ○ Task 2 [Energy 3] [30min]      │
│ ○ Task 3 [Energy 4] [45min]      │
│                                  │
│ ✓ COMPLETED (2)                  │
│ ✓ Finished task A                │
│ ✓ Finished task B                │
│                                  │
│ 💪 Progress: 2/5 (40%)           │
│ "Keep the momentum!"             │
│                                  │
└─────────────────────────────────┘
```

### 4️⃣ `inbox-view.tsx` (БЫСТРОЕ ДОБАВЛЕНИЕ)
```
┌─────────────────────────────────┐
│ 📥 Inbox (5 quick items)        │
│ [Process All] [Clear Done]      │
├─────────────────────────────────┤
│                                  │
│ + New task                       │
│ [Input field]                    │
│                                  │
│ [Existing unprocessed tasks]     │
│ ○ Task 1                         │
│   [Assign to Today]              │
│   [Assign to This Week]          │
│   [No Date]                      │
│   [❌ Delete]                    │
│                                  │
│ ○ Task 2                         │
│   [Quick assign buttons]         │
│                                  │
└─────────────────────────────────┘
```

### 5️⃣ `week-view.tsx` (ПО ДНЯМ)
```
┌─────────────────────────────────┐
│ 📆 This Week (Apr 6-12)         │
│ Mon(1) | Tue(3) | Wed(2) | ...  │
├─────────────────────────────────┤
│                                  │
│ 📍 MON, APR 6 (TODAY)            │
│ ○ Task 1 [Energy 2]              │
│ ✓ Task 2 [Energy 3]              │
│                                  │
│ 📍 TUE, APR 7                    │
│ ○ Task 3 [Energy 4]              │
│ ○ Task 4 [Energy 2]              │
│ ○ Task 5 [Energy 3]              │
│                                  │
│ 📍 WED, APR 8                    │
│ ○ Task 6 [Energy 1]              │
│ ○ Task 7 [Energy 2]              │
│                                  │
└─────────────────────────────────┘
```

### 6️⃣ `calendar-view.tsx` (КАЛЕНДАРЬ)
```
┌─────────────────────────────────┐
│ 📅 Calendar (April 2026)        │
├─────────────────────────────────┤
│  Sun Mon Tue Wed Thu Fri Sat    │
│                 1   2   3       │
│           [0] [3] [2]           │
│   4   5   6   7   8   9  10     │
│ [2] [1] [3] [1] [0] [2]  [1]    │
│                                  │
│ Click day → Day view             │
│ Цвет интенсивности = кол-во    │
│ 🟢 1-2  | 🟡 3-4 | 🔴 5+        │
│                                  │
└─────────────────────────────────┘
```

---

## 🔄 State Management

Создам `useDashboardState.ts` для управления состоянием:

```typescript
export interface DashboardState {
  currentView: "today" | "inbox" | "week" | "calendar" | "category";
  currentCategory?: string;
  currentEnergy: number | null;
  searchQuery: string;
  sortBy: "energy" | "priority" | "dueDate";
  showCompleted: boolean;
}

export function useDashboardState() {
  const [state, setState] = useState<DashboardState>({...});
  
  return {
    views: {
      setView: (view) => setState({...state, currentView: view}),
    },
    filters: {
      setEnergy: (level) => setState({...state, currentEnergy: level}),
      setSearch: (q) => setState({...state, searchQuery: q}),
    },
    sort: {
      setSortBy: (sort) => setState({...state, sortBy: sort}),
    },
  };
}
```

---

## 🛠️ Этапы разработки

### День 1: Рефакторинг структуры
- [ ] Создать `dashboard-layout.tsx`
- [ ] Создать `dashboard-sidebar.tsx`
- [ ] Выделить состояние в `useDashboardState.ts`
- [ ] Перенести общие компоненты в `shared/`

### День 2: View компоненты
- [ ] `today-view.tsx` (PRIORITY 1)
- [ ] `inbox-view.tsx` (PRIORITY 1)
- [ ] `week-view.tsx` (PRIORITY 2)

### День 3: Доп фичи
- [ ] `calendar-view.tsx` (PRIORITY 3)
- [ ] `category-view.tsx` (PRIORITY 3)

---

## 🎯 Преимущества новой структуры

✅ **Modularity** — каждый view независимый  
✅ **Reusability** — общие компоненты в `shared/`  
✅ **Maintainability** — легко находить код  
✅ **Testability** — каждый компонент тестируется отдельно  
✅ **Scalability** — легко добавлять новые views  

---

## ⚠️ Что сохраняется

- ✅ Profile page
- ✅ Drag-and-drop
- ✅ Stats charts
- ✅ Archive functionality
- ✅ Все API endpoints

---

## 🚀 Начинаем с Monday Night Edition?

Предлагаю начать с **День 1: Структура + Sidebar + Today View**

Готов? 🎯
