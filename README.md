# 🎓 PK Assessment Hub

A clean, reliable, and functional online assessment and aptitude platform built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM with SQLite**.

---

## 🌟 Key Highlights & Features

### 1. 👥 Role-Based Authentication & Access Control
- **Admin**: Full control over Question Bank, AI Generation, Test Creation, and Audit Results.
- **Candidate / Student**: Clean dashboard to browse available assessments, take timed tests, and view detailed scores.
- **Pre-seeded Accounts** with 1-click login on `/login`:
  - 👑 **Admin**: `admin@pk.com` / `admin123`
  - 👨🎓 **Student**: `student@pk.com` / `student123`

---

### 2. ❓ Question Management & AI Question Generator
- **Manual Question Builder**:
  - Multiple-choice questions with 4 options.
  - Radio selector for the exact correct answer.
  - Marks assignment and step-by-step explanations.
  - Categories: Quantitative Aptitude, Logical Reasoning, Verbal Ability, English, Programming, General Knowledge, or Custom Topics.
  - Difficulty levels: `Easy`, `Medium`, `Hard`.
- **AI Question Generation Service**:
  - Enter topic (e.g. *"Percentage"*, *"Profit & Loss"*, *"Time & Work"*), difficulty, and question count.
  - Supports Google Gemini API key (`GEMINI_API_KEY`) with an intelligent offline aptitude engine fallback so it functions seamlessly out-of-the-box.
  - Admin reviews, selects, and edits AI questions before committing them to the Question Bank.

---

### 3. 📝 Assessment & Test Management
- Create assessments specifying title, description, and time duration in minutes.
- Interactive question selector from the bank with live question counter and total marks tally.
- **Publish / Draft Toggle**: Control when assessments become visible to candidates.
- Real-time statistics: Participant counts and average scores.

---

### 4. 🧠 Interactive Assessment Experience
- Single-question view with navigation (Previous / Next / Direct Jump).
- **Question Palette**: Color-coded numbers indicating answered (emerald) vs unanswered (slate) questions.
- **Countdown Timer**: Automatically monitors remaining time and auto-submits when time expires.
- **Real-Time Auto-Save**: Saves candidate responses as options are clicked to prevent accidental data loss.
- **Submit Confirmation Dialog**: Summarizes answered vs unanswered questions before final submission.

---

### 5. 📊 Automatic Evaluation & Results System
- Deterministic scoring for MCQ questions.
- Result metrics: Total Score, Percentage, Correct count, Wrong count, Unanswered count, and Time taken.
- **Question-by-Question Review**: Visual indicators for candidate choice, correct answer, and step-by-step explanations.
- **AI Performance Insights**: Diagnostic feedback highlighting mastery level and areas for improvement.

---

### 6. 👑 Administrator Dashboard
- Metric counters: Total Users, Total Tests, Total Questions, Total Attempts, Average Accuracy.
- Audit table of recent candidate attempts with scores, timestamps, and deep-dive view links.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js API Routes, Prisma ORM.
- **Database**: SQLite (`dev.db`), zero configuration required.
- **Auth & Security**: JWT session cookies (`jose`), salted password hashing (`bcryptjs`), API route protection.
- **AI Integration**: Google Gemini API (`GEMINI_API_KEY`) + Offline Aptitude Fallback Engine.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup & Seeding
```bash
npx prisma generate
npx prisma db push
node scripts/seed.mjs
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Start
```bash
npm run build
npm start
```

### 5. Run Comprehensive End-to-End Test Suite
```bash
node scripts/start-and-test.mjs
```

---

## 🔑 Environment Configuration (`.env`)

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="pk-assessment-hub-super-secret-key-production-ready"

# Optional Gemini API Key (offline fallback engine generates questions if unset)
GEMINI_API_KEY=""
```

