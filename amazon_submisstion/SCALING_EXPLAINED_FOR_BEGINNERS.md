# REVIVE Scaling — What We Did, What's Left, What It All Means

> Written for someone hearing this for the first time.
> No jargon without explanation. Tick marks show what's actually done.

---

## The Big Picture First

The judge asks: **"If a million people used REVIVE at once, would it crash?"**

Your answer needs to cover three things:
1. **Horizontal scaling** — running multiple copies of the app at once
2. **Caching** — remembering answers so you don't repeat work
3. **Distribution** — storing things (images, data) in the cloud, not on one laptop

Before this session, REVIVE ran on a single laptop with a file-based database (SQLite) and no caching. After this session, it's structured like a real production app.

---

## What We Actually Changed (All Done ✅)

### ✅ 1. Switched from Dev Server to Gunicorn

**Before:** Django ran with `python manage.py runserver` — this is a development-only server. It handles one request at a time and is not safe for real users.

**After:** Added **Gunicorn** to `backend/requirements.txt`. Gunicorn is a production web server. It runs multiple worker processes in parallel so multiple users can be served at the same time.

```
File changed: backend/requirements.txt
Added: gunicorn==21.2.0
```

Think of it like: before you had one cashier. Now you have 2 cashiers (workers) at the same counter.

---

### ✅ 2. Added WhiteNoise (Serves CSS and JavaScript Efficiently)

**Before:** Django was serving static files (CSS, JavaScript) through the development server — slow and not production-safe.

**After:** Added **WhiteNoise** to serve static files directly and efficiently. It compresses them and adds browser caching headers automatically.

```
File changed: backend/requirements.txt → added whitenoise==6.6.0
File changed: backend/revive/settings.py → added WhiteNoiseMiddleware + STORAGES config
```

---

### ✅ 3. Added Redis Caching to the Listings API

**What is caching?** Storing the answer to a question so you don't recalculate it every time.

**The problem:** Every time someone opens the REVIVE storefront, Django asks the database: "give me all active listings." At 1000 users browsing at the same time, that's 1000 identical database queries per second.

**The fix:** The first user's result is saved in **Redis** (a super-fast memory store) for 60 seconds. The next 999 users get the answer from Redis instantly — the database is only hit once.

```
File changed: backend/core/views.py
  → ListingListView: saves results to cache for 60 seconds
  → ListingDetailView: saves product page to cache for 5 minutes
  → Cache is automatically deleted when a listing is sold, paused, or delisted

File changed: backend/revive/settings.py
  → If REDIS_URL is set → uses Redis (production)
  → If REDIS_URL is not set → uses memory cache (local dev, works automatically)

File changed: backend/requirements.txt → added django-redis==5.4.0
```

---

### ✅ 4. Added Database Indexes

**What is an index?** Imagine a textbook with no index at the back. To find "geohash" you'd read every page. With an index, you go straight to the right page. Database indexes work exactly the same way.

**The problem:** The Listing table has thousands of rows. Every storefront filter ("show me Used Footwear near Koramangala that is Active") scans every row.

**The fix:** Added 4 indexes on the most common filter combinations:

```
New file: backend/core/migrations/0009_listing_indexes.py
  → Index on (status + source)     ← "show active P2P listings"
  → Index on (geohash5 + status)   ← "show listings near this area"
  → Index on (product + status)    ← "show all listings for this product"
  → Index on (created_at DESC)     ← "sort by newest"
```

These make filter queries go from scanning 10,000 rows to jumping directly to the ~50 matching rows.

---

### ✅ 5. Added AWS S3 for Image Storage

**Before:** When a seller uploaded a product photo, it saved to `backend/media/` — a folder on your laptop. If the laptop dies or you redeploy, all photos are gone.

