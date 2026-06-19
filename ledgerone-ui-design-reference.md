# LedgerOne UI Layout & Design Reference

> Comprehensive documentation of every page layout, design tokens, component patterns, and theme behavior for the LedgerOne frontend.

---

## Table of Contents
1. [Design System](#design-system)
2. [Global Components](#global-components)
3. [Theme System](#theme-system)
4. [Page Layouts](#page-layouts)
   - Landing Page (`/`)
   - Login (`/login`)
   - Register (`/register`)
   - Dashboard (`/dashboard`)
   - Invoices (`/invoices`)
   - New Invoice (`/invoices/new`)
   - Clients (`/clients`)
   - Expenses (`/expenses`)
   - Reports (`/reports`)
   - Business Profile (`/profile`)
5. [Shared Components](#shared-components)
6. [Mock Data Schema](#mock-data-schema)

---

## Design System

### Overview
LedgerOne uses a ** Tailwind CSS v4** setup with a fully custom **OKLCH color palette** and **semantic design tokens**. The UI is designed to be clean, professional, and modern — with soft shadows, rounded corners (`radius: 0.75rem`), and a consistent card-based layout language.

### Color Tokens

| Token | Light Mode | Dark Mode | Usage |
|-------|------------|-----------|-------|
| `background` | `oklch(0.99 0.005 260)` | `oklch(0.16 0.025 265)` | Page background |
| `foreground` | `oklch(0.18 0.03 265)` | `oklch(0.97 0.005 260)` | Primary text |
| `card` | `oklch(1 0 0)` | `oklch(0.21 0.03 265)` | Card surfaces |
| `card-foreground` | `oklch(0.18 0.03 265)` | `oklch(0.97 0.005 260)` | Text on cards |
| `primary` | `oklch(0.52 0.21 270)` | `oklch(0.7 0.19 275)` | Brand color (indigo-violet) |
| `primary-foreground` | `oklch(0.99 0 0)` | `oklch(0.16 0.04 265)` | Text on primary |
| `muted` | `oklch(0.965 0.008 260)` | `oklch(0.25 0.025 265)` | Muted backgrounds |
| `muted-foreground` | `oklch(0.52 0.03 260)` | `oklch(0.68 0.025 260)` | Secondary text |
| `accent` | `oklch(0.95 0.03 270)` | `oklch(0.3 0.06 275)` | Accent/hover backgrounds |
| `accent-foreground` | `oklch(0.25 0.1 270)` | `oklch(0.95 0.05 275)` | Text on accent |
| `destructive` | `oklch(0.6 0.22 25)` | `oklch(0.65 0.22 25)` | Error/danger |
| `success` | `oklch(0.68 0.16 155)` | `oklch(0.72 0.16 155)` | Success states |
| `warning` | `oklch(0.78 0.15 75)` | `oklch(0.8 0.15 75)` | Warning states |
| `border` | `oklch(0.92 0.01 260)` | `oklch(1 0 0 / 8%)` | Borders |
| `input` | `oklch(0.92 0.01 260)` | `oklch(1 0 0 / 12%)` | Input borders |
| `ring` | `oklch(0.52 0.21 270)` | `oklch(0.7 0.19 275)` | Focus ring |

### Brand Gradient
```css
/* Light */
--gradient-brand: linear-gradient(135deg, oklch(0.55 0.22 270), oklch(0.6 0.2 310));

/* Dark */
--gradient-brand: linear-gradient(135deg, oklch(0.6 0.22 275), oklch(0.62 0.2 315));
```
Used on: logo container, CTA buttons, chat widget, profile avatar background, hero text highlight.

### Shadows
```css
--shadow-card: 0 1px 2px 0 oklch(0.2 0.05 265 / 0.04), 0 1px 3px 0 oklch(0.2 0.05 265 / 0.06);
--shadow-elevated: 0 10px 30px -12px oklch(0.3 0.1 265 / 0.18);
```

### Border Radius
```css
--radius: 0.75rem; /* 12px base */
```
Cards: `rounded-2xl` (16px), Buttons: `rounded-lg` (8px), Pills: `rounded-full`, Inputs: `rounded-lg`.

### Typography
- **Headings**: `font-semibold`, `tracking-tight`
- **Body**: Default system sans-serif with font-feature-settings for ligatures
- **Mono**: Used for invoice IDs (`font-mono`, `text-[13px]`)
- **Labels**: `text-[11px]`, `uppercase`, `tracking-wider`, `font-semibold`

### Chart Colors
| Token | Light | Dark |
|-------|-------|------|
| `chart-1` | indigo | lighter indigo |
| `chart-2` | green | green |
| `chart-3` | orange | orange |
| `chart-4` | pink | pink |
| `chart-5` | cyan | cyan |

---

## Theme System

### Implementation
- **File**: `src/lib/theme.tsx`
- **Provider**: `ThemeProvider` wraps the app in `src/routes/__root.tsx`
- **Storage**: `localStorage` key `"theme"`
- **Detection**: Respects `prefers-color-scheme: dark` on first visit
- **Toggle**: Switches between `"light"` and `"dark"` classes on `<html>`

### Toggle Locations
1. **App Sidebar** (bottom) — "Light mode" / "Dark mode" button with Sun/Moon icon
2. **App Header** (top bar) — Circular icon button next to search and notifications

---

## Global Components

### 1. App Sidebar (`src/components/app-sidebar.tsx`)

**Position**: Fixed left, full height, `z-40`
**Width**: `w-64` (256px)
**Visibility**: Hidden on mobile (`hidden md:flex`)

**Structure**:
```
┌─────────────────────────────┐
│ [Logo] LedgerOne            │ ← h-16, border-b
│ Finance for founders        │
├─────────────────────────────┤
│ WORKSPACE                   │ ← Section label
│ • Dashboard                 │
│ • Clients                   │
│ • Invoices                  │
│ • Expenses                  │
│ • Reports                   │
│ • Business Profile          │
├─────────────────────────────┤
│ [🌙] Light mode            │
│ ┌───┬───────────────┬───┐ │
│ │ C │ Chintan Kasund… │ ⟳ │ │ ← User card
│ └───┴───────────────┴───┘ │
└─────────────────────────────┘
```

**Active State**:
- Background: `bg-sidebar-accent`
- Text: `text-sidebar-accent-foreground`
- Icon: `text-primary`
- Indicator: `h-1.5 w-1.5 rounded-full bg-primary` dot on the right

**Colors (Light)**:
- Background: `oklch(0.985 0.005 260)`
- Border: `oklch(0.92 0.01 260)`
- Accent: `oklch(0.95 0.02 270)`

**Colors (Dark)**:
- Background: `oklch(0.19 0.025 265)`
- Border: `oklch(1 0 0 / 8%)`
- Accent: `oklch(0.28 0.05 275)`

### 2. App Header (`src/routes/_app.tsx`)

**Position**: Sticky top, inside main content area
**Height**: `h-16`
**Background**: `bg-background/80` with `backdrop-blur`
**Border**: `border-b border-border`

**Left side**: Breadcrumb — `LedgerOne / {Page Name}`

**Right side**:
- Search bar (hidden on small screens): `w-72`, `rounded-lg`, `border border-input`, with ⌘K shortcut badge
- Theme toggle button: `h-9 w-9`, `rounded-lg`, `border border-border`
- Notification bell: `h-9 w-9`, with `bg-primary` red dot indicator

### 3. Chat Widget (`src/routes/_app.tsx`)

**Position**: Fixed bottom-right, `bottom-6 right-6`, `z-50`
**Size**: `h-12 w-12` circular
**Style**: Brand gradient background, white `MessageCircle` icon
**Shadow**: `--shadow-elevated`

### 4. Page Header (`src/components/page-header.tsx`)

**Layout**: Flex row, `mb-6`
- **Left**: Title (`text-2xl font-semibold tracking-tight`) + optional subtitle (`text-sm text-muted-foreground`)
- **Right**: Action buttons (flex gap-2)

### 5. Status Pill (`src/components/page-header.tsx`)

Rounded-full badge with border, `text-[11px]`, `uppercase`, `tracking-wide`.

| Status | Background | Text | Border |
|--------|------------|------|--------|
| `paid` | `bg-success/15` | `text-success` | `border-success/30` |
| `pending` | `bg-warning/15` | `text-warning` | `border-warning/30` |
| `overdue` | `bg-destructive/15` | `text-destructive` | `border-destructive/30` |
| `draft` | `bg-muted` | `text-muted-foreground` | `border-border` |

---

## Page Layouts

### Landing Page (`/`)

**Route**: `src/routes/index.tsx`
**Layout**: Full-width, single column, `max-w-6xl` centered
**Theme**: Light/dark aware via `bg-background text-foreground`

**Sections**:
1. **Header** (sticky feel, not actually sticky)
   - Left: Logo (brand gradient square `h-9 w-9`) + "LedgerOne" text
   - Right: "Sign in" text link + "Get started" primary button

2. **Hero**
   - Top: Pill badge — "New — automated reminders & GST-ready invoices" with Sparkles icon
   - Headline: `text-5xl sm:text-6xl`, brand gradient on "business deserves."
   - Subheadline: `text-base sm:text-lg text-muted-foreground`
   - CTAs: "Start free" (primary) + "Live demo" (card outline)

3. **Feature Grid** (`sm:grid-cols-3`)
   - Cards: `rounded-2xl border border-border bg-card p-5 shadow-[--shadow-card]`
   - Each card: icon in `bg-accent` circle, title, description
   - Icons: `Receipt`, `LineChart`, `ShieldCheck`

4. **Footer**
   - `border-t border-border py-6 text-center text-xs text-muted-foreground`

---

### Login (`/login`)

**Route**: `src/routes/login.tsx`
**Layout**: Split-screen on `lg` (`lg:grid-cols-2`)

**Left Panel** (hidden below `lg`):
- Full brand gradient background (`--gradient-brand`)
- Top: Logo (white/blur version)
- Middle: Testimonial quote, `text-3xl font-semibold`, white text
- Bottom: Copyright

**Right Panel**:
- Centered form, `max-w-sm`
- Mobile: Shows compact logo
- Title: "Welcome back" / "Create your account"
- Fields:
  - Business name (register only)
  - Email
  - Password (with "Forgot?" link on login)
- Submit: Full-width primary button
- Footer link: Toggle between login/register

**Input Style**:
```css
rounded-lg border border-input bg-background px-3 py-2 text-sm
focus:border-ring focus:ring-2 focus:ring-ring/30
```

---

### Register (`/register`)

**Route**: `src/routes/register.tsx`
**Layout**: Reuses `AuthForm` component from login with `mode="register"`
**Differences from Login**:
- Title: "Create your account"
- Subtitle: "Start invoicing in under a minute."
- Extra field: "Business name"
- Submit text: "Create account"
- Footer: "Already have an account? Sign in"

---

### Dashboard (`/dashboard`)

**Route**: `src/routes/_app.dashboard.tsx`
**Layout**: Standard app shell (sidebar + header + main)
**Page Header**: "Welcome back, Chintan" + subtitle + "New invoice" primary button

**Content Stack**:

#### Row 1: Stat Cards (`grid gap-4 sm:grid-cols-2 xl:grid-cols-5`)
Each card:
- `rounded-2xl border border-border bg-card p-5 shadow-[--shadow-card]`
- Decorative blurred gradient circle (`-right-6 -top-6 h-24 w-24 rounded-full opacity-60 blur-2xl`)
- Top: Label (uppercase `text-[11px]`) + Icon in `bg-accent` circle
- Value: `text-2xl font-semibold`
- Delta: Colored text (`text-success`, `text-destructive`, or `text-muted-foreground`)

| Card | Value | Icon | Tint |
|------|-------|------|------|
| Total revenue | ₹142,850 | IndianRupee | primary |
| Outstanding | ₹24,300 | Clock | warning |
| Total clients | 18 | Users | chart-5 |
| Paid rate | 86% | TrendingUp | success |
| Unpaid | 4 | AlertTriangle | destructive |

#### Row 2: Two-column grid (`lg:grid-cols-3`)

**Left (2/3): Income vs Expenses Chart**
- Header: Title + "Last 6 months" subtitle + Legend (Income = primary, Expense = muted-foreground/50)
- Bar chart: Flex row of 6 month groups
- Each group: Two vertical bars (`w-3 rounded-t-md`), flex-1 width
- Bars scale by percentage of max value
- Labels below: `text-[11px] text-muted-foreground`

**Right (1/3): Cash Flow**
- Title + subtitle
- Three progress rows:
  - Collected → `bg-success`
  - Pending → `bg-warning`
  - Overdue → `bg-destructive`
- Each: Label + value on right, `h-2 rounded-full bg-muted` bar below

#### Row 3: Recent Invoices Table
- Header: "Recent invoices" + "View all" link
- Table: `w-full text-sm`
- Columns: Invoice #, Client, Due, Amount (right), Status
- Rows: `border-t border-border hover:bg-accent/30`
- Invoice IDs: `font-mono text-[13px]`
- Status: `StatusPill` component
- Shows top 5 invoices

---

### Invoices (`/invoices`)

**Route**: `src/routes/_app.invoices.tsx`
**Page Header**: "Invoices" + "Create invoice" button

#### Summary Cards (`sm:grid-cols-3`)
- Total billed → `text-foreground`
- Collected → `text-success`
- Outstanding → `text-warning-foreground dark:text-warning`

#### Filter Bar
- Search input: `max-w-md`, search icon
- Status pills: "All", "Paid", "Pending", "Overdue", "Draft"
  - Active: `bg-accent text-accent-foreground`
  - Inactive: `text-muted-foreground hover:text-foreground`

#### Invoices Table
- Full table with header row `bg-muted/30`
- Columns: Invoice #, Client, Issued, Due, Amount (right), Status
- All invoices displayed (6 rows in mock data)

---

### New Invoice (`/invoices/new`)

**Route**: `src/routes/_app.invoices.new.tsx`
**Page Header**: "New invoice" + "Cancel" + "Save invoice" buttons
**Layout**: `lg:grid-cols-3` (2:1 split)

#### Left Column (2/3)

**Card 1: Invoice Details** (`sm:grid-cols-2`)
- Client dropdown (populated from mock clients)
- Invoice # input
- Issue date (date picker)
- Due date (date picker)

**Card 2: Line Items**
- Dynamic list of rows (`grid-cols-12`):
  - Description (`col-span-6`)
  - Qty (`col-span-2`, right-aligned)
  - Price (`col-span-3`, right-aligned)
  - Delete button (`col-span-1`)
- "Add line" button: `border-dashed`
- Default 2 line items pre-filled

**Card 3: Notes**
- Textarea, 3 rows

#### Right Column (1/3)

**Card: Summary**
- Subtotal (calculated)
- GST 18% (calculated)
- Divider
- Total due (calculated, bold)

**Card: Status**
- Dropdown: Draft / Pending / Paid

**Input Style** (shared):
```css
w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
focus:border-ring focus:ring-2 focus:ring-ring/30
```

**Card Style** (shared):
```css
rounded-2xl border border-border bg-card p-5 shadow-[--shadow-card]
```

---

### Clients (`/clients`)

**Route**: `src/routes/_app.clients.tsx`
**Page Header**: "Clients" + "Add client" button

#### Search & Filter
- Search: `max-w-md` with search icon
- Dropdown: "All clients" / "With outstanding" / "Paid up"

#### Clients Table
- Header: Client, Contact, Outstanding (right), Total billed (right), Actions
- Row layout:
  - Avatar: `h-9 w-9 rounded-full bg-accent` with first letter
  - Name + ID below
  - Contact: Email + Phone with icons
  - Outstanding: `text-warning` if > 0
  - Actions: `MoreHorizontal` button

---

### Expenses (`/expenses`)

**Route**: `src/routes/_app.expenses.tsx`
**Page Header**: "Expenses" + "Add expense" button

#### Summary Row (`sm:grid-cols-4`)

**Left Card (1/4): This Month**
- Total amount + entry count

**Right Card (3/4): By Category**
- Horizontal bar chart per category
- Bars: `h-1.5 rounded-full bg-muted` with `bg-primary` fill
- Categories: Software, Travel, Office, Marketing, Utilities
- Category badges: Colored pill backgrounds (`bg-chart-N/15 text-chart-N`)

#### Search Bar
- `max-w-md` search input

#### Expenses Table
- Columns: Date, Vendor, Category (pill), Note, Amount (right)
- Category pills use `categoryTint` mapping per category

---

### Reports (`/reports`)

**Route**: `src/routes/_app.reports.tsx`
**Page Header**: "Reports" + "Export" button (outline style)

#### Summary Cards (`sm:grid-cols-3`)
- Income (6 mo) → `text-success`
- Expenses (6 mo) → `text-destructive`
- Net profit → `text-foreground`

#### Two-column Grid (`lg:grid-cols-3`)

**Left (2/3): Income vs Expenses**
- Same bar chart as Dashboard but larger (`h-64`)
- Income bars: `bg-primary`
- Expense bars: `bg-destructive/70`
- Bar width: `w-4`

**Right (1/3): Top Clients**
- Horizontal bars with `--gradient-brand` fill
- Bars relative to top client amount

#### Bottom Section: Recent Expense Activity
- Card with `divide-y divide-border` list
- Each item: Vendor name, date+category subtitle, amount

---

### Business Profile (`/profile`)

**Route**: `src/routes/_app.profile.tsx`
**Page Header**: "Business Profile" + "Save changes" button
**Layout**: `lg:grid-cols-3` (1:2 split)

#### Left Column (1/3)
**Business Card**:
- Large avatar: `h-16 w-16 rounded-2xl` with brand gradient + `Building2` icon
- Business name + tagline
- "Upload logo" button
- File constraints note

#### Right Column (2/3)
Stack of form sections, each in a card:

1. **Business details** (`sm:grid-cols-2`)
   - Business name, Contact email, Phone, Website

2. **Address** (`sm:grid-cols-2`)
   - Street, City, State, PIN code

3. **Tax & compliance** (`sm:grid-cols-2`)
   - GSTIN, PAN

4. **Bank details** (`sm:grid-cols-2`)
   - Account holder, Bank name, Account number, IFSC

All inputs use shared `inputCls` style.

---

## Shared Components

### Card Pattern
Used across almost every page:
```css
rounded-2xl border border-border bg-card p-5 (or p-6)
shadow-[var(--shadow-card)]
```

### Table Pattern
```css
rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden
/* Header row */
text-left text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30
/* Body rows */
border-t border-border hover:bg-accent/30
```

### Button Patterns
| Variant | Style |
|---------|-------|
| Primary | `rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90` |
| Outline | `rounded-lg border border-border bg-card px-3.5 py-2 text-sm font-medium hover:bg-accent` |
| Icon Circle | `grid h-9 w-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground` |

### Form Field Pattern
```css
label
  div.text-xs.font-medium (label text)
  input.w-full.rounded-lg.border.border-input.bg-background...
```

---

## Mock Data Schema

### Stats
```ts
{
  revenue: 142850,
  outstanding: 24300,
  clients: 18,
  paidRate: 86,
  unpaid: 4,
}
```

### Invoice
```ts
{
  id: string;      // e.g. "INV-2026-0012"
  client: string;
  date: string;    // ISO date
  due: string;
  amount: number;
  status: "paid" | "pending" | "overdue" | "draft";
}
```

### Client
```ts
{
  id: string;
  name: string;
  email: string;
  phone: string;
  outstanding: number;
  totalBilled: number;
}
```

### Expense
```ts
{
  id: string;
  category: "Software" | "Travel" | "Office" | "Marketing" | "Utilities";
  vendor: string;
  date: string;
  amount: number;
  note?: string;
}
```

### Monthly Data
```ts
{ month: string; income: number; expense: number; }
```

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| `< md` (768px) | Sidebar hidden, header shows mobile logo on auth pages |
| `md`+ | Sidebar visible, search bar visible, multi-column grids activate |
| `lg`+ (1024px) | Two/three column layouts active, larger charts |
| `xl`+ (1280px) | Dashboard shows 5 stat cards in one row |

---

## File Structure

```
src/
├── components/
│   ├── app-sidebar.tsx      # Fixed left navigation
│   └── page-header.tsx      # Page title + actions + StatusPill
├── lib/
│   ├── theme.tsx            # Light/dark theme provider
│   └── mock-data.ts         # All mock data + types
├── routes/
│   ├── __root.tsx           # Root layout with ThemeProvider
│   ├── index.tsx            # Landing page
│   ├── login.tsx            # Auth form (login + register)
│   ├── register.tsx         # Reuses AuthForm
│   ├── _app.tsx             # App shell (sidebar + header + chat)
│   ├── _app.dashboard.tsx   # Dashboard
│   ├── _app.invoices.tsx    # Invoice list
│   ├── _app.invoices.new.tsx # Invoice creation
│   ├── _app.clients.tsx     # Client list
│   ├── _app.expenses.tsx    # Expense tracking
│   ├── _app.reports.tsx     # Financial reports
│   └── _app.profile.tsx     # Business settings
└── styles.css               # Design tokens + light/dark themes
```

---

*Document version: 1.0 | Generated for LedgerOne UI reference*