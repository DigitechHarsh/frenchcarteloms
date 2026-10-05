# 🍟 French Cartel - Order Management System (OMS) & Kitchen Display

A complete, highly responsive, tablet-first Order Management System (OMS) built specifically for **"French Cartel"**, a high-volume food truck selling gourmet french fry bowls. It replaces traditional paper sticky notes with a digital, real-time kitchen wall, fast cashier ordering (<10s checkout), and an executive analytics dashboard for the food truck owner.

---

## 🚀 Key Features

### 1. 🧑‍💼 Cashier Screen (`/order`)
- **Dual-Pane Layout**: Menu composer on the left, live cart and running total on the right (collapses gracefully on mobile).
- **Fast Touch-Tiles**: Large tiles (56px+ targets) for bowl sizes (`Bite`, `KiloBite`, `MegaBite`, `GigaBite`) and flavors (`Spicy Chipotle`, `Chilly Cheese`, `Cheese Peri Peri`, `Korean BBQ`).
- **Custom Add-ons & Free Toppings Rule**:
  - Multi-select paid toppings: Nachos (+Rs 60), Extra Cheese (+Rs 30), Kurkure (+Rs 40).
  - **Strict Free Fresh Topping Rule**: Exactly one choice allowed: `Jalapeno` / `Olives` / `None` (Rs 0).
