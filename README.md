# Car Pool – Kanha Shanti Vanam Community

A mobile-friendly car pool app for the Hyderabad community near Kanha Shanti Vanam. Drivers offer rides; riders request to join. Approved riders can live-track the driver’s location on the way.

## 100% free stack

This app uses **only free software and free tiers**. No credit card, no paid APIs.

| Layer | Technology | Free tier / license |
|-------|------------|---------------------|
| **Framework** | Next.js, React | MIT (open source) |
| **Styling** | Tailwind CSS | MIT |
| **Database & auth** | Supabase | Free tier: 500MB DB, 50K MAU, 2GB bandwidth |
| **Hosting (frontend)** | Vercel or Netlify | Free tier: 100GB bandwidth (Netlify), hobby (Vercel) |
| **Maps** | Leaflet + OpenStreetMap | Free, no API key |
| **Other deps** | date-fns, TypeScript, etc. | MIT / open source |

**Authentication**: Email magic link (Supabase, free). Mobile number is stored in your profile for coordination—no SMS/OTP (that would need a paid provider like Twilio). You can still share your number with drivers/riders via the app.

## Features (MVP)

- **Sign in** with email (magic link). Add your **mobile number** in Profile for coordination.
- **Offer a ride**: Set from/to (default: Kanha Shanti Vanam), date, time, seats.
- **Browse rides**: See upcoming rides and open a ride to request to join.
- **Request to join**: Optional pickup location; driver sees requests and can Approve/Reject.
- **Live tracking**: Driver shares location from the app; approved riders see the driver on a map (OpenStreetMap).

## Tech stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend / DB / Auth**: [Supabase](https://supabase.com) (PostgreSQL, Auth, Realtime) — free tier
- **Maps**: Leaflet + OpenStreetMap (no API key, no cost)

## Quick start

### 1. Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. In **SQL Editor**, run the contents of `supabase/schema.sql`.
3. In **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000` (or your production URL)
   - Redirect URLs: `http://localhost:3000/auth/callback` (and your production callback URL when you deploy)

### 2. Env and run

```bash
cp .env.local.example .env.local
# Edit .env.local: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with your email (magic link), then add your mobile number in **Profile**.

## Free hosting (MVP)

Use **only free tiers**; no credit card required.

### Frontend (pick one)

- **[Vercel](https://vercel.com)** (free Hobby)  
  - Connect your Git repo. Set env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.  
  - In Supabase **Authentication → URL Configuration**, set Site URL and add `https://your-app.vercel.app/auth/callback` to Redirect URLs.

- **[Netlify](https://netlify.com)** (free tier, allows commercial use)  
  - Build: `npm run build`. Publish: use the Next.js build output (or Netlify’s Next.js plugin).  
  - Same env vars and Supabase redirect URLs as above.

### Backend

- **Supabase** (free tier)  
  - One Supabase project. Free tier includes PostgreSQL, Auth (email magic link), Realtime.  
  - No separate backend server or paid APIs.

### Staying on free tiers

- **Supabase**: Stay within free limits (e.g. 500MB database, 50K monthly active users). Monitor usage in the dashboard.
- **Vercel**: Hobby is for non-commercial use; for a community/org, Netlify’s free tier allows commercial use.
- **Maps**: OpenStreetMap tiles are free; no Google Maps or other paid map API.

## Project structure

```
src/
  app/
    auth/          # Login, callback
    dashboard/     # Rides list, new ride, ride detail, my rides, profile
    dashboard/track/[id]/  # Live map (driver share / rider track)
  lib/
    supabase/      # Client, server, middleware
    types.ts
supabase/
  schema.sql       # Tables, RLS, trigger, realtime
```

## Realtime

- **Driver location**: Stored in `driver_locations` (one row per ride). Driver’s browser updates it every few seconds; approved riders subscribe via Supabase Realtime (Postgres changes) and see the position on the map.

## License

Use and modify as you like for your community.
