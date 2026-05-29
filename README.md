# 🏗️ BuildOps Pro — Autonomous Construction Operations

BuildOps Pro is a next-generation operational platform that eliminates manual data entry through AI-powered verification and IoT automation. Built to provide a technological "Moat" in the 2026 construction SaaS market.

---

## 🚀 Key Features

- **📱 Full PWA Support:** Installable on iOS and Android for a native mobile experience.
- **🤖 AI Task Verification:** Automated task completion via Gemini Vision photo analysis (eliminates manual reporting).
- **🛰️ Hardware Bridge:** Real-time IoT Asset & Equipment tracking (Live GPS/Telemetry simulation).
- **🤖 AI Receipt Parsing:** Automatic vendor, amount, and item extraction using Google Gemini AI.
- **🔐 Role-Based Access:** Distinct workflows for Contractors (Admins) and Subcontractors.
- **💳 Payment Integration:** One-click payouts and transaction history via Stripe Connect.

---

## 🛠 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Runtime:** [React 19](https://react.dev/)
- **Database & Auth:** [Supabase](https://supabase.com/) (Postgres + RLS)
- **AI Engine:** [Google Gemini AI](https://aistudio.google.com/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://framer.com/motion)
- **State:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons:** [Lucide React](https://lucide.dev/)

---

## 📦 Getting Started

### 1. Installation
```bash
git clone https://github.com/yshxsp/buildops-lite.git
cd buildops-lite
npm install
```

### 2. Environment Setup
Copy the example environment file and fill in your credentials from Supabase, Stripe, and Google AI Studio.
```bash
cp .env.example .env.local
```

### 3. Development
```bash
npm run dev
```

---

## 🚀 Deployment

The project is optimized for [Vercel](https://vercel.com).
1. Connect your GitHub repository.
2. Add your `.env` variables in the Vercel Dashboard.
3. Update your **Supabase Redirect URL** to point to your Vercel deployment domain.

---

## 🛡 Security

- **Safe History:** Repository history is clean and contains no sensitive API keys.
- **Row Level Security:** All database operations are secured via Supabase RLS.
- **Server-Side Validation:** Critical mutations are handled through secure Server Actions.

## 📜 License

This project is licensed under the MIT License.