- **Sub-10s Checkout**: Quantity stepper, "Same as last bowl" quick repeat button, customer name & note fields, Rush Priority toggle.
- **Payment & Confirmation**: Supports UPI, Cash, and Card with Paid/Unpaid toggles; displays celebratory confetti with a **large daily token number (#1, #2...)** that safely resets at midnight Asia/Kolkata.
- **Drawer**: Quick access to the last 10 orders with real-time status tags.

### 2. 👨‍🍳 Digital Sticky-Note Kitchen Wall (`/kitchen`)
- **Digital Sticky-Note Kanban Board**: Columns for `New Orders`, `Preparing`, and `Ready for Pickup`.
- **Realistic Sticky Notes**: Cards styled like physical paper notes with tape accents, bold token numbers, and live elapsed timer badges.
- **Color-Coded Timers**: Green (<10 min), Amber (10–15 min), Red (>15 min, pulsating alert). Thresholds are configurable in Admin.
- **Dual Interaction**: Drag-and-drop between columns using `@dnd-kit` **AND** big one-tap tablet buttons (`Start ➔`, `Mark Ready ✓`, `Served / Done ✓`).
- **Intelligent Sorting**: High-Priority (Rush) orders are pinned to the top, followed by First-In-First-Out (FIFO) queue order.
- **Chef Assignment & Filters**: Quickly assign orders to `Chef 1` or `Chef 2` with quick filter tabs.
- **Batch Prep Summary Bar**: Shows active preparation counts grouped by flavor and size so chefs can fry in batches.
- **Audio & Visual Alerts**: Synthesized sound chimes (Web Audio API) for new orders and order ready alerts, plus flash animations (with instant mute toggle).
- **5-Second Undo Toast**: Accidental cancellations can be restored with a single tap.

### 3. 📊 Executive Analytics Dashboard (`/dashboard`)
- **Animated KPI Cards**: Total Revenue, Orders Placed, Bowls Sold, Average Order Value (AOV), Prep Time, and Cancelled Orders with count-up animations, mini sparklines, and period-over-period percentage comparisons.
- **Interactive Recharts Visualizations**:
  - **Revenue & Orders Trend**: Line/Area chart with brush zoom slider and metric toggles.
  - **Hourly Sales Chart**: Dual-axis bar chart identifying peak lunch and dinner rush hours.
  - **Weekday × Hour Heatmap**: Visual intensity grid showing the busiest truck operating hours.
  - **Bestsellers**: Bar chart by bowl size, donut chart by flavor dust, bar chart by topping, and percentage breakdown of Jalapeno vs Olives vs None.
  - **Payment & Chef Speed**: Donut chart of payment methods, paid vs unpaid settlement, and chef speed comparison.
  - **Cross-Chart Click Filtering**: Clicking any chart element (e.g. `Korean BBQ`, `18:00`, or `Chef 1`) instantly filters the order history table below, with a removable active filter chip.
- **AG Grid Community Order History**:
  - Full search, column sorting, pagination, and colored status chips.
  - Clicking any row opens an **Order Detail Drawer** with timeline timestamps (Placed, Cooking, Ready, Served) and printable receipt slips.
  - CSV Export and formatted daily sales report downloads.

### 4. ⚙️ Admin & Operations (`/admin`)
- **Dynamic Menu Catalog**: Add, edit, reorder, and toggle active status for sizes, flavors, and toppings without hardcoded values.
- **PIN Security**: Update 4-digit PINs for Cashier (`1111`), Kitchen (`2222`), and Admin (`9999`).
- **Kitchen Settings**: Configure amber and red timer threshold minutes and food truck brand name.
- **Order Corrections**: Revert or reopen order statuses with audit reason logs.
- **Data Tools**: Archive and export old orders to CSV, regenerate 30 days of realistic demo data, or clear demo seeds.

### 5. 📴 Offline-First Resilience & PWA
- Built-in IndexedDB storage caches the menu and captures orders when offline with local tokens.
- Automatic background synchronization when the network reconnects, with zero duplicate tokens.
- PWA manifest and service worker enabled for installation on iPads, Android tablets, and phones.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 6, TypeScript
- **UI Library**: Ant Design (v5) with custom warm food truck theme tokens (no MUI/Tailwind)
- **Charts**: Recharts
- **Data Grid**: AG Grid Community (v33)
- **Drag & Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
- **Animations**: Framer Motion & Canvas Confetti
- **Dates & Timezone**: Day.js with `utc` and `timezone` plugins set to `Asia/Kolkata`
- **State & Data**: TanStack Query (v5) + Zustand
- **Backend / Database**: Supabase (PostgreSQL + Realtime)
- **Offline Storage**: IndexedDB (`idb`)

---

## 📂 Project Structure

```
FrenchCartelOMS/
├── public/
│   ├── favicon.svg             # French Cartel truck logo
│   ├── manifest.webmanifest    # PWA install manifest
│   └── sw.js                   # Offline service worker
├── src/
│   ├── features/
│   │   ├── admin/              # Admin settings, catalog editor, order audit
│   │   ├── dashboard/          # KPI cards, Recharts, Heatmap, AG Grid table
│   │   ├── kitchen/            # Digital sticky-note Kanban wall & batch cooking
│   │   └── order/              # Cashier dual-pane order composer & live cart
│   ├── lib/
│   │   ├── formatters.ts       # INR currency (Rs 1,24,500) & Asia/Kolkata dates
│   │   ├── idb.ts              # IndexedDB cache & offline sync queue
│   │   ├── mockData.ts         # Default menu & 30-day realistic seed generator
│   │   ├── sound.ts            # Web Audio API chime generator
│   │   └── supabase.ts         # Supabase client & offline-first API adapter
│   ├── shared/components/      # Header, PIN Modal, navigation
│   ├── store/                  # Zustand stores (Cart, Auth, Settings)
│   ├── tests/                  # Vitest unit tests for pricing & token sequence
│   ├── theme/themeConfig.ts    # Ant Design v5 warm palette tokens
│   ├── types/index.ts          # Core TypeScript domain definitions
│   ├── App.tsx                 # Lazy routes and ConfigProvider
│   ├── index.css               # Warm food truck styling & sticky notes
│   └── main.tsx
├── supabase/
│   └── migrations/
│       └── 01_french_cartel_schema.sql # Complete Postgres DDL, RPC & RLS
├── .env.example
├── package.json
└── vite.config.ts
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ or v20+
- **NPM**: v9+

### 2. Local Setup
```bash
# Clone the repository and navigate into folder
cd FrenchCartelOMS

# Install dependencies (already pinned and verified)
npm install

# Run Vitest unit tests
npm run test

# Start the Vite development server
npm run dev
```

The app will be available at `http://localhost:5173`.

> **Note**: The app works **100% out-of-the-box in local offline mode** with realistic data, full state persistence in IndexedDB, and simulated Realtime events even before you set up Supabase!

---

## 🗄️ Supabase Setup & Database Migration

To connect live Supabase cloud database:

1. Create a new project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** in the Supabase dashboard.
3. Open the migration file:
   [`supabase/migrations/01_french_cartel_schema.sql`](file:///c:/Users/HP/OneDrive/Desktop/FrenchCartelOMS/supabase/migrations/01_french_cartel_schema.sql)
4. Copy the entire file content and paste it into the Supabase SQL Editor, then click **Run**.
   - Creates `menu_items`, `orders`, `order_items`, `order_item_toppings`, `app_settings`, `daily_token_counters`.
   - Sets up safe atomic daily token function `get_next_daily_token()`.
   - Sets up atomic order placement RPC `place_order_atomic()`.
   - Seeds the default menu prices and settings.
   - Sets up 30-day realistic order generator `generate_seed_data()`.
   - Enables Supabase Realtime publication on `orders` and `order_items`.
   - Configures permissive MVP Row Level Security (RLS) policies.
5. Create `.env` from `.env.example`:
   ```bash
   cp .env.example .env
   ```
6. Update `.env` with your Supabase credentials from **Project Settings > API**:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_APP_TIMEZONE=Asia/Kolkata
   ```
7. Restart your dev server (`npm run dev`). The app will automatically connect to Supabase.

---

## 🚢 Deployment Guide

> **Important**: Per commercial licensing guidelines, **do NOT deploy commercial applications to Vercel Hobby**. Recommended deployment targets are **Cloudflare Pages** or **Netlify**.

### Deploy to Cloudflare Pages (Recommended)
1. Push your repository to GitHub or GitLab.
2. In Cloudflare Dashboard, go to **Workers & Pages > Create application > Pages > Connect to Git**.
3. Select your repository and configure build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Save and Deploy**.

### Deploy to Netlify
1. Connect your repository to Netlify.
2. Set build command to `npm run build` and publish directory to `dist`.
3. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Deploy site.

---

## 📱 PWA Tablet / Mobile Installation

1. Open the deployed URL in Google Chrome (Android/Windows) or Safari (iOS/iPadOS).
2. **On iPad/iPhone**: Tap the **Share** button in Safari and choose **"Add to Home Screen"**.
3. **On Android/Chrome**: Tap the prompt **"Install French Cartel OMS"** or tap the browser menu (3 dots) and select **"Install App"**.
4. The application will launch full-screen without address bars, giving chefs and cashiers a native app feel.

---

## 💡 Role PINs (Quick Switcher)

Switch roles using the top-right role dropdown in the header:
- **Cashier**: `1111`
- **Kitchen**: `2222`
- **Admin / Owner**: `9999` (Unlocks full access to all screens)

---

## 📝 Assumptions Made

1. **Operating Hours**: The food truck operates primarily from 12:00 PM to 11:00 PM Asia/Kolkata time, with peak volumes during lunch (1:00–3:00 PM) and evening dinner rushes (6:00–9:30 PM).
2. **Daily Token Resets**: Tokens strictly increment per calendar date (`Asia/Kolkata`) starting from `#1` each morning. Atomic locking prevents collisions when multiple cashiers place simultaneous orders.
3. **Free Fresh Topping**: As specified, each bowl may have at most **one** free topping choice (`Jalapeno`, `Olives`, or `None`) at Rs 0. A customer cannot choose both Jalapeno and Olives on the same bowl.
4. **Historical Price Snapshot**: The unit price of bowl sizes and toppings at the moment of order placement is saved directly onto `order_items` and `order_item_toppings` so future menu price adjustments never mutate past historical accounting.
5. **Zero-Configuration Demo**: The system automatically provisions realistic demo data and local storage when running without internet or Supabase credentials, allowing immediate end-to-end evaluation.
