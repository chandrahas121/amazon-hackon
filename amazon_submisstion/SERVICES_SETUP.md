# Setting Up AWS S3 + PostgreSQL + Redis
### Complete step-by-step guide — no assumed knowledge

---

## Overview — What You're Setting Up

| Service | What it does | Time |
|---|---|---|
| **AWS S3** | Stores uploaded product photos (instead of your laptop) | 15 min |
| **Supabase** | Free PostgreSQL database (instead of SQLite file) | 10 min |
| **Upstash** | Free Redis (for caching + demand index) | 5 min |

After this, your app uses real cloud services just like production.

---

## Part 1 — AWS S3 (Image Storage)

### Step 1.1 — Create AWS Account
1. Go to **aws.amazon.com** → click "Create an AWS Account"
2. Fill in email, password, account name
3. You'll need a credit card for verification — **you will NOT be charged** for S3 within free tier limits (5GB storage, 20,000 downloads/month)
4. Choose "Basic support" (free)
5. Complete phone verification

### Step 1.2 — Create the S3 Bucket
1. Log into AWS Console → search for **"S3"** in the search bar → open S3
2. Click **"Create bucket"**
3. Fill in:
   - **Bucket name:** `revive-hackon-yourname` (replace `yourname` — must be globally unique, all lowercase, no spaces)
   - **AWS Region:** `ap-south-1` (Mumbai — closest to India) or `us-east-1`
   - **Uncheck "Block all public access"** → a warning appears → check the box that says "I acknowledge..."
4. Scroll to bottom → click **"Create bucket"**

### Step 1.3 — Make the Bucket Publicly Readable
This lets anyone view product images without needing AWS credentials.

