# StudyFlow 🎓⚡

A modern student productivity platform that combines study tools, gamification, and social features to make studying more engaging and motivating.

## Features

- **Pomodoro Timer** — Customizable focus sessions with XP rewards
- **AI Quiz Generator** — Upload any PDF and get instant AI-generated quizzes
- **Task Management** — Organize todos by subject, priority, and deadline
- **Study Calendar** — Plan sessions, exams, and assignments
- **Gamification** — XP, levels, badges, streaks, and daily challenges
- **Leaderboards** — Compete with other students
- **Social** — Add friends and track each other's progress
- **Analytics** — Visual charts for study time and productivity

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React, Tailwind CSS
- **Backend**: Next.js API Routes / Server Actions
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (PDF uploads)
- **AI**: Anthropic Claude (quiz generation)
- **Charts**: Recharts

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo>
cd studyflow
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the following files in order:
   - `supabase/schema.sql` — Creates all tables, RLS policies, and seeds achievements
   - `supabase/storage.sql` — Creates the PDF storage bucket
   - `supabase/functions.sql` — Creates helper functions and RPCs
3. Copy your project URL and anon key from **Settings → API**

### 3. Set up Anthropic

1. Get your API key from [console.anthropic.com](https://console.anthropic.com)

### 4. Configure environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
studyflow/
├── app/
│   ├── (auth)/              # Login & Register pages
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/         # Protected app pages
│   │   ├── dashboard/       # Main dashboard
│   │   ├── pomodoro/        # Pomodoro timer
│   │   ├── todos/           # Task management
│   │   ├── calendar/        # Study calendar
│   │   ├── quiz/            # AI Quiz Generator
│   │   ├── achievements/    # Badges & achievements
│   │   ├── leaderboard/     # Global leaderboard
│   │   ├── friends/         # Social features
│   │   ├── profile/         # User profile & stats
│   │   └── subjects/        # Subject management
│   ├── api/
│   │   ├── quiz/generate/   # AI quiz generation endpoint
│   │   ├── pdf/parse/       # PDF upload & parsing endpoint
│   │   ├── subjects/        # Subjects CRUD
│   │   └── gamification/    # XP award endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx             # Landing page
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── layout/              # Sidebar, Header
│   ├── dashboard/           # Dashboard widgets
│   └── providers/           # Theme provider
├── hooks/
│   ├── usePomodoro.ts       # Pomodoro timer logic
│   └── use-toast.ts         # Toast notifications
├── lib/
│   ├── supabase/            # Supabase clients (browser/server)
│   ├── gamification.ts      # XP, streaks, achievements logic
│   └── utils.ts             # Utility functions
├── types/
│   └── index.ts             # TypeScript types & constants
├── supabase/
│   ├── schema.sql           # Database schema + RLS
│   ├── storage.sql          # Storage bucket setup
│   └── functions.sql        # Helper RPC functions
└── middleware.ts            # Auth route protection
```

## Database Schema

### Core Tables
- `profiles` — User profiles with XP, level, streaks
- `subjects` — Study subjects/courses
- `pomodoro_sessions` — Completed Pomodoro sessions
- `todos` — Tasks with priority and deadlines
- `study_events` — Calendar events (study, exam, assignment)

### Quiz System
- `quizzes` — Quiz metadata (linked to PDF)
- `quiz_questions` — Individual questions with options
- `quiz_attempts` — User quiz attempts and scores

### Gamification
- `achievements` — Achievement definitions
- `user_achievements` — Earned achievements
- `daily_challenges` — Daily challenge definitions
- `user_challenge_progress` — User challenge progress
- `xp_transactions` — XP audit log

### Social
- `friendships` — Friend connections with status

## Gamification System

### XP Rewards
| Action | XP |
|--------|-----|
| Complete Pomodoro session | +25 XP |
| Complete low priority task | +5 XP |
| Complete medium priority task | +10 XP |
| Complete high priority task | +15 XP |
| Complete urgent task | +25 XP |
| Quiz completion (60-79%) | +75 XP |
| Quiz completion (80-99%) | +100 XP |
| Perfect quiz score | +150 XP |
| Achievement unlocked | +25–1000 XP |
| Daily challenge | +100 XP |

### Level Progression
XP required per level follows exponential growth: `100 × 1.5^(level-1)`

### Streak System
- Study every day to maintain your streak
- Missing a day resets your streak to 1
- Bonus XP for streak milestones

## Deployment

### Vercel (Recommended)

```bash
npm run build  # Verify build succeeds locally first
```

Then push to GitHub and connect to Vercel. Add environment variables in Vercel dashboard.

### Environment Variables for Production
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_APP_URL` (set to your production URL)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT
