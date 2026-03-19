# BuildOps Lite

BuildOps Lite is a modern, lightweight operational dashboard application built with Next.js, Supabase, and Tailwind CSS. It provides essential tools for managing business operations, including expense tracking, approvals, and seamless integrations.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Database & Auth**: [Supabase](https://supabase.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **UI Components**: [Radix/Lucide](https://lucide.dev/) + [Framer Motion](https://www.framer.com/motion/)
- **Payments**: [Stripe](https://stripe.com/)

## 🛠 Features

- **Authentication**: Secure user authentication via Supabase.
- **Dashboard**: Centralized hub for operational metrics.
- **Expense Management**: Track, approve, and reject expenses.
- **Dark Mode**: Built-in support for multiple themes (System, Light, Dark, OLED).
- **Internationalization**: Support for multiple languages.
- **Responsive Design**: Fast and responsive UI powered by modern CSS features.

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yshxsp/buildops-lite.git
   cd buildops-lite
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Copy the example environment file and fill in your Supabase and Stripe details.
   ```bash
   cp .env.example .env.local
   ```
   **Required variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `STRIPE_SECRET_KEY`

4. Run the development server:
   ```bash
   npm run dev
   ```

## 🔒 Security Best Practices

- **Environment Variables**: Never commit `.env` or `.env.local` files to source control. They are ignored by default in `.gitignore`.
- **Database Rules**: Ensure Supabase Row Level Security (RLS) policies are active for any table accessed by the client.
- **API Keys**: Only prefix public variables with `NEXT_PUBLIC_`. Keep sensitive keys (like Stripe Secret) server-side only.

## 📜 License

This project is licensed under the MIT License.
