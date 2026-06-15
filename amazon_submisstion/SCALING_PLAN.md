# REVIVE — Scaling Plan (100x–1000x Growth)
### For PRD Section: "How does this handle 100x-1000x growth?"

---

## One-Line Answer for Judges

> REVIVE's architecture is stateless at the API layer, async at the ML layer, pre-computed at the demand layer, and CDN-distributed at the media layer — each tier scales horizontally and independently without redesigning the system.

---

## What Breaks First (Bottleneck Map)

At 100x users, four things break before anything else:

| # | What breaks | Why it breaks | Fix |
|---|---|---|---|
| 1 | Django API server | Single process, one machine | Multiple instances behind a load balancer |
| 2 | AI Grading pipeline | GPU-bound, 1.4s per item, blocks API | Async queue (SQS) + independent ML worker fleet |
| 3 | Image storage | Local `media/` folder on one disk | S3 + CloudFront CDN |
| 4 | Database (SQLite) | Single-file, no concurrent writes | PostgreSQL Aurora + read replicas |

Redis demand index and EV optimizer are **already** designed to scale (pre-computed and stateless respectively).

---

## Layer 1 — API Servers (Horizontal Scaling)

**Technology:** AWS ECS Fargate + ALB (Application Load Balancer)

Django REST is stateless by design because auth uses JWT cookies, not server-stored sessions. This means any API server instance can handle any user request — there's no "this user must go to server #3" problem.

```
User Request
     ↓
ALB (Load Balancer)  ← routes traffic evenly
     ↓
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Django  │  │ Django  │  │ Django  │   ← N identical instances
│ API #1  │  │ API #2  │  │ API #3  │     add more as traffic grows
└─────────┘  └─────────┘  └─────────┘
```

**What's already done:** `settings.py` already has `DATABASE_URL` env-var support to switch from SQLite to PostgreSQL by changing one environment variable. JWT cookies (`AUTH_COOKIE`, `AUTH_COOKIE_HTTP_ONLY`) are already configured. No code change needed — only infrastructure.

**At 1000x:** Add auto-scaling rules on ECS (scale out when CPU > 70%, scale in when CPU < 30%).

---

## Layer 2 — ML Grading Pipeline (Async Queue)

**Technology:** AWS SQS + SageMaker Async Endpoints

The grading pipeline (Grounding DINO → Claude Haiku → DINOv2 → Fusion classifier) takes ~1.4 seconds and is GPU-bound. If it runs synchronously inside Django, every concurrent grading request blocks a Django worker thread. At 100x returns this collapses.

**Fix — Decouple grading from the API with a queue:**

```
Before (synchronous — breaks at scale):
  User uploads → Django runs ML → waits 1.4s → returns grade

After (async — scales to any load):
  User uploads photo
       ↓
  Django: saves photo to S3, writes {job_id} to SQS queue
       ↓  returns 202 Accepted immediately (fast)
  
  SQS Queue ← ML workers pull jobs from here
       ↓
  ML Worker #1: Grounding DINO → DINOv2 → grade result
  ML Worker #2: another item simultaneously
  ML Worker #3: another item simultaneously
       ↓
  Grade written to PostgreSQL DB
       ↓
  Frontend polls GET /api/grade/{job_id}/ until status = "complete"
```

**Why this scales:** ML workers are independent. You can run 1 or 100 of them. The API never waits for grading — it queues the job and moves on. During a sale event (Return Monday) you auto-scale ML workers; during quiet hours you scale them down to zero.

**Already in tech stack:** SageMaker (already listed in `final_idea_v2.md` §12). SQS is the queue layer that connects them.

---

## Layer 3 — Caching (Redis — Already Partially Done)

**Technology:** AWS ElastiCache Redis (already used for demand index)

Redis is an in-memory store — reads are ~0.1ms vs ~5ms for database. Anything read more than it's written is a caching candidate.

### What's already in Redis (implemented in `ml/build_demand_index.py`):
```
demand:{geohash5}  →  {category: {demand_score, local_buyers, nearest_cluster, ...}}
```
Refreshed every 6 hours. This means the routing algorithm never hits the database for demand data — it hits Redis.

### What should be added:

| Cache Key | What it stores | TTL | Saves |
|---|---|---|---|
| `listings:{city}:{category}:{grade}:{page}` | Storefront listing results | 5 minutes | 90% of all API reads |
| `healthcard:{listing_id}` | Signed Health Card JSON | Permanent | Cards never change |
| `risk:{user_id}:{product_id}` | Return-risk score (GBDT output) | 1 hour | Re-running ML model |
| `session:{token}` | Django session data | 1 hour | Database session reads |

**Cache invalidation rule:** Listing cache is invalidated when a listing changes status (sold/delisted/paused/price-edit). Health Cards are write-once and never need invalidation.

**Impact at 100x:** The storefront (`/api/listings/` with filters) is read-heavy — at 100x users, 99% of storefront requests return from Redis in <1ms instead of hitting the database.

---

