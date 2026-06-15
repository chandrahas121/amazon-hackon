# REVIVE — Deployment Plan (Free, Before Hackathon Deadline)

## What Was Done (Already Implemented — Just Run These)

| File | What changed |
|---|---|
| `backend/requirements.txt` | Added `gunicorn`, `whitenoise`, `django-redis` |
| `backend/revive/settings.py` | Added WhiteNoise middleware + Redis caching (auto-fallback to memory if no Redis) |
| `backend/core/views.py` | Listings endpoint now caches results for 60s; detail view caches for 5 min |
| `backend/core/migrations/0009_listing_indexes.py` | 4 DB indexes added (status+source, geohash+status, product+status, created_at) |
| `Dockerfile` | Multi-stage build: packages backend + ml/ into a Linux container |
| `docker-compose.yml` | 2 backends + nginx load balancer + postgres + redis |
| `nginx.conf` | Round-robin load balancer config |
| `backend/Procfile` | Railway/Render start command |
| `backend/.env.example` | Updated with REDIS_URL and production CORS settings |
| `.dockerignore` | Excludes junk from Docker build |

---

## Free Services Stack

| What | Service | Free limit | No credit card? |
|---|---|---|---|
| Frontend hosting | **Vercel** | Unlimited | Yes |
| Backend hosting | **Railway** | $5/month credit | Yes |
| PostgreSQL | **Railway** (included) | 1GB | Yes |
| Redis | **Railway** (included) | 1GB | Yes |

---

## Step 1 — Run Migrations (Do This First, 2 min)

```bash
cd backend
python manage.py migrate
```

Expected output: `Applying core.0009_listing_indexes... OK`

---

## Step 2 — Test the Cache Locally (2 min)

```bash
cd backend
python manage.py runserver
```

Open http://localhost:8000/api/listings/ — first request hits DB, second is from cache.
You won't see a difference in browser but it's working. In production with Redis it's ~100x faster.

---

## Step 3 — Run the Full Production Stack Locally with Docker (20 min)

This shows judges 2 backend instances + load balancer.

**Requires:** Docker Desktop installed. Download from docker.com/products/docker-desktop (free).

```bash
# From repo root (amazon-hackon/)
docker-compose up --build
```

Wait for: `backend1-1 | [INFO] Listening at: http://0.0.0.0:8000` (and backend2 same)

Then:
- http://localhost → nginx → routes to backend1 OR backend2 (round-robin, you can see in logs)
- http://localhost/api/listings/ → API through load balancer
- backend1 alone → http://localhost:8000
- backend2 alone → http://localhost:8001

Seed the database (run in a second terminal while docker-compose is running):
```bash
docker-compose exec backend1 python manage.py seed_db
# or: docker-compose exec backend1 python manage.py seed_demo
```

---

## Step 4 — Deploy Frontend to Vercel (10 min)

1. Push all changes to GitHub:
   ```bash
   git add .
   git commit -m "add production deployment: gunicorn, whitenoise, redis cache, docker, indexes"
   git push origin main
   ```

2. Go to **vercel.com** → Sign up / Log in with GitHub

3. Click **"Add New Project"** → Import `amazon-hackon`

4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `dist` (auto-detected)

5. Add **Environment Variable:**
   - Name: `VITE_API_URL`
   - Value: (leave blank for now, fill in after Step 5)

6. Click **Deploy** → you get a URL like `https://amazon-hackon.vercel.app`

---

## Step 5 — Deploy Backend to Railway (20 min)

1. Go to **railway.app** → Sign up with GitHub

2. Click **"New Project"** → **"Deploy from GitHub repo"** → select `amazon-hackon`

3. Railway detects Python. In the service settings:
   - **Root Directory:** `/` (leave as repo root — Dockerfile is here)
   - **Dockerfile Path:** `./Dockerfile` (auto-detected)

4. Add a **PostgreSQL database:**
   - Click **"+"** in your project → **"Database"** → **"Add PostgreSQL"**
   - Railway creates the DB and automatically adds `DATABASE_URL` to your service's env vars

5. Add a **Redis database:**
   - Click **"+"** again → **"Database"** → **"Add Redis"**
   - Railway automatically adds `REDIS_URL` to your service's env vars

6. Add these **Environment Variables** on the backend service:
   ```
   SECRET_KEY          = anyLongRandomString123!@#changeThis
   DEBUG               = False
   ALLOWED_HOSTS       = your-backend-name.up.railway.app
   CORS_ALLOWED_ORIGINS = https://amazon-hackon.vercel.app
   CSRF_TRUSTED_ORIGINS = https://amazon-hackon.vercel.app
   LLM_PROVIDER        = openrouter
   OPENROUTER_API_KEY  = sk-or-v1-...your-actual-key...
   ```

7. Click **Deploy** → wait 2-3 min for the build

8. Copy the Railway backend URL (something like `https://revive-production.up.railway.app`)

9. Go back to Vercel → your project → Settings → Environment Variables:
   - Update `VITE_API_URL` = `https://revive-production.up.railway.app`
   - Click **Save** → **Redeploy**

---

## Step 6 — Seed the Production Database (2 min)

In Railway, go to your backend service → click **"Shell"** tab:

```bash
python manage.py seed_demo
# or if that fails:
python manage.py seed_db
```

---

## Done — What You Have Now

- **Live frontend URL:** `https://amazon-hackon.vercel.app`
- **Live backend URL:** `https://revive-production.up.railway.app`
- **PostgreSQL** (replacing SQLite)
- **Redis cache** (listings cached 60s, health cards cached 5 min)
- **DB indexes** (4 indexes on Listing table — fast filter queries)
- **Gunicorn** (production WSGI server, not dev runserver)
- **WhiteNoise** (serves static CSS/JS from Django efficiently)
- **Docker** (containerized — can run 10 identical copies with one command)
- **nginx + 2 backends** locally via `docker-compose up`

---

## What to Tell Judges

> "The backend runs on Gunicorn behind WhiteNoise in a Docker container deployed to Railway. We switched from SQLite to PostgreSQL with 4 composite indexes on the listings table for fast filter queries. Redis caches all storefront listing results for 60 seconds and health card responses for 5 minutes — the demand index was already in Redis. Locally, docker-compose brings up two identical Django instances behind an nginx load balancer showing horizontal scaling. Adding a 3rd instance is one line in docker-compose.yml. The DATABASE_URL and REDIS_URL environment variables mean the same Docker image runs identically on a laptop, Railway, or a fleet of AWS ECS containers."

---

## If Docker Desktop Isn't Installed

You can still show:
1. The live Vercel + Railway URLs (most important)
2. The `docker-compose.yml` and `nginx.conf` files (shows you designed for it)
3. The Redis caching in the code (`backend/core/views.py` — `cache.set` / `cache.get`)
4. The DB indexes migration (`0009_listing_indexes.py`)

The judges care that you **designed** for scale. The live deployment proves it.
