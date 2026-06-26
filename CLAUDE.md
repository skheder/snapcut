# SnapCut — Project Context

## What this is
On-demand barber booking app. Customers book barbers, barbers manage availability and get paid out via Stripe Connect.

## Stack
- **Frontend:** React Native / Expo (Android build via EAS)
- **Backend:** Node / Express, hosted on Railway
- **Database:** Supabase
- **Payments:** Stripe Connect (barber payouts)

## Current status
- Full stack built and deployed (Railway backend, Supabase DB, Stripe Connect live)
- Android APK built via EAS
- iOS on hold — requires a paid Apple Developer account
- App is currently buggy on Android — primary blocker to launch

## Known outstanding issues / cleanup items
1. **Revert Stripe bypass** in `BarberDashScreen.js` — a temporary bypass was added during testing and needs to be removed before real payments go live
2. **Post-reload navigation** — after an app reload, users should land back on their active booking screen if one exists; not currently implemented
3. **Debug logs** — clean up leftover `console.log` / debug statements before release
4. **Duplicate payments file** — there's a duplicate/orphaned payments-related file that needs to be identified and deleted
5. **Android crash** — currently the top blocker; needs root-causing (crash logs, stack traces, repro steps TBD)

## Launch context
- Target market: Perth, Australia
- Primary non-technical blocker: recruiting barbers onto the platform (alongside the Apple Developer account for iOS)

## Working preferences
- Project owner (Samir) describes himself as non-technical in mobile/web dev — prefer clear explanations over assumed familiarity with React Native/Expo internals
- Background: Oracle DBA by trade (RAC, EBS, PeopleSoft, Exadata) — comfortable with SQL, shell scripting, systems concepts; React Native/mobile is the newer territory
- Prefer being walked through *why* a fix works, not just the diff