## Layer 4 — Database (Read Replicas + Partitioning)

**Technology:** AWS Aurora PostgreSQL

SQLite (current dev setup) cannot handle concurrent writes. PostgreSQL Aurora solves this and adds:

1. **Read replicas** — separate database instances that receive all writes from the primary and serve reads. Storefront browsing (GET requests) hits replicas; placing orders and creating listings hits the primary.

```
All writes  →  Primary DB
              ↓ (replication, near real-time)
All reads   →  Replica 1
           →  Replica 2
```

2. **Index strategy** — the listings table needs composite indexes on the most common filter combinations:
   - `(geohash5, category, status)` — "show Footwear listings near Koramangala that are Active"
   - `(status, grade, category)` — storefront filters
   - `(seller_id, status)` — My Listings page

3. **Green Credits → DynamoDB** (already planned in tech stack §12) — event-driven vesting at massive scale, never needs a relational join.

---

## Layer 5 — Image Storage & CDN (Distribution)

**Technology:** AWS S3 + CloudFront

**Current:** Images stored in local `media/` folder in Django. One machine, one disk.

**Fix:**
1. **S3 for storage** — Django issues a pre-signed S3 URL, browser uploads directly to S3. Django never touches the image bytes. Unlimited storage, 99.999% durability.
2. **CloudFront CDN** — sits in front of S3. Product photos, Health Card bounding-box images, and storefront thumbnails are cached at edge locations globally (or across Indian metros).

```
Browser uploads photo:
  Browser → (pre-signed URL) → S3 directly   ← Django not involved in upload
  
Browser views photo:
  Browser → CloudFront (cache hit → <10ms)
  CloudFront → S3 (cache miss, first request only → ~50ms)
```

**At 1000x:** 1 million image views/day hit CloudFront, not Django, not S3 directly. Cost: ~$0.008 per GB served.

---

## Layer 6 — EV Router & Sell-Probability Model (Already Scales)

The EV optimizer (`ml/route.py`) and sell-probability GBDT are **pure functions** — they take inputs, return outputs, store nothing. This means they run identically on Lambda (AWS serverless). Already in tech stack §12.

At 1000x, you run 1000 simultaneous Lambda invocations — each is independent.

---

## Full Architecture at Scale

```
┌─────────────────────────────────────────────────────────────────┐
│                        Users / Browsers                         │
└─────────────────────────────────────────────────────────────────┘
                                ↓
                    CloudFront (CDN — static assets,
                     product images, Health Card photos)
                                ↓
                    ALB — Application Load Balancer
                    ↓           ↓           ↓
               Django #1   Django #2   Django #3  ... N instances
                    ↓           ↓
              ElastiCache Redis          SQS Queue (grading jobs)
              · demand index (live)           ↓
              · listing cache            ┌────────────────┐
              · health card cache        │  ML Workers     │
              · session cache            │  (SageMaker/ECS)│
                    ↓                    │  · Grounding DINO│
              Aurora PostgreSQL          │  · DINOv2        │
              Primary (writes)           │  · Claude Haiku  │
              Replica (reads)            │  · Fusion grader │
                                         └────────────────┘
                                                  ↓
                                         Grade → PostgreSQL
                                         
              S3 (image storage)
              · product photos
              · health card images
              · uploaded angles
```

---

## What's Already Done vs What's Infrastructure-Only

| Component | Status | What's needed |
|---|---|---|
| Stateless JWT auth | Done in `settings.py` | Nothing |
| Redis demand index | Done in `build_demand_index.py` | Just run ElastiCache instead of local Redis |
| `DATABASE_URL` PostgreSQL swap | Done in `settings.py` | Just set the env var pointing to Aurora |
| EV router (stateless) | Done in `ml/route.py` | Deploy to Lambda |
| Async ML grading | Not wired | Add SQS queue + worker consumer |
| S3 image storage | Not wired | Replace `MEDIA_ROOT` with S3 backend |
| CloudFront CDN | Not wired | Point CloudFront at S3 bucket |
| Listing result cache | Not wired | Add Redis cache-aside in `views.py` |

**The key message for judges:** The application architecture was designed for horizontal scale from the start. Stateless API, pre-computed demand, async-friendly ML pipeline, and env-var database configuration mean the path from demo to production is infrastructure provisioning, not redesign.

---

## Numbers to Quote

| Metric | Local/Demo | At 100x | At 1000x |
|---|---|---|---|
| API throughput | 1 Django process | 10 ECS instances | 100 ECS instances |
| Grading concurrency | 1 (synchronous) | 50 SQS workers | 500 SQS workers |
| Demand index reads | Redis (1 instance) | Redis cluster | Redis cluster (sharded) |
| Image requests | Local disk | S3 + CloudFront | S3 + CloudFront (same, auto-scales) |
| DB reads | SQLite (1 file) | Aurora + 2 replicas | Aurora + 5 replicas |
| EV routing | In-process | Lambda | Lambda (auto-scales to 1000 concurrent) |
