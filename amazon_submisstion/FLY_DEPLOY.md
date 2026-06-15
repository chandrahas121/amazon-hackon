# Deploy REVIVE to Fly.io — Step by Step

---

## Step 1 — Install flyctl (Fly.io CLI)

Open PowerShell and run:

```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

Close and reopen PowerShell after installing. Confirm it worked:

```powershell
fly version
```

You should see something like `fly v0.2.x ...`

---

## Step 2 — Sign Up / Log In

```powershell
fly auth signup
```

This opens a browser. Sign up with GitHub or email. **No credit card needed.**

If you already have an account:
```powershell
fly auth login
```

---

## Step 3 — Create the App on Fly.io

Run this from the **repo root** (`amazon-hackon/` folder):

```powershell
fly launch --no-deploy
```

Fly.io will ask you questions — answer like this:

```
? Choose an app name (leave blank to generate one): revive-hackon
? Choose a region for deployment: sin (Singapore) ← closest to India
? Would you like to set up a PostgreSQL database? No  ← we use Supabase
? Would you like to set up an Upstash Redis database? No  ← we use Upstash
? Would you like to deploy now? No
```

This creates your app on Fly.io and updates `fly.toml` with your real app name.

**After this, open `fly.toml` and check the `app =` line has your actual app name.**

---

## Step 4 — Set Environment Variables (Secrets)

Run these one by one in PowerShell. Replace every value with your actual values:

```powershell
fly secrets set SECRET_KEY="any-long-random-string-at-least-50-chars-change-this-1234"
fly secrets set DEBUG="False"
fly secrets set ALLOWED_HOSTS="revive-hackon.fly.dev"
fly secrets set CORS_ALLOWED_ORIGINS="https://your-frontend.vercel.app"
fly secrets set CSRF_TRUSTED_ORIGINS="https://your-frontend.vercel.app"
```

AWS S3 (from SERVICES_SETUP.md Part 1):
```powershell
fly secrets set AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
fly secrets set AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
fly secrets set AWS_STORAGE_BUCKET_NAME="revive-hackon-yourname"
fly secrets set AWS_S3_REGION_NAME="ap-south-1"
```

Supabase PostgreSQL (from SERVICES_SETUP.md Part 2):
```powershell
fly secrets set DATABASE_URL="postgresql://postgres:YourPassword@db.xxxx.supabase.co:5432/postgres"
```

Upstash Redis (from SERVICES_SETUP.md Part 3):
```powershell
fly secrets set REDIS_URL="rediss://default:xxxx@caring-condor-xxxxx.upstash.io:6379"
```

OpenRouter (for ML grading):
```powershell
fly secrets set LLM_PROVIDER="openrouter"
fly secrets set OPENROUTER_API_KEY="sk-or-v1-..."
```

Verify all secrets are set:
```powershell
fly secrets list
```

---

## Step 5 — Deploy

```powershell
fly deploy
```

This will:
1. Build your Docker image (takes 2–4 min first time)
2. Run `python manage.py migrate` automatically (the `release_command` in fly.toml)
3. Start the app

Watch the logs — you should see:
```
==> Monitoring deployment
 1 desired, 1 placed, 1 healthy, 0 unhealthy
--> v1 deployed successfully
```

---

## Step 6 — Seed the Database

Run this once to add demo listings:

```powershell
fly ssh console --command "python manage.py seed_demo"
```

If `seed_demo` fails try:
```powershell
fly ssh console --command "python manage.py seed_db"
```

---

## Step 7 — Get Your Live URL

```powershell
fly status
```

Your backend URL is: `https://revive-hackon.fly.dev`

Test it:
- Open `https://revive-hackon.fly.dev/api/listings/` in browser → should return JSON

---

## Step 8 — Connect Frontend (Vercel)

1. Go to **vercel.com** → your project → Settings → Environment Variables
2. Set: `VITE_API_URL` = `https://revive-hackon.fly.dev`
3. Click **Redeploy**

---

## Useful Commands After Deployment

```powershell
# See live logs (like watching the server in real time)
fly logs

# SSH into the running container (run any Django command)
fly ssh console

# Run a specific Django command
fly ssh console --command "python manage.py createsuperuser"

# Redeploy after code changes
fly deploy

# Check app status
fly status

# Scale to 2 instances (horizontal scaling!)
fly scale count 2

# Scale back to 1
fly scale count 1
```

---

## If Something Goes Wrong

**"Error: app not found"**
→ Run `fly launch --no-deploy` first (Step 3)

**Deploy fails with "SECRET_KEY" error**
→ Run: `fly secrets set SECRET_KEY="any-long-string-here"`

**"Connection refused" on the URL**
→ Run `fly logs` and look for the error. Usually a wrong env var.

**Migrations fail**
→ Check your `DATABASE_URL` is correct:
```powershell
fly secrets list
fly ssh console --command "python manage.py migrate --noinput"
```

**Images not uploading to S3**
→ Check `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct:
```powershell
fly secrets set AWS_ACCESS_KEY_ID="correct-key"
fly secrets set AWS_SECRET_ACCESS_KEY="correct-secret"
fly deploy
```

---

## Final Stack Summary (What You Have)

```
User
 ↓
Vercel (React frontend) ←── VITE_API_URL
 ↓
Fly.io (Django backend — always on, no cold starts, free)
 ↓              ↓              ↓
Supabase    Upstash Redis   AWS S3
PostgreSQL  (cache +        (product
(database)   demand index)   photos)
```

This is a real production stack. Every service is either free or within free tier.
