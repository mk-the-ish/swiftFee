# SwiftFee Copilot Instructions

## Project Overview

**SwiftFee Manager** is a Next.js + TypeScript school fee management system with desktop support via Electron. It manages student records, fee payments, banking transactions, and financial reports with a local SQLite database backend.

**Tech Stack:**
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI components
- **Database:** SQLite (better-sqlite3) with a Firestore-like wrapper
- **Desktop:** Electron for offline-first desktop application
- **Auth:** Session-based with scrypt password hashing

---

## Architecture & Data Flow

### 1. Context-Based State Management

The app uses **two React Context providers** (in `src/components/providers.tsx`):

- **AuthContext** (`src/context/auth-context.tsx`): Handles user authentication
  - Methods: `signIn()`, `signUp()`, `signOut()`
  - Stores user in `localStorage` as `swiftfee_user`
  - Session persists across page reloads

- **AppContext** (`src/context/app-context.tsx`): Manages all app data
  - Loads collections: `students`, `payments`, `bankAccounts`, `transactions`, `notes`
  - Provides both data and mutation functions (add/update/delete)
  - Uses batch writes for bulk operations (`bulkBillStudents`, `bulkUpgradeGrades`)

**Key pattern:** Always access data via context hooks, never directly from DB. This ensures UI updates properly.

### 2. Database Layer (SQLite Wrapper)

`src/db/local-service.ts` provides a **Firestore-like API** that wraps SQLite:

```typescript
// Single documents table: documents(collection, id, data)
db.collection('students').doc('MP2501').set(studentData)
db.collection('payments').add(paymentData)  // Auto-generates ID
db.batch().update(...).commit()
```

**Key details:**
- All data stored as JSON strings in a single `documents` table
- `db.collection(name).findOne(field, value)` for queries (filters in memory)
- WriteBatch supports transactional operations
- Use `eval('require')` trick for Webpack—don't bundle better-sqlite3

### 3. Data Models

See `src/lib/types.ts` for authoritative type definitions:

- **Student:** Grades (R, ECD A/B, 1-7), Classes (10 colors), status (active/graduated/transferred/entrant)
- **Payment:** Links student → amount, tracks method (Cash/Bank Transfer/Ecocash), deposited status
- **Transaction:** Banking events (incoming/outgoing), auto-categorized
- **Exchange Rate:** Single doc in settings collection for USD/ZWG conversion

**Important:** Student IDs are generated as `MP{GraduationYear}{ClassCode}{StudentIndex}` (e.g., `MP2501001`).

---

## Critical Developer Workflows

### Build & Run

```powershell
# Development
npm run dev              # Runs Next.js dev server on port 3000

# Production build & desktop
npm run build            # Next.js static build
npm start                # Serves optimized build
npm run electron         # Bundles Next.js, launches Electron app
```

### Database Setup

- **File location:** `./swiftfee.db` (SQLite database file)
- **Initialization:** Automatic in `getDB()` if missing—creates `documents` table and WAL mode
- **Schema:** Flexible—no predefined columns, just JSON storage per collection

---

## UI & Component Patterns

### Radix UI Components

Use pre-built components from `src/components/ui/`:
- **Form:** `Dialog` + `DialogContent` for modals (see `AddStudentForm`)
- **Table:** `Table`, `TableRow`, `TableCell` for data display (e.g., students list)
- **Input/Select:** Standard form controls with Zod validation
- **Badge:** Status labels (active/graduated)

**Example pattern:** Wrap form in `Dialog` with `DialogTrigger` button.

### Page Structure

1. **Layout:** `src/app/(app)/layout.tsx` provides sidebar navigation (hidden on mobile, sheet on mobile)
2. **Pages:** Each page (students, payments, etc.) is a client component (`'use client'`)
3. **Hooks:** `useAppContext()` for data, `useAuth()` for user
4. **Filtering/Sorting:** Use `useMemo` for client-side filtering (see students page)

### Styling

- **Tailwind CSS** with custom colors in `tailwind.config.ts`
- **CSS modules:** Use `@apply` for reusable classes
- **Responsive:** Mobile-first, use `sm:` breakpoints

---

## Common Patterns & Conventions

### Adding Data to Context

1. **Fetch in component:** `const { students, addStudent } = useAppContext()`
2. **Mutation:** Call `addStudent(data)` directly—updates are automatic
3. **Polling:** `useLocalCollection()` hooks poll DB every 2 seconds (not production-grade)

### Bulk Operations & Batching

Use `db.batch()` for multiple operations atomically:

```typescript
const batch = db.batch();
students.forEach(s => {
  batch.update(db.collection('students').doc(s.id), { grade: newGrade });
});
await batch.commit();
```

### Password & Auth

- **Hashing:** Use `hashPassword()` from `src/lib/auth.ts` (scrypt with random salt)
- **Verification:** `verifyPassword(plain, hash, salt)` compares hashes
- **User table:** `users` collection stores `id`, `email`, `passwordHash`, `salt`

### Routing & Navigation

- **Sidebar routes:** Defined in `src/app/(app)/layout.tsx` as `navItems` array
- **Protected routes:** Wrap layout logic checks if `user` exists, redirects to `/login`
- **Sub-routes:** Use file structure (e.g., `students/view/page.tsx` for student detail)

---

## Integration Points & Dependencies

- **Firebase Studio:** This is a Firebase Studio starter—docs at `docs/blueprint.md`
- **Electron:** Main process in `main.js`, preload in `preload.js`
- **External APIs:** Exchange rate is manual (set via context), no live API calls in current build
- **Icons:** Lucide React for all UI icons

---

## Known Limitations & Gotchas

1. **Polling instead of reactivity:** `useLocalCollection` polls every 2 seconds. For production, implement event emitter in `local-service.ts`.
2. **In-memory queries:** `findOne()` loads all docs then filters. Not scalable for >10k records.
3. **No migration system:** Schema changes require manual SQLite updates.
4. **localStorage for session:** No HttpOnly cookies. Suitable only for local/desktop app.
5. **Electron renderer process:** Must load better-sqlite3 via `eval('require')` to avoid Webpack bundling issues.

---

## File Reference Guide

| File | Purpose |
|------|---------|
| `src/context/app-context.tsx` | Core app state & mutations |
| `src/context/auth-context.tsx` | User auth & session |
| `src/db/local-service.ts` | SQLite Firestore wrapper |
| `src/hooks/use-local-db.ts` | React hooks for DB polling |
| `src/lib/types.ts` | All TypeScript type definitions |
| `src/lib/auth.ts` | Password hashing utilities |
| `src/components/ui/add-student-form.tsx` | Student creation form example |
| `src/app/(app)/layout.tsx` | App shell with sidebar |
| `tailwind.config.ts` | Design tokens |

---

## When Adding Features

- **New data model?** Add type to `src/lib/types.ts`, then collection methods to `AppContext`
- **New page?** Create in `src/app/(app)/new-feature/page.tsx`, add to `navItems` in layout
- **New form?** Reuse Radix UI components, validate with Zod, wrap in Dialog
- **New DB query?** Add method to `CollectionRef` or `AppContext` (keep logic in context, not pages)

