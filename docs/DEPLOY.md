# SnapCut — How to Go Live (Step-by-Step)
# No coding knowledge required. Follow in order.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — CREATE YOUR ACCOUNTS (30 mins)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create free accounts at each of these:

1. GitHub        → https://github.com          (stores your code)
2. Supabase      → https://supabase.com        (your database)
3. Stripe        → https://stripe.com          (payments)
4. Railway       → https://railway.app         (runs your backend)
5. Vercel        → https://vercel.com          (runs your web frontend)
6. Expo          → https://expo.dev            (builds your mobile app)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — SET UP THE DATABASE (15 mins)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Log into Supabase → click "New Project"
2. Choose a name (e.g. "snapcut"), pick a region, set a strong password
3. Wait ~2 minutes for it to provision
4. Click "SQL Editor" in the left sidebar
5. Open the file: backend/schema.sql
6. Copy ALL the text in that file
7. Paste it into the SQL editor → click "Run"
8. You should see "Success" — your tables are created

Get your keys:
- Go to Settings → API
- Copy "Project URL" → this is your SUPABASE_URL
- Copy "service_role" key (secret) → this is your SUPABASE_SERVICE_KEY

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — SET UP STRIPE (20 mins)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A. Get your API keys:
   - Dashboard → Developers → API keys
   - Copy "Secret key" (starts with sk_live_) → STRIPE_SECRET_KEY
   - Copy "Publishable key" (starts with pk_live_) → paste into frontend/src/lib/config.js

B. Create subscription products:
   - Dashboard → Products → Add product
   - Name: "SnapCut Pro", Price: $12/month recurring
   - Click the price → copy the Price ID (starts with price_) → STRIPE_PRO_PRICE_ID
   - Repeat for VIP: $29/month → STRIPE_VIP_PRICE_ID

C. Set up webhooks:
   - Dashboard → Developers → Webhooks → Add endpoint
   - URL: https://YOUR-BACKEND-URL.railway.app/webhooks/stripe
     (You'll fill in the Railway URL after Step 4)
   - Select events: checkout.session.completed, customer.subscription.deleted,
                    invoice.paid, invoice.payment_failed
   - Copy the "Signing secret" → STRIPE_WEBHOOK_SECRET

D. Enable Stripe Connect:
   - Dashboard → Connect → Get started
   - Choose "Express" accounts
   - This lets barbers receive payouts directly

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — DEPLOY THE BACKEND (20 mins)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Upload the "backend" folder to a new GitHub repository
   - Go to github.com → New repository → name it "snapcut-backend"
   - Upload the backend folder contents

2. Go to railway.app → New Project → Deploy from GitHub
   - Connect your GitHub account
   - Select the snapcut-backend repository

3. Add environment variables in Railway:
   - Click your service → Variables → Add all variables from backend/.env.example
   - Fill in the real values from Steps 2 and 3

   SUPABASE_URL=             (from Step 2)
   SUPABASE_SERVICE_KEY=     (from Step 2)
   STRIPE_SECRET_KEY=        (from Step 3A)
   STRIPE_WEBHOOK_SECRET=    (from Step 3C)
   STRIPE_PRO_PRICE_ID=      (from Step 3B)
   STRIPE_VIP_PRICE_ID=      (from Step 3B)
   JWT_SECRET=               (make up any long random string, 32+ chars)
   FRONTEND_URL=             (your Vercel URL — add this after Step 5)

4. Railway will auto-deploy. Copy your backend URL (e.g. snapcut-backend.up.railway.app)
5. Go back to Stripe → update your webhook URL with this Railway URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — DEPLOY THE WEB FRONTEND (10 mins)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Open frontend/src/lib/config.js
   - Replace the Railway URL with your actual backend URL from Step 4
   - Replace the Stripe publishable key with your real pk_live_ key

2. Upload the "frontend" folder to a new GitHub repo named "snapcut-frontend"

3. Go to vercel.com → New Project → Import from GitHub
   - Select snapcut-frontend
   - Framework: "Create React App" or "Other"
   - Click Deploy

4. Copy your Vercel URL (e.g. snapcut.vercel.app)

5. Go back to Railway → add FRONTEND_URL = your Vercel URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — BUILD THE MOBILE APP (30 mins)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Install tools on your computer:
1. Download Node.js from nodejs.org (click "LTS" version)
2. Open Terminal (Mac) or Command Prompt (Windows)
3. Run: npm install -g expo-cli eas-cli

Build the app:
4. In Terminal, navigate to the frontend folder:
   cd path/to/snapcut/frontend
5. Install dependencies:
   npm install
6. Log in to Expo:
   eas login
7. Configure the build:
   eas build:configure
8. Build for both platforms:
   eas build --platform all
   (This takes ~15 minutes and runs in the cloud — no Mac required for Android)

Submit to app stores:
9. Apple App Store: eas submit --platform ios
   - You need an Apple Developer account ($99/year) → developer.apple.com
10. Google Play: eas submit --platform android
    - You need a Google Play Console account ($25 one-time) → play.google.com/console

Review times:
- Apple: 1-3 days
- Google: A few hours to 2 days

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — TEST BEFORE GOING LIVE (1 day)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use Stripe test mode (replace sk_live_ with sk_test_ temporarily):
- Test card number: 4242 4242 4242 4242
- Any future expiry date, any CVC

Test the full flow:
1. Register as a customer
2. Register as a barber on a second device/account
3. Barber goes online
4. Customer books barber
5. Barber accepts → en_route → complete
6. Check that payment captured in Stripe dashboard
7. Check that barber payout shows in Stripe Connect

When happy → switch back to sk_live_ keys and you're live.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 8 — LEGAL (do before launch)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Register an LLC:
   - Go to stripe.com/atlas ($500) — easiest option, sets up everything
   - Or use your state's business registration portal (~$50-150)

2. Terms of Service + Privacy Policy:
   - Go to termly.io → generate for free
   - Add links to your app's settings screen

3. Add to frontend before launch — 2 lines in your settings screen:
   Terms of Service: https://yoursite.com/terms
   Privacy Policy:   https://yoursite.com/privacy

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COSTS TO RUN SNAPCUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Monthly costs once live:

Railway (backend)       ~$5-20/month
Supabase (database)     Free up to 500MB, then $25/month
Vercel (web)            Free
Expo (mobile builds)    Free for small scale
Stripe (payments)       2.9% + 30¢ per transaction (no monthly fee)
Apple Developer         $99/year
Google Play             $25 one-time
Domain name             ~$12/year

Total to start:         ~$0-20/month + Stripe fees

At 100 bookings/month at $40 avg:
  Revenue:  $800 gross bookings
  Your 20%: $160 platform fee
  Stripe:   ~$24 in fees
  Net:      ~$136/month

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEED HELP?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hire a freelancer to deploy everything for you:
- Upwork.com → search "React Native Expo deployment" → budget $200-500
- They can handle Steps 4-6 in a few hours

Supabase docs:    docs.supabase.com
Stripe docs:      stripe.com/docs
Expo docs:        docs.expo.dev
Railway docs:     docs.railway.app
