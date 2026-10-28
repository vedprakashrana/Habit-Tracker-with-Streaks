# HabitFlow — Habit Tracker with Streaks
> **Production-Quality Full-Stack Web Application for Habit Tracking, Flexible Schedules, Streak Calculation, and Consistency Analytics.**

---

## 1. Project Name & Description
**HabitFlow** is a modern, responsive, full-stack productivity web application designed to help users build enduring habits, track consecutive streaks without unfair penalties, and visualize six months of habit history with GitHub-style consistency heatmaps.

HabitFlow solves a critical flaw in conventional habit trackers: **inflexible daily streak counting**. Real life routines include varied schedules—daily rituals, specific weekdays (e.g. gym on Mon/Wed/Fri), or weekly targets (e.g. read 3 times per week). HabitFlow features an intelligent, timezone-safe **Schedule Engine** that calculates current and longest streaks based strictly on *eligible scheduled occurrences*, ensuring rest days and unscheduled days never unfairly break a streak.

---

## 2. Main Features
- **Personalized SaaS Dashboard**: Localized greeting, dynamic motivational messages, key metric summary cards, a 7-day velocity chart, and today's scheduled habits.
- **Flexible Schedule Engine**:
  - **Daily**: Scheduled every calendar day.
  - **Specific Weekdays**: Configurable day selection (e.g., Monday, Wednesday, Friday). Unscheduled days (e.g., Tuesday) do not break streaks.
  - **Times-Per-Week**: Configurable weekly quota (e.g., 3x/week). Evaluates Monday–Sunday calendar weeks in the user's timezone; in-progress weeks are never prematurely failed.
- **7-Day Completion Correction Window**: Users can check off habits for today or retroactively correct completion records for any day within the previous 7 local calendar days. Prevents future check-ins and rejects modifications older than 7 days.
- **6-Month Calendar Heatmap**: Displays 26 calendar weeks (~182 days) with custom status indicators: *Completed*, *Missed scheduled day*, *Unscheduled day*, and *Future date*, with interactive tooltips and an accessible legend.
- **30-Day Completion Statistics**: Visualizes daily check-in volume with interactive Recharts area charts, comparative bar charts across habits, and a detailed breakdown table using a division-by-zero safe formula.
- **Habit Lifecycle Management**: Create, edit, archive, restore, and permanently delete habits with confirmation dialogs. Archiving preserves all historical completion records and streak metrics.
- **Security & Authorization**: User authentication via bcrypt password hashing, JWT tokens, secure cookies, and strict per-user data isolation.
- **Zero-Setup Demo Mode**: Includes pre-seeded demo user (`demo@habitflow.app`) with 6 months of realistic historical data across daily, weekday, and weekly habits.
- **Responsive Dark & Light Mode**: Seamless theme toggle persisted in `localStorage`.

---

