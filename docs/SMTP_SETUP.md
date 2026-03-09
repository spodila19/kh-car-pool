# Auth options for 50+ users

## Option 1: Google Sign-In (free, no limits)

**Best for 50+ users** — no email sending, no rate limits, completely free.

Users click "Sign in with Google" and are logged in instantly. No magic link email is sent.

### Setup (one-time)

#### Step 1: Create a Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown (top left) → **New Project**
3. Name it (e.g. "Kanha Car Pool") → **Create**

#### Step 2: Configure OAuth consent screen

1. Left menu → **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for any Google user) → **Create**
3. Fill in:
   - **App name:** Kanha Car Pool
   - **User support email:** your email
   - **Developer contact:** your email
4. Click **Save and Continue** through Scopes (default is fine) and Test users (skip for production)
5. Click **Back to Dashboard**

#### Step 3: Create OAuth client ID

1. Left menu → **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. **Application type:** Web application
4. **Name:** Kanha Car Pool (or any name)
5. **Authorized JavaScript origins** → **+ Add URI**:
   - `http://localhost:3000` (for local dev)
   - `https://your-app.vercel.app` (your production URL)
6. **Authorized redirect URIs** → **+ Add URI**:
   - Get this from **Supabase Dashboard** → **Authentication** → **Providers** → **Google** (click Enable to see it)
   - Format: `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`
   - Example: `https://abcdefgh.supabase.co/auth/v1/callback`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret** (you'll need these for Supabase)

#### Step 4: Enable in Supabase

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Google**
2. Toggle **Enable**
3. Paste **Client ID** and **Client Secret**
4. Click **Save**

Done. Users can now sign in with Google.

---

## Option 2: Email + password (no email sending)

Users can create an account with email + password and sign in directly — no magic link or email needed each time.

**Supabase setup:** **Authentication** → **Providers** → **Email** → turn **off** "Confirm email" so users can log in immediately after signup (otherwise they must click a confirmation link first).

---

## Option 3: Custom SMTP (for email magic link)

Supabase built-in SMTP allows about **4 emails per hour** — not enough for 50+ users. If you keep email magic link, set up custom SMTP.

### Option 3A: Resend (recommended, free tier)

- **Free tier:** 100 emails/day, 3,000/month
- Good for 50+ users with moderate login frequency

### Steps

1. Sign up at [resend.com](https://resend.com)
2. **Domains** → Add and verify your domain (or use `onboarding@resend.dev` for testing)
3. **API Keys** → Create an API key, copy it
4. **Supabase Dashboard** → **Project Settings** → **Auth** → **SMTP Settings**:
   - Enable custom SMTP
   - **Sender email:** `noreply@yourdomain.com` (or `onboarding@resend.dev` for testing)
   - **Sender name:** `Kanha Car Pool`
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend`
   - **Password:** your Resend API key
5. **Authentication** → **Rate Limits** → increase `rate_limit_otp` to 100+ per hour

### Option 3B: Brevo (300 emails/day free)

- **Free tier:** 300 emails/day
- Best free option for 50+ active users

### Steps

1. Sign up at [brevo.com](https://www.brevo.com)
2. **SMTP & API** → Get SMTP credentials
   - Host: `smtp-relay.brevo.com`
   - Port: `587`
3. In Supabase: **Project Settings** → **Auth** → **SMTP Settings** — use Brevo host, port, username, password

### Option 3C: SendGrid (100 emails/day free)

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. SMTP: Host `smtp.sendgrid.net`, port `587`, username `apikey`, password = your API key
4. Configure in Supabase as above

## After setup

- Supabase imposes a default 30 emails/hour limit with custom SMTP — increase it in **Authentication** → **Rate Limits**
- Verify your domain in your email provider for better deliverability (avoids spam folder)
