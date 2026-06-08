# SnapCut — Deployment Guide (Non-Technical)

Follow these steps in order. Each step links to where you go.
Estimated total time: 3–4 hours the first time.

---

## STEP 1 — Create your accounts (free)

Sign up for these services if you haven't already:

| Service     | URL                        | What it does               |
|-------------|----------------------------|----------------------------|
| Supabase    | https://supabase.com       | Your database              |
| Railway     | https://railway.app        | Hosts your backend server  |
| Vercel      | https://vercel.com         | Hosts your web app         |
| Stripe      | https://stripe.com         | Payments                   |
| GitHub      | https://github.com         | Stores your code           |

---

## STEP 2 — Set up the database (Supabase)

1. Go to https://supabase.com → "New project"
2. Name it "snapcut", set a strong password, choose a region near your users
3. Once created, click **SQL Editor** in the left sidebar
4. Open the file `backend/schema.sql` from this folder
5. Copy the entire contents → paste into the SQL editor → click **Run**
6. Go to **Settings → API** and copy:
   - `Project URL` → this is your `SUPABASE_URL`
   - `service_role` key → this is your `SUPABASE_SERVICE_KEY`
   Keep the service key secret — never share it.

---

## STEP 3 — Set up Stripe

1. Go to https://dashboard.stripe.com
2. Click **Developers → API keys** and copy your:
   - Secret key (`sk_live_...`) → `STRIPE_SECRET_KEY`
   - Publishable key (`pk_live_...`) → paste into `frontend/src/lib/config.js`
3. Create subscription products:
   - Go to **Products → Add product**
   - Create "SnapCut Pro" → $12/month → copy the Price ID → `STRIPE_PRO_PRICE_ID`
   - Create "SnapCut VIP" → $29/month → copy the Price ID → `STRIPE_VIP_PRICE_ID`
4. Set up webhooks (after deploying backend in Step 5):
   - Go to **Developers → Webhooks → Add endpoint**
   - URL: `https://your-backend.railway.app/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.paid`
   - Copy the signing secret → `STRIPE_WEBHOOK_SECRET`

---

## STEP 4 — Push code to GitHub

1. Install Git: https://git-scm.com/downloads
2. Open Terminal (Mac) or Command Prompt (Windows)
3. Run these commands:

```bash
cd snapcut
git init
git add .
git commit -m "Initial SnapCut codebase"
```

4. Go to https://github.com → New repository → name it "snapcut" → Create
5. Run the commands GitHub shows you (the ones starting with `git remote add origin...`)

---

## STEP 5 — Deploy the backend (Railway)

1. Go to https://railway.app → New Project → Deploy from GitHub repo
2. Select your "snapcut" repo → select the `/backend` folder
3. Click **Variables** and add every line from `backend/.env.example`
   with your real values filled in
4. Railway will give you a URL like `snapcut-backend.railway.app`
   → copy this → it's your `FRONTEND_URL` in the backend env,
   and your `API_URL` in `frontend/src/lib/config.js`

---

## STEP 6 — Deploy the web frontend (Vercel)

1. Go to https://vercel.com → New Project → Import from GitHub
2. Select your "snapcut" repo → set **Root Directory** to `frontend`
3. Framework preset: **Expo** (or Other)
4. Deploy — Vercel gives you a URL like `snapcut.vercel.app`
5. Update `FRONTEND_URL` in your Railway backend environment to this URL

---

## STEP 7 — Publish mobile apps

### iOS (App Store)
1. Install Xcode (Mac only) and create an Apple Developer account ($99/year):
   https://developer.apple.com
2. Install EAS CLI: `npm install -g eas-cli`
3. In the `frontend` folder run:
   ```bash
   eas login
   eas build --platform ios
   eas submit --platform ios
   ```
4. Apple review takes 1–3 days

### Android (Google Play)
1. Create a Google Play Developer account ($25 one-time):
   https://play.google.com/console
2. Run:
   ```bash
   eas build --platform android
   eas submit --platform android
   ```

---

## STEP 8 — Test everything before going live

Use Stripe test mode first (keys starting with `sk_test_` / `pk_test_`).

Test card numbers:
- ✅ Success: `4242 4242 4242 4242`  expiry: any future date  CVC: any 3 digits
- ❌ Decline: `4000 0000 0000 0002`

Test flow:
1. Register as a customer
2. Register as a barber on another device/browser
3. Barber: connect Stripe (use test mode), go online
4. Customer: find barber, book, pay with test card
5. Barber: accept → en route → arrived → start cut → done
6. Check Stripe dashboard to confirm payment captured
7. Check barber earnings screen

---

## STEP 9 — Switch to live mode

1. In Stripe: toggle off Test Mode
2. Update `STRIPE_SECRET_KEY` to your live key (`sk_live_...`)
3. Update `frontend/src/lib/config.js` publishable key to `pk_live_...`
4. Redeploy backend on Railway, rebuild mobile apps with EAS

---

## Monthly costs when running

| Service     | Cost             |
|-------------|------------------|
| Supabase    | Free (up to 500MB DB, 2GB bandwidth) |
| Railway     | ~$5–20/mo        |
| Vercel      | Free (Hobby tier) |
| Stripe      | 2.9% + 30¢ per transaction (no monthly fee) |
| Apple Dev   | $99/year         |
| Google Play | $25 one-time     |
| **Total**   | **~$130 first year** |

---

## Getting your first barbers

1. DM 10 local barbers on Instagram. Show them the app.
2. Offer **0% commission for the first 3 months**
3. They promote the app to their existing clients → you get your first users free
4. Once you have 5 barbers and 50 customers, turn on commission

---

## Need help?

If you get stuck on any step, come back and say exactly which step
and what error message you see. I'll help you fix it.