## 3. Screenshots & Visual Interface
| Dashboard (Light Mode) | 6-Month Heatmap & 7-Day Quick Correction |
|:---:|:---:|
| ![Dashboard Screenshot](file:///C:/Users/vedpr/.gemini/antigravity-ide/brain/447cd352-e2cd-4a12-af77-ba1dc9b71b66/dashboard_page_1793165318058.png) | ![Heatmap Screenshot](file:///C:/Users/vedpr/.gemini/antigravity-ide/brain/447cd352-e2cd-4a12-af77-ba1dc9b71b66/habit_details_page_1793165362013.png) |

| 30-Day Completion Statistics | Dark Mode Dashboard |
|:---:|:---:|
| ![Statistics Screenshot](file:///C:/Users/vedpr/.gemini/antigravity-ide/brain/447cd352-e2cd-4a12-af77-ba1dc9b71b66/statistics_page_1793165403799.png) | ![Dark Mode Screenshot](file:///C:/Users/vedpr/.gemini/antigravity-ide/brain/447cd352-e2cd-4a12-af77-ba1dc9b71b66/dark_mode_activated_1793165506854.png) |

---

## 4. Technology Stack
### Frontend
- **Framework**: React 18 with TypeScript & Vite
- **Styling**: Tailwind CSS with custom SaaS aesthetic (indigo/slate color palette)
- **Routing**: React Router DOM (v6)
- **Server State**: TanStack Query (React Query v5)
- **Forms & Validation**: React Hook Form with Zod schemas
- **Icons**: Lucide React
- **Charts**: Recharts (AreaChart, BarChart)
- **Date Handling**: date-fns

### Backend
- **Runtime**: Node.js (v20+ / v25+)
- **Framework**: Express.js with TypeScript
- **Database & ORM**: PostgreSQL with Prisma ORM (v5)
- **Request Validation**: Zod (server-side schemas)
- **Authentication**: JWT & bcryptjs
- **Security**: Helmet, CORS credentials, rate limiting
- **Dual-Data Architecture**: Prisma PostgreSQL client with an automatic fallback in-memory repository containing pre-seeded demo data for immediate, zero-friction local evaluation without external databases.

### Testing
- **Test Framework**: Vitest (v2)
- **API Integration Testing**: Supertest

---

## 5. Architecture Overview
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│       React Router • TanStack Query • Tailwind • Recharts   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST API (JSON)
┌──────────────────────────────▼──────────────────────────────┐
│                    Backend API (Express.js)                 │
│    Middleware: Auth (JWT), Rate Limiter, Helmet, CORS       │
├─────────────────────────────────────────────────────────────┤
│                  Controllers & Validators                   │
│        Auth • Habits • Completions • Dashboard • Stats      │
├─────────────────────────────────────────────────────────────┤
│                       Schedule Engine                       │
│    Streak Calculator • Heatmap Generator • Stats Engine     │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│   Prisma ORM (PostgreSQL)    │   Resilient In-Memory Store  │
│   (Production / Docker)      │   (Zero-Config Instant Eval) │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 6. Project Directory Structure
```
habitflow/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   │   └── 20261028000000_init/migration.sql
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── completionController.ts
│   │   │   ├── dashboardController.ts
│   │   │   ├── habitController.ts
│   │   │   ├── heatmapController.ts
│   │   │   └── statsController.ts
│   │   ├── db/
│   │   │   ├── prisma.ts
│   │   │   └── store.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   ├── dashboardRoutes.ts
│   │   │   ├── habitRoutes.ts
│   │   │   └── statsRoutes.ts
│   │   ├── services/
│   │   │   └── scheduleEngine.ts
│   │   ├── tests/
│   │   │   ├── api.test.ts
│   │   │   └── scheduleEngine.test.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── dateUtils.ts
│   │   ├── validators/
│   │   │   └── index.ts
│   │   ├── app.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CalendarHeatmap.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── HabitCard.tsx
│   │   │   ├── HabitModal.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── QuickCorrectionStrip.tsx
│   │   │   └── Toast.tsx
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── HabitDetailPage.tsx
│   │   │   ├── HabitsPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── StatsPage.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── iconMap.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 7. Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ or v25 recommended)
- **NPM**: v9.0.0 or higher
- *(Optional)* **Docker & Docker Compose** for local PostgreSQL

---

## 8. Installation Instructions
Clone the repository and install all dependencies for both frontend and backend using the root workspace:

```bash
# Clone the repository
git clone https://github.com/your-username/habitflow.git
cd habitflow

# Install dependencies across all workspaces
npm install
```

---

## 9. Environment Variable Setup
Copy `.env.example` to create your local `.env`:

```bash
cp .env.example .env
```

### Environment Variables List
| Variable | Description | Default / Example |
|---|---|---|
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgrespassword@localhost:5432/habitflow?schema=public` |
| `JWT_SECRET` | Secret key for signing auth tokens | `habitflow_super_secret_jwt_key_min32chars` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `DEMO_USER_EMAIL` | Default seeded demo user email | `demo@habitflow.app` |
| `DEMO_USER_PASSWORD` | Default seeded demo user password | `password123` |

---

## 10. Database Creation and Migration Instructions
If using PostgreSQL (e.g. via Docker):

```bash
# Start PostgreSQL container
docker compose up -d

# Apply Prisma migrations
npm run prisma:migrate --workspace=backend

# Generate Prisma Client
npm run prisma:generate --workspace=backend
```

*Note: If no PostgreSQL instance is active, HabitFlow automatically boots with its built-in in-memory repository and pre-seeded demo dataset.*

---

## 11. Seed / Demo Data Instructions
To populate PostgreSQL with demo habits and 6 months of historical completion check-ins:

```bash
npm run seed --workspace=backend
```

---

## 12. Demo Login Credentials
For local evaluation, a pre-seeded account is available:
- **Email**: `demo@habitflow.app`
- **Password**: `password123`
- **One-Click Login**: Simply click the **"⚡ Log In with Demo Account"** button on the login screen to enter immediately.

---

## 13. Frontend Development Command
```bash
npm run dev --workspace=frontend
# Access UI at http://localhost:5173
```

---

## 14. Backend Development Command
```bash
npm run dev --workspace=backend
# API available at http://localhost:5000
```

---

## 15. Production Build Commands
```bash
# Build both frontend and backend
npm run build

# Or individually:
npm run build:backend   # Generates backend/dist
npm run build:frontend  # Generates frontend/dist
```

---

## 16. Automated Test Commands
Run the complete automated test suite (31 tests across Schedule Engine unit tests and API integration tests):

```bash
npm test
# Or in backend workspace:
npm run test --workspace=backend
```

### Actual Test Execution Output
```
 ✓ src/tests/scheduleEngine.test.ts (16 tests)
 ✓ src/tests/api.test.ts (15 tests)

 Test Files  2 passed (2)
      Tests  31 passed (31)
```

---

## 17. API Endpoint Documentation
### Authentication
- `POST /api/auth/register` — Create a new user account.
- `POST /api/auth/login` — Authenticate and receive JWT cookie & token.
- `POST /api/auth/logout` — Invalidate session and clear auth cookies.
- `GET /api/auth/me` — Retrieve current authenticated user profile.
- `PATCH /api/auth/timezone` — Update user's configured IANA timezone.

### Habits
- `GET /api/habits` — Get user's active habits (with currentStreak, longestStreak, and today completion status).
- `GET /api/habits?archived=true` — Get user's archived habits.
- `POST /api/habits` — Create a new habit with schedule configuration.
- `GET /api/habits/:id` — Get habit details with recent completion history.
- `PATCH /api/habits/:id` — Update habit metadata or schedule.
- `POST /api/habits/:id/archive` — Archive habit (preserves completion history).
- `POST /api/habits/:id/restore` — Restore habit back to active routine.
- `DELETE /api/habits/:id` — Permanently delete habit.

### Completions
- `GET /api/habits/:id/completions` — List completions for a habit.
- `PUT /api/habits/:id/completions/:date` — Record habit completion for a local date (`YYYY-MM-DD`). Enforces 7-day correction limit and rejects future dates.
- `DELETE /api/habits/:id/completions/:date` — Undo/remove a habit completion within the 7-day window.

### Dashboard & Analytics
- `GET /api/dashboard` — Full dashboard metrics, motivational message, and 7-day velocity.
- `GET /api/stats?days=30` — 30-day completion rates, daily activity volume, and habit comparison.
- `GET /api/habits/:id/heatmap?months=6` — 26 weeks (~182 days) heatmap dataset with cell statuses.

---

## 18. Database Model Descriptions
Modeled via Prisma:
- **User**: Primary user record (`id`, `name`, `email`, `passwordHash`, `timezone`, `createdAt`, `updatedAt`).
- **Habit**: Individual habit (`id`, `userId`, `name`, `description`, `icon`, `color`, `scheduleType`, `scheduleConfiguration`, `reminderTime`, `archivedAt`, `createdAt`, `updatedAt`).
- **HabitCompletion**: Daily check-in record (`id`, `habitId`, `localDate`, `completedAt`, `createdAt`).
  - Constraint: Unique compound index on `[habitId, localDate]` to guarantee zero duplicate records.

---

## 19. Schedule Types & Configuration
1. **DAILY**:
   - `scheduleType`: `"DAILY"`
   - `scheduleConfiguration`: `"{}"`
   - Scheduled on every calendar day.
2. **WEEKDAYS**:
   - `scheduleType`: `"WEEKDAYS"`
   - `scheduleConfiguration`: `{"weekdays": [1, 3, 5]}` (1 = Monday, 7 = Sunday)
   - Scheduled strictly on configured weekdays.
3. **TIMES_PER_WEEK**:
   - `scheduleType`: `"TIMES_PER_WEEK"`
   - `scheduleConfiguration`: `{"targetPerWeek": 3}`
   - Any day during the Monday–Sunday week can count toward the target.

---

## 20. Current-Streak & Longest-Streak Rules
### Daily & Selected Weekdays
- **Calculation**: Walks backward through *scheduled* occurrences starting from today.
- **Today's Status**:
  - If today is scheduled and completed: counts +1 and checks previous scheduled day.
  - If today is scheduled and NOT completed: today is considered *in progress*. It does NOT break the streak; the current streak reflects all prior consecutive scheduled completions.
- **Unscheduled Days**: Days outside the habit schedule (e.g., Tuesday for a Mon/Wed/Fri habit) are skipped and **do not break streaks**.
- **Missed Days**: Any past scheduled day that was not completed breaks the consecutive streak.
- **Longest Streak**: The maximum consecutive run of completed scheduled occurrences achieved in the habit's history.

---

## 21. Weekly-Target Streak Policy
For habits configured with a weekly completion frequency (e.g., 3 times per week):
1. **Week Boundaries**: Monday 00:00 through Sunday 23:59 in the user's local timezone.
2. **Qualifying Week**: A week in which the number of valid completions is $\ge$ the configured target.
3. **Consecutive Streak**: Counts consecutive qualifying weeks.
4. **Current Week in Progress**: An unfinished current week is **never prematurely marked as failed**.
   - If current week target has already been met: streak = 1 + consecutive past qualifying weeks.
   - If current week target is not yet met: streak = consecutive past qualifying weeks (preserved until the week ends).
5. **Historical Weeks**: Evaluated once the calendar week concludes. Missing the target resets consecutive qualifying weeks.

---

## 22. Timezone Handling
- All calendar dates in completions and heatmaps use strict ISO `YYYY-MM-DD` representation.
- Dates are derived using `Intl.DateTimeFormat` with the user's configured IANA timezone (e.g. `America/New_York`, `UTC`).
- Avoids UTC ISO string slicing (`toISOString().split('T')[0]`) which causes off-by-one errors near midnight.
- Date-only strings are stored without timezone offsets, preventing database shift across timezones.

---

## 23. Completion-Rate Formula
$$\text{Completion Rate} = \frac{\text{Completed Scheduled Occurrences}}{\text{Eligible Scheduled Occurrences}} \times 100$$

- **Zero-Denominator Safety**: If eligible occurrences equal zero (e.g. new habit with no past scheduled days), the rate safely returns `0%` (never `NaN` or `Infinity`).
- **Future Dates**: Future dates are excluded from eligible occurrences so pending habits are not penalized as missed.

---

## 24. Deployment Instructions
### Frontend (Vercel / Netlify / Cloudflare Pages)
1. Push repository to GitHub.
2. Connect repository to Vercel.
3. Set root directory to `frontend`.
4. Build command: `npm run build`.
5. Output directory: `dist`.
6. Configure environment variable: `VITE_API_URL` pointing to the deployed backend URL.

### Backend (Render / Railway / Fly.io)
1. Create a new Web Service on Render from the GitHub repository.
2. Set root directory to `backend`.
3. Build command: `npm install && npm run build`.
4. Start command: `npm run start`.
5. Add PostgreSQL database on Render / Neon / Supabase and configure `DATABASE_URL`.
6. Add `JWT_SECRET` and `FRONTEND_URL`.

---

## 25. Known Limitations
- Browser notification reminders rely on the application tab being active or standard Web Notifications API permissions.
- In-memory data store does not persist across server process restarts unless connected to a live PostgreSQL database via `DATABASE_URL`.

---

## 26. Future Improvements
- Web Push Notifications with Service Workers for background habit reminder alerts.
- Social accountability: habit sharing and leaderboards among friends.
- Habit archiving export to CSV / JSON format.

---

## 27. AI Tools Used & How They Helped
- **Antigravity AI**: Assisted in designing the full-stack architecture, writing the timezone-safe Schedule Engine, generating comprehensive test cases in Vitest, and constructing the 26-week accessible calendar heatmap.
- All code, business logic, schemas, and UI components were validated with automated test execution and browser subagent simulation.

---

## 28. What is Finished & Final Status
- [x] Full-Stack Monorepo setup with Vite + React + Express + Prisma
- [x] Timezone-safe Schedule Engine (Daily, Weekdays, Times-per-week)
- [x] Current and longest streak calculation engine
- [x] 7-day completion correction window & future date validation
- [x] 6-month (26-week) consistency heatmap with tooltips & accessible legend
- [x] 30-day completion statistics with Recharts charts & comparison breakdown
- [x] Full authentication with JWT, secure cookies, and cross-user data isolation
- [x] Pre-seeded demo user with 6 months of realistic historical data
- [x] 31 automated tests passing with 100% success rate
- [x] Dark / Light mode toggle
- [x] Production builds verified for both frontend and backend

---

## 29. Video Demonstration Script (3–5 Minutes)
1. **0:00 - 0:45 | Introduction & Problem Statement**:
   - Welcome to HabitFlow. Explain why ordinary habit trackers fail users (rigid daily expectations vs real-life routines).
   - Show the sleek, modern dashboard and dark/light mode toggle.
2. **0:45 - 1:45 | Dashboard & Streak Highlights**:
   - Click "⚡ Log In with Demo Account". Show immediate loading of pre-seeded 6-month historical data.
   - Point out the personalized greeting, motivational progress bar, 7-day velocity chart, and today's scheduled habits.
   - Check off a habit for today and demonstrate the instant toast feedback and streak increment.
3. **1:45 - 2:45 | Habit Details & 6-Month Heatmap**:
   - Click into "Read 20 minutes". Show the 26-week consistency heatmap.
   - Hover over cells to show tooltips differentiating completed, missed, unscheduled, and future days.
   - Demonstrate the **7-Day Quick Correction Strip**: toggle a past check-in and show how the streak recalculates immediately.
4. **2:45 - 3:45 | Statistics & Flexible Schedules**:
   - Navigate to the **Statistics** page. Highlight the overall completion rate, the 30-day activity volume chart, and the habit comparison breakdown.
   - Navigate to **Habits** management. Show filtering, creating a habit (demonstrating Mon/Wed/Fri weekday selection or times-per-week slider), and the **Archived Habits** tab with restored history.
5. **3:45 - 4:30 | Technical Architecture & Test Suite**:
   - Briefly present the monorepo architecture, Prisma PostgreSQL schema, and run `npm test` showing all 31 unit and integration tests passing.

---

## 30. GitHub Submission Instructions
To push to your public GitHub repository:

```bash
# Initialize git repository if not already done
git init
git add .
git commit -m "feat: complete production-ready HabitFlow habit tracker with streaks"

# Link to your remote GitHub repository
git branch -M main
git remote add origin https://github.com/<your-username>/habitflow.git

# Push code to GitHub
git push -u origin main
```