1. Click on your bucket name → go to **"Permissions"** tab
2. Scroll to **"Bucket policy"** → click **"Edit"**
3. Paste this (replace `revive-hackon-yourname` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::revive-hackon-yourname/*"
    }
  ]
}
```

4. Click **"Save changes"**

### Step 1.4 — Create IAM User (so Django can upload to S3)
IAM = Identity and Access Management. You're creating a "robot user" that Django uses to upload files.

1. In AWS Console → search for **"IAM"** → open IAM
2. Left sidebar → **"Users"** → click **"Create user"**
3. Username: `revive-s3-uploader` → click **Next**
4. **"Attach policies directly"** → search for **"AmazonS3FullAccess"** → check it → click **Next** → click **"Create user"**
5. Click on `revive-s3-uploader` → go to **"Security credentials"** tab
6. Scroll to **"Access keys"** → click **"Create access key"**
7. Choose **"Application running outside AWS"** → click **Next** → click **"Create access key"**
8. **IMPORTANT: Copy both keys now — you can never see the secret key again**
   - `Access key ID` — looks like `AKIAIOSFODNN7EXAMPLE`
   - `Secret access key` — looks like `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`

### Step 1.5 — Test S3 is working
Before connecting to Django, verify the bucket is set up:
1. Go to your bucket → **"Objects"** tab → click **"Upload"**
2. Upload any image from your computer
3. Click on the uploaded file → copy the **"Object URL"** (looks like `https://revive-hackon-yourname.s3.ap-south-1.amazonaws.com/test.jpg`)
4. Open that URL in a new browser tab — the image should display
5. If it displays → S3 is correctly configured as public
6. Delete the test file

---

## Part 2 — Supabase PostgreSQL (Database)

Supabase gives you a real PostgreSQL database for free. No credit card needed.

### Step 2.1 — Create Supabase Account
1. Go to **supabase.com** → click "Start your project"
2. Sign up with GitHub (easiest) or email
3. Verify your email if prompted

### Step 2.2 — Create a Project
1. Click **"New project"**
2. Fill in:
   - **Name:** `revive`
   - **Database Password:** create a strong password and SAVE IT (you'll need it)
   - **Region:** pick the closest one to you (Southeast Asia or South Asia)
3. Click **"Create new project"**
4. Wait ~2 minutes while Supabase sets up your database

### Step 2.3 — Get the Connection String
1. In your Supabase project → left sidebar → **"Settings"** (gear icon)
2. Click **"Database"**
3. Scroll to **"Connection string"**
4. Make sure **"URI"** tab is selected
5. Click **"Display password"** → it shows your password inline
6. Copy the full URI — it looks like:
   ```
   postgresql://postgres:YourPassword@db.abcdefghijkl.supabase.co:5432/postgres
   ```
7. Save this — it's your `DATABASE_URL`

---

## Part 3 — Upstash Redis (Cache + Demand Index)

Upstash is free Redis that works over HTTPS. No credit card needed.

### Step 3.1 — Create Upstash Account
1. Go to **upstash.com** → click "Get Started"
2. Sign up with GitHub or email

### Step 3.2 — Create Redis Database
1. Click **"Create Database"**
2. Fill in:
   - **Name:** `revive-cache`
   - **Type:** Regional
   - **Region:** pick closest (Mumbai or Singapore for India)
3. Click **"Create"**

### Step 3.3 — Get the Redis URL
1. After creating → you see the database details
2. Scroll to **"REST API"** section — look for the **"UPSTASH_REDIS_URL"**
3. It looks like:
   ```
   rediss://default:AbCdEfGhIjKlMnOp@caring-condor-12345.upstash.io:6379
   ```
4. Copy this — it's your `REDIS_URL`

---

## Part 4 — Connect Everything to Your App

### Step 4.1 — Update your local `.env` file

Open `backend/.env` in VS Code and add these lines:

```bash
# AWS S3
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_STORAGE_BUCKET_NAME=revive-hackon-yourname
AWS_S3_REGION_NAME=ap-south-1

# PostgreSQL (Supabase)
DATABASE_URL=postgresql://postgres:YourPassword@db.abcdefghijkl.supabase.co:5432/postgres

# Redis (Upstash)
REDIS_URL=rediss://default:AbCdEfGhIjKlMnOp@caring-condor-12345.upstash.io:6379
```

Replace every value with your actual values from Steps 1–3.

### Step 4.2 — Run Migrations on Supabase

This creates all the database tables in your new PostgreSQL database:

```bash
cd backend
python manage.py migrate
```

You should see a long list of `OK` lines. This means all tables were created in Supabase.

Then seed the database with demo data:

```bash
python manage.py seed_demo
```

### Step 4.3 — Start the server and test

```bash
python manage.py runserver
```

Now go to http://localhost:8000/api/listings/ — the data should load from Supabase (PostgreSQL), not SQLite.

To verify S3 is working:
1. Go to http://localhost:5173 → try to sell an item → upload a photo
2. Check your S3 bucket → the photo should appear there
3. The photo URL in your app should start with `https://revive-hackon-yourname.s3.ap-south-1.amazonaws.com/`

---

## Part 5 — Set Environment Variables on Railway

When you deploy to Railway (Step 5 in DEPLOYMENT_PLAN.md), add the same variables there too:

1. In Railway → your backend service → **"Variables"** tab
2. Add each one:

```
AWS_ACCESS_KEY_ID         = AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY     = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_STORAGE_BUCKET_NAME   = revive-hackon-yourname
AWS_S3_REGION_NAME        = ap-south-1
DATABASE_URL              = postgresql://postgres:YourPassword@db....supabase.co:5432/postgres
REDIS_URL                 = rediss://default:...@....upstash.io:6379
SECRET_KEY                = any-long-random-string-change-this
DEBUG                     = False
ALLOWED_HOSTS             = your-backend.up.railway.app
CORS_ALLOWED_ORIGINS      = https://your-frontend.vercel.app
CSRF_TRUSTED_ORIGINS      = https://your-frontend.vercel.app
LLM_PROVIDER              = openrouter
OPENROUTER_API_KEY        = sk-or-v1-...
```

Railway auto-provides `DATABASE_URL` and `REDIS_URL` if you use Railway's own PostgreSQL/Redis. But since we're using Supabase + Upstash (which are better free options), we set these manually.

---

## What Changes in the App When This Is All Connected

| Before | After |
|---|---|
| Photos saved to `backend/media/` (your laptop) | Photos uploaded to AWS S3 (cloud, permanent) |
| Photo URLs: `http://localhost:8000/media/...` | Photo URLs: `https://revive-hackon-yourname.s3.ap-south-1.amazonaws.com/...` |
| Data in `db.sqlite3` (a file on your laptop) | Data in Supabase PostgreSQL (cloud database) |
| Cache: in-memory (lost when server restarts) | Cache: Upstash Redis (cloud, persists) |
| Demand index: no Redis, JSON file fallback | Demand index: live in Upstash Redis |

---

## Troubleshooting

**"NoCredentialsError" when uploading a photo**
→ Your `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in `.env` is wrong. Double-check them.

**"NoSuchBucket" error**
→ Your `AWS_STORAGE_BUCKET_NAME` in `.env` doesn't match the actual bucket name. They must be identical.

**Photo uploads succeed but image shows broken link**
→ The bucket policy (Step 1.3) wasn't saved correctly. Redo Step 1.3.

**"could not connect to server" for PostgreSQL**
→ Your `DATABASE_URL` is wrong. Copy it again from Supabase → Settings → Database → Connection string.

**Redis connection errors in logs**
→ The app has `IGNORE_EXCEPTIONS: True` in the Redis config — it will fall back to memory cache automatically. This won't break anything, just means no Redis caching. Check your `REDIS_URL` is correct.

**Migrations fail on Supabase**
→ Make sure `DATABASE_URL` is set correctly in `.env` and run `python manage.py migrate` again.
