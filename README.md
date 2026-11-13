# STUDYFLOW — Student Productivity SaaS

> **Plan Smart. Study Better. Achieve More.**

STUDYFLOW is a complete, production-grade academic productivity platform designed specifically for students to organize coursework, schedule daily activities, adhere to timetable lectures, track measurable study goals, manage assignments, and prepare for examinations.

---

## 🚀 Key Features

1. **Personalized Dashboard**
   - Time-based greeting, student identity, current date, and daily motivational quotes.
   - 4 independent progress cards with isolated data sources:
     - **Daily Planner Progress**: `(completed activities / eligible activities) × 100`
     - **Task Completion**: `(completed tasks / non-cancelled tasks) × 100`
     - **Timetable Adherence**: `(attended sessions / eligible sessions) × 100`
     - **Study Goal Progress**: `(achieved / target) × 100` (capped strictly at 100%)
   - Study streak tracker, focus minutes, upcoming class alert, assignment deadlines, and exam countdowns.

2. **Daily Planner (Main Feature)**
   - Date picker with previous/next day jumps and a "Today" quick toggle.
   - Hour-by-hour vertical timeline from 06:00 AM to 11:00 PM.
   - Instant schedule conflict detection and warning banners.
   - Reusable day templates (*College Day*, *Study Day*, *Exam Preparation*, *Weekend*, *Holiday*).
   - CRUD actions: Create, Edit, Delete, Duplicate, Postpone, and Cancel (excluded from completion denominator).
   - Daily reflections, morning intent, and evening review journaling.

3. **Task Management**
   - 3 dynamic views: **List View**, **Kanban Board** (To Do, In Progress, Completed, Cancelled), and **Calendar View**.
   - Filtering by subject, priority, and status; sorting by due date or priority.
   - Automatic overdue detection based on local deadline and time.

4. **Timetable Tracker**
   - Monday to Sunday weekly schedule view and single-day deep dive.
   - Start and complete lecture sessions manually.
   - Independent timetable adherence formula excluding future and cancelled sessions.

5. **Measurable Study Goals**
   - Target vs achieved value tracking with custom units (chapters, hours, problems, pages).
   - Individual progress rings capped at 100%.
   - Quick increment (+5 chapters) or absolute value updates.

6. **Examination Hub**
   - Countdown badges ("X days left", "TODAY", "PAST").
   - Expandable syllabus checklist with topic completion percentages.
   - High-yield important questions bank and revision strategies.

7. **Assignment Tracker**
   - Submission deadline countdowns and overdue indicators.
   - Priority tagging and "Mark as Submitted" workflow.

8. **Focus Mode (Pomodoro Timer)**
   - 25m Focus, 5m Short Break, 15m Long Break, and custom duration modes.
   - Subject-tagged focus session history logged persistently.

9. **Unified Academic Calendar**
   - Month, Week, and Day views displaying activities, tasks, timetable lectures, assignments, and exam dates color-coded.

10. **Analytics Dashboard**
    - 4 independent analytics sections powered by Recharts (Bar, Line, and Donut charts).
    - Planned vs actual study hours, completion trends, and time efficiency ratio.

11. **Notes & Journal**
    - Searchable study notes, revision summaries, and daily journal entries categorized by subject.

12. **Settings & Customization**
    - Profile management (institution, major, semester).
    - Dark mode, Light mode, and System theme.
    - 12h / 24h clock format and Monday vs Sunday week start.
    - Custom subject management with color pickers.
    - Full JSON workspace export.

---

## 🛠 Tech Stack

### 📅 Google Calendar Integration

- Added a **Google Calendar Sync** modal (`GoogleCalendarSyncModal`) with quick reminder buttons for activities, tasks, exams, and assignments.
- Implemented utility functions in `src/lib/google-calendar.ts` to open pre‑filled Google Calendar event URLs and generate downloadable `.ics` files.
- New `GoogleCalendarIcon` component for consistent UI.
- Buttons now include `aria-label` attributes for screen‑reader accessibility.

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui design patterns
- **Icons**: Lucide React
- **Charts**: Recharts
- **Routing**: React Router v7
- **Database & Auth**: Supabase PostgreSQL + Supabase Auth
- **Persistence**: Hybrid Supabase + LocalStorage Fallback (works immediately out of the box without setup, or with your own Supabase project)

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Build for Production
```bash
npm run build
```

---

## 🗄 Database Setup (Supabase)

If you wish to link your personal Supabase project:
1. Copy `.env.example` to `.env`.
2. Add your Supabase Project URL and Anon Key:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Open the Supabase **SQL Editor** and run the contents of [`supabase_schema.sql`](./supabase_schema.sql). This creates all 11 tables, constraints, performance indexes, Row-Level Security policies, and the user signup profile trigger.

---

## 🧪 Verification & Test Suite

Run the automated mathematical calculation verification suite:
```bash
node test-calculations.mjs
```
Expected output:
```
=== RUNNING STUDYFLOW SYSTEM TEST SUITE ===

✅ PASS: TEST 1: 10 daily activities, 7 completed (Expected 70%, Got 70%)
✅ PASS: TEST 2: 20 tasks, 15 completed, 5 pending (Expected 75%, Got 75%)
✅ PASS: TEST 3: 10 eligible timetable sessions, 8 completed (Expected 80%, Got 80%)
✅ PASS: TEST 4: Goal target 100 chapters, achieved 60 (Expected 60%, Got 60%)
✅ PASS: TEST 5: Delete a completed task recalculates statistics (Expected 74%, Got 74%)
✅ PASS: TEST 6: Cancelled activity excluded from denominator (Eligible: 9, Expected: 78%, Got: 78%)
✅ PASS: TEST 7: Future timetable session excluded from eligible denominator (Eligible: 10, Adherence: 80%)
✅ PASS: TEST 8: Goal progress capped at 100% (Expected 100%, Got 100%)

=== TEST SUITE RESULTS: ALL 8 TESTS PASSED ✨ ===
```