**After:** Added **AWS S3** support. When `AWS_STORAGE_BUCKET_NAME` is set in your environment variables, all uploaded photos automatically go to S3 (Amazon's cloud storage). Photos live there permanently regardless of what happens to your server.

```
File changed: backend/requirements.txt → added django-storages[s3]==1.14.4
File changed: backend/revive/settings.py
  → If AWS_STORAGE_BUCKET_NAME is set → uploads go to S3
  → If not set → uploads go to local media/ folder (as before)
  → Zero code changes needed in views.py — Django handles it transparently
```

The photo URLs change from:
- Before: `http://localhost:8000/media/listings/photo.jpg`
- After: `https://your-bucket.s3.ap-south-1.amazonaws.com/listings/photo.jpg`

---

### ✅ 6. Added Dockerfile (Containerisation)

**What is Docker?** A way to package your entire app — Python version, packages, code, settings — into a single "container" that runs identically anywhere. Like a shipping container: same box, different ships.

**Why does this matter for scaling?** Because if your app is containerised, you can run 10 identical copies just by saying "start 10 containers." No reinstalling, no config differences.

```
New file: Dockerfile (at repo root)
  → Installs Python 3.12
  → Installs all requirements
  → Copies backend/ and ml/ into the container
  → Runs collectstatic (CSS/JS compression)
  → Starts Gunicorn with 2 workers
```

---

### ✅ 7. Added docker-compose.yml (Shows Horizontal Scaling Locally)

**What is docker-compose?** A way to start multiple services with one command.

Our `docker-compose.yml` starts:
- **backend1** — Django instance 1 (port 8000)
- **backend2** — Django instance 2 (port 8001) ← identical copy
- **nginx** — load balancer (port 80) — distributes traffic between backend1 and backend2
- **postgres** — PostgreSQL database (port 5432)
- **redis** — Redis cache (port 6379)

```
New file: docker-compose.yml
New file: nginx.conf  ← nginx config: "send requests to backend1 or backend2 alternately"
```

Run `docker-compose up --build` and you have a mini production environment on your laptop. This is what you show the judge.

---

### ✅ 8. Added Production Security Settings

When `DEBUG=False` (i.e. in production), these security settings automatically turn on:
- HTTPS-only cookies
- CSRF protection over HTTPS
- SSL redirect (HTTP → HTTPS)
- Trust Railway/Render/Fly.io's proxy headers

```
File changed: backend/revive/settings.py
  → Added: SECURE_PROXY_SSL_HEADER, SECURE_SSL_REDIRECT, SESSION_COOKIE_SECURE,
           CSRF_COOKIE_SECURE, SECURE_HSTS_SECONDS
  → All auto-disabled in local dev (DEBUG=True), auto-enabled in production (DEBUG=False)
```

---

### ✅ 9. Created All Deployment Configuration Files

```
New file: backend/Procfile
  → Tells Render/Railway: "start gunicorn on $PORT, run migrate before starting"

New file: .dockerignore
  → Tells Docker: "don't copy __pycache__, node_modules, .env, db.sqlite3 into the image"
```

---

## What's Left To Do (Services You Need To Sign Up For)

The code is ready. You just need to create accounts and get credentials.

---

### ❌ Left 1 — AWS S3 Bucket (images)

**What you need to do:**
1. Create AWS account at aws.amazon.com (needs credit card for verification — free tier, won't charge you)
2. Create S3 bucket → disable public block → add bucket policy (makes photos publicly viewable)
3. Create IAM user → download access keys
4. Add to `backend/.env`:
   ```
   AWS_ACCESS_KEY_ID=AKIA...
   AWS_SECRET_ACCESS_KEY=...
   AWS_STORAGE_BUCKET_NAME=revive-hackon-yourname
   AWS_S3_REGION_NAME=ap-south-1
   ```

**Full guide:** `SERVICES_SETUP.md` → Part 1 (15 min)

---

### ❌ Left 2 — Supabase PostgreSQL (database)

**Why?** SQLite is a file on your laptop. Supabase gives you a real cloud PostgreSQL database — handles concurrent writes, survives restarts, accessible from any server.

**What you need to do:**
1. Create account at supabase.com (free, no credit card)
2. Create project → get the `postgresql://...` connection string
3. Add to `backend/.env`:
   ```
   DATABASE_URL=postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres
   ```
4. Run `python manage.py migrate` → creates all tables in Supabase

**Full guide:** `SERVICES_SETUP.md` → Part 2 (10 min)

---

### ❌ Left 3 — Upstash Redis (cache + demand index)

**Why?** The caching code we wrote works in memory locally (no Redis needed). But in production on Render, every server restart wipes the memory cache. Upstash Redis persists across restarts and is shared across all server instances.

**What you need to do:**
1. Create account at upstash.com (free, no credit card)
2. Create Redis database → get the `rediss://...` URL
3. Add to `backend/.env`:
   ```
   REDIS_URL=rediss://default:password@....upstash.io:6379
   ```

**Full guide:** `SERVICES_SETUP.md` → Part 3 (5 min)

---

### ❌ Left 4 — Deploy Frontend to Vercel

**Why Vercel?** React apps need to be "built" (compiled into HTML/CSS/JS files) and served from somewhere. Vercel does this for free and gives you a public URL.

**What you need to do:**
1. Go to vercel.com → sign up with GitHub (free, no card)
2. Import `amazon-hackon` repo → set Root Directory = `frontend`
3. Add env var: `VITE_API_URL` = your Render backend URL
4. Deploy → get a URL like `https://amazon-hackon.vercel.app`

**Full guide:** `DEPLOYMENT_PLAN.md` → Step 4 (10 min)

---

### ❌ Left 5 — Deploy Backend to Render

**Why Render?** Your backend (Django) needs to run on a server that's always on, not your laptop.

**What you need to do:**
1. Go to render.com → sign up with GitHub (free, no card)
2. New Web Service → connect repo → Environment: Docker → Instance: Free
3. Add all environment variables (SECRET_KEY, DATABASE_URL, REDIS_URL, AWS keys, etc.)
4. Deploy → get URL like `https://revive-hackon.onrender.com`
5. Seed DB: in Render Shell → `python manage.py seed_demo`

**Full guide:** `DEPLOYMENT_PLAN.md` → Step 5 + look at Render section

---

### ❌ Left 6 — Set Up UptimeRobot (keeps Render awake)

**Why?** Render's free tier puts your app to sleep after 15 minutes of no visitors. The next visitor waits 30 seconds for it to wake up — bad for a demo.

**Fix:** UptimeRobot visits your app every 5 minutes so it never sleeps.

**What you need to do:**
1. Go to uptimerobot.com → sign up (free, no card)
2. Add monitor → URL = `https://revive-hackon.onrender.com/api/listings/` → interval = 5 min
3. Done — app never sleeps again

**Takes:** 5 minutes

---

### ❌ Left 7 — Push Code to GitHub (triggers deploy)

Once you've signed up for Render and connected your repo, every push to `main` auto-deploys.

Run this to push all the changes from this session:
```bash
git add backend/.env.example backend/core/views.py backend/requirements.txt backend/revive/settings.py backend/Procfile backend/core/migrations/0009_listing_indexes.py Dockerfile docker-compose.yml nginx.conf .dockerignore

git commit -m "production: S3 storage, Redis cache, DB indexes, Docker, Gunicorn, WhiteNoise"

git push origin main
```

**Do NOT add** `backend/.env` (has your real secrets — already in .gitignore so it's safe)

---

## Summary Checklist

### Code changes (already done — just push):
- ✅ Gunicorn (production web server)
- ✅ WhiteNoise (static file serving)
- ✅ Redis caching on listings + detail endpoints
- ✅ AWS S3 image storage (activates automatically when env vars are set)
- ✅ DB indexes (4 indexes on Listing table)
- ✅ Dockerfile (containerised app)
- ✅ docker-compose.yml (2 backends + nginx + postgres + redis locally)
- ✅ Production security headers

### Services to sign up for (you need to do these):
- ❌ AWS account + S3 bucket + IAM keys (~15 min, needs credit card for AWS)
- ❌ Supabase account + PostgreSQL project (~10 min, no card)
- ❌ Upstash account + Redis database (~5 min, no card)
- ❌ Vercel account + frontend deploy (~10 min, no card)
- ❌ Render account + backend deploy (~15 min, no card)
- ❌ UptimeRobot account + monitor (~5 min, no card)
- ❌ Push code to GitHub → triggers Render auto-deploy (~2 min)

**Total remaining time: ~1 hour**

---

## What You Tell the Judge

> "REVIVE's backend runs on Gunicorn inside a Docker container deployed to Render. Product images are stored on AWS S3 — uploaded directly from Django via django-storages, served from S3's URL. The database is PostgreSQL on Supabase. Storefront listings are cached in Upstash Redis for 60 seconds with 4 composite DB indexes for fast filtering. Locally, docker-compose shows two identical Django instances behind an nginx load balancer — horizontal scaling is adding one line to docker-compose.yml. The same Dockerfile deploys to Render today and to AWS ECS tomorrow without any code changes."

---

## Glossary of Everything Used in This Session

| Word | What it means |
|---|---|
| **Gunicorn** | Production web server for Python. Runs 2 worker processes in parallel. Dev server handled 1 request at a time; Gunicorn handles many. |
| **WhiteNoise** | Python library that serves CSS/JS files efficiently from Django, with compression and browser caching. |
| **Redis** | A database that stores data in memory (RAM). 100x faster than a disk database. Used for caching and the demand index. |
| **Cache** | Storing the result of an expensive operation so you can return it instantly next time. |
| **TTL** | Time To Live. How long a cached result is kept before it's deleted and recalculated. Our listings TTL = 60 seconds. |
| **Cache invalidation** | Deleting a cached result when the underlying data changes (e.g., when a listing is sold). |
| **Index (database)** | Like a book's index. Lets the database jump directly to matching rows instead of scanning every row. |
| **Django-storages** | Python package that makes Django save uploaded files to S3 instead of local disk. One settings change, zero code changes. |
| **boto3** | Amazon's official Python library for talking to AWS services (S3, etc.). Installed automatically with django-storages[s3]. |
| **Docker** | Packages your app + Python + packages into a "container" that runs identically anywhere. |
| **docker-compose** | Starts multiple Docker containers together with one command. We use it to start 2 backends + nginx + postgres + redis. |
| **nginx** | A web server used as a load balancer. Receives all requests and forwards them to backend1 or backend2 alternately. |
| **Load balancer** | Traffic manager. Routes each incoming request to whichever server is free. |
| **Horizontal scaling** | Running more copies of the same server. Our nginx + 2 backends is horizontal scaling. |
| **Procfile** | A file that tells Render/Railway what command to run to start your app. |
| **Dockerfile** | A recipe for building a Docker container. Describes what to install and how to start the app. |
| **Supabase** | Free cloud PostgreSQL database. We use it instead of SQLite (which is a local file). |
| **Upstash** | Free cloud Redis. We use it for caching and the demand index in production. |
| **Render** | Free cloud hosting for web apps. Runs your Docker container. Sleeps after 15 min idle (fixed with UptimeRobot). |
| **Vercel** | Free cloud hosting for React frontends. Builds and serves your React app globally. |
| **UptimeRobot** | Free service that pings your Render app every 5 minutes to prevent it from sleeping. |
| **IAM** | AWS Identity and Access Management. You create a "robot user" (IAM user) that Django uses to upload to S3. |
| **S3** | Amazon Simple Storage Service. Cloud file storage. Stores uploaded product photos permanently. |
| **VITE_API_URL** | Environment variable in the React app that tells it where the backend is. Set to your Render URL. |
| **migrate** | Django command that creates/updates database tables. Run after connecting to a new database. |
| **seed_demo** | Django management command that fills the database with demo listings for the hackathon. |
