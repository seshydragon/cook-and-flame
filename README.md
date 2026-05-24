# 🔥 Cook & Flame

A full-stack recipe community app with AI-powered macro tracking, meal planning, and Stripe payments.

**Stack:** Next.js 15 · Supabase · Stripe · Anthropic Claude (AI photo macros) · Tailwind CSS · Vercel

---

## 🚀 Deploy in 5 steps

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New project
2. Go to **SQL Editor** → paste the contents of `supabase-schema.sql` → Run
3. Go to **Settings → API** → copy your Project URL and anon key

### 2. Set up Stripe
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Create two **Products** (Pro $7/mo and Family $14/mo) with monthly recurring prices
3. Copy the price IDs (start with `price_`)
4. Go to **Developers → Webhooks** → Add endpoint:
   - URL: `https://your-app.vercel.app/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `customer.subscription.updated`
5. Copy your webhook signing secret

### 3. Get your Anthropic API key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key

### 4. Configure environment variables
```bash
cp .env.local.example .env.local
# Fill in all values
```

### 5. Deploy to Vercel
```bash
npx vercel
```
Add all your env vars in Vercel dashboard under **Settings → Environment Variables**.

---

## 💻 Run locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

For Stripe webhooks locally:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

## ✨ Features

| Feature | Free | Pro | Family |
|---|---|---|---|
| Browse & add recipes | ✅ | ✅ | ✅ |
| Save recipes | 10 max | Unlimited | Unlimited |
| Macro tracking | ✅ | ✅ | ✅ |
| **AI photo macro analysis** | ❌ | ✅ | ✅ |
| Meal planner | ❌ | ✅ | ✅ |
| Family profiles (up to 5) | ❌ | ❌ | ✅ |

---

## 📁 Project structure

```
cook-and-flame/
├── app/
│   ├── page.tsx                   # Home / recipe feed
│   ├── add/page.tsx               # Add recipe
│   ├── recipes/[id]/page.tsx      # Recipe detail
│   ├── macro-tracker/page.tsx     # Macros + AI photo analysis
│   ├── meal-planner/page.tsx      # Weekly meal planner
│   ├── pricing/page.tsx           # Plans + Stripe checkout
│   ├── profile/page.tsx           # Profile + settings
│   ├── auth/page.tsx              # Sign in / sign up
│   └── api/
│       ├── analyze-macros/        # Claude vision API
│       └── stripe/checkout+webhook
├── lib/supabase.ts
├── lib/stripe.ts
├── types/index.ts
└── supabase-schema.sql            # Paste into Supabase SQL editor
```
