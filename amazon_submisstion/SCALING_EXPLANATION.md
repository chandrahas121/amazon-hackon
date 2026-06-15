# REVIVE Scaling — Explained Like You're Hearing This For The First Time

This file explains every word in the scaling plan in simple language.
No assumptions. No jargon without explanation. Read top to bottom.

## First — What Does "Scaling" Even Mean?
Imagine your REVIVE app is a tea stall. Right now it works great when 1 customer comes.

**Scaling = making the tea stall work when 100 or 1000 customers come at once.**

The judge is asking: "If Amazon used your app, millions of people would use it at the same time. Would it crash? How would you prevent that?"

## What Is "100x Growth"?
If 10 people use your app today, 100x growth = 1000 people using it at the same time.
If 100 people use it today, 1000x growth = 100,000 people using it at once.

At that scale:
- Your app could crash because it can't handle so many requests
- Things could get very slow (takes 10 seconds to load instead of 1)
- Images might not load because storage is overwhelmed

The judge wants to know you've thought about this.

## Understanding Your App Right Now
Your app has three main parts:
1. **FRONTEND (React)**     ← what users see in the browser
2. **BACKEND (Django)**     ← the brain — handles logic, talks to database
3. **DATABASE (SQLite)**    ← where all data is stored (listings, users, orders)

Plus the special ML parts:
4. **GRADING ML**           ← AI that looks at photos and grades the product (A/B/C/D)
5. **ROUTING ML**           ← AI that decides the cheapest delivery route
6. **DEMAND INDEX (Redis)** ← stores "how many buyers are near this area" data

---

## Part 1 — The Backend Problem (Django API)

**What is Django doing?**
Every time someone does something in the app — login, view a listing, place an order — their browser sends a request to Django. Django thinks about it, talks to the database, and sends back an answer.

**What happens at 100x traffic?**
Right now Django runs as one single process on your computer.
Think of it as: one cashier at a tea stall.
If 1000 customers come at once, that one cashier can't handle it. The line gets huge. People leave. The stall "crashes."

**The fix: Multiple Django instances behind a Load Balancer**
Load Balancer — Think of this as a manager standing outside the tea stall who sends each customer to whichever cashier is free.

```
1000 customers → Manager (Load Balancer) → Cashier 1 (Django #1)
                                         → Cashier 2 (Django #2)
                                         → Cashier 3 (Django #3)
                                         → ...as many as needed
```

**Why can you do this easily for REVIVE?**
Because your login system uses JWT tokens (the little cookie sent with every request). These tokens contain all the info Django needs — Django doesn't need to "remember" which server you logged into. So Customer A can talk to Django #1, then Django #2, and it doesn't matter. Any Django can serve any customer.

This is called **stateless** — the server doesn't hold your "state" (memory of you). The token carries it.

*AWS service for this:* ECS Fargate (runs your Django containers) + ALB (the load balancer manager).
*What you need to change in code:* Nothing. Just deploy multiple copies.

---

## Part 2 — The Database Problem (SQLite → PostgreSQL)

**What is SQLite?**
SQLite is a database that lives as a single file on your computer (db.sqlite3). It's great for development and learning.
Problem: Only one thing can write to it at a time. If 100 people try to create orders simultaneously, they form a queue. Slow. At 1000x it breaks completely.

**The fix: PostgreSQL with Read Replicas**
PostgreSQL is a proper production database. Multiple people can write to it at once.

Read Replicas — A "copy" of the database that gets all the same data but only serves read requests (viewing listings, checking orders).

```
Primary Database:  handles WRITES (new listings, orders, grade results)
                   ↓ (automatically copies data to replicas)
Replica #1:        handles READS (browsing storefront, viewing health cards)
Replica #2:        handles READS (another group of users browsing)
```

**Why?** Because in REVIVE, most traffic is people browsing (reading), not buying (writing). Separating read/write load means neither gets overwhelmed.

*AWS service:* RDS Aurora PostgreSQL.

---

## Part 3 — The AI Grading Problem (The Hardest One)

**What is the grading pipeline doing right now?**
When someone uploads photos of their product:
- Grounding DINO — an AI model that finds defects in photos (draws boxes around scratches, tears, etc.)
- Claude Haiku — describes what it sees in words ("light scuff on left toe")
- DINOv2 — checks if it's the right product (is this actually the shoe listed?)
- Fusion classifier — combines everything and outputs a grade (A/B/C/D)

This takes about 1.4 seconds and needs a lot of computer power (GPU).

**What happens at 100x traffic?**
If 100 people upload photos at the same time:
- Each one needs 1.4 seconds of GPU time
- They can't all run at once on one machine
- People wait 100 × 1.4 seconds = 2+ minutes for their grade
- App feels broken

**The fix: An Async Queue (like a ticket system)**
"Async" = "don't wait for it — we'll tell you when it's done"
Queue = a waiting line where jobs sit until a worker picks them up

Think of it like a fast food restaurant that gives you a ticket:
1. You order (upload photo) → cashier gives you ticket #47 instantly
2. The kitchen (ML workers) processes orders from the queue
3. When your order is ready, they call out "ticket #47!"

**BEFORE (synchronous — bad):**
User uploads → Django waits for ML → ML finishes → Django replies
User is waiting the whole 1.4 seconds. 100 users = 140 seconds wait.

**AFTER (async queue — good):**
```
User uploads photo
       ↓
Django: saves photo to S3, creates job ticket → returns "job #47" instantly (fast!)
       ↓
[Job sits in SQS queue]
       ↓
ML Worker #1: processes job #1
ML Worker #2: processes job #2    ← all happening at the same time
ML Worker #3: processes job #47
       ↓
Grade saved to database
       ↓
User's app checks "is job #47 done yet?" → gets grade when ready
```

SQS = Simple Queue Service (AWS). It's literally just a waiting list for jobs. Very simple concept, very powerful.

---

## Part 4 — Caching (The Shortcut System)

**What is a cache?**
A cache is a shortcut — you store the answer to a question so you don't have to figure it out again.

**What is Redis?**
Redis is a database that stores things in memory (RAM) instead of on a hard disk. RAM is ~100x faster than disk.
Your app already uses Redis — look at `ml/build_demand_index.py`. It stores demand data.

**What else should be cached?**
Storefront listings — When 1000 people browse "Used Footwear near Koramangala," they all want the same list. Instead of each request asking the database:

**WITHOUT CACHE:**
`1000 users → 1000 database queries → database sweats → slow`

**WITH CACHE:**
```
1st user  → database query → save result in Redis for 5 minutes
2nd user  → Redis (instant, already there) → 0 database query
3rd user  → Redis (instant)
...
1000th user → Redis (instant)
Only 1 database query for 999 identical requests
```

---

## Part 5 — Image Storage (S3 + CloudFront)

**The problem right now**
Product photos are stored in a folder called `media/` on your local computer.
Problem: If that one computer is busy or crashes, images disappear. Also if 10,000 people try to load images at the same time from that one machine — it can't handle it.

**What is S3?**
S3 (Simple Storage Service) is AWS's storage system. Think of it as Google Drive but for your app. Unlimited storage, never goes down, scales automatically.

**What is CloudFront?**
CloudFront is a CDN (Content Delivery Network).
It puts copies of popular content near users so it loads instantly regardless of where they are in the country.

---

## Part 6 — EV Router (Already Scales — Nothing to Do)

The routing algorithm in `ml/route.py` is what decides: "Should this return go to Route A, Route B, or Route C?"
It calculates Expected Value = money made from resale - shipping cost - holding cost.

**Why it already scales:** It's a pure math calculation. It takes inputs, returns a number, stores nothing. You can run it 1000 times simultaneously with no problem. AWS Lambda can run this function 1000 times in parallel automatically.

---

## The Complete Picture — What Each Part Does

```text
                    ┌─────────────────┐
                    │   USER'S BROWSER │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   CloudFront    │  ← serves images fast, near the user
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │ Load Balancer   │  ← traffic manager, sends to free Django
                    └────┬──┬──┬─────┘
                         │  │  │
               ┌─────────┘  │  └──────────┐
        ┌──────▼──┐   ┌─────▼───┐  ┌──────▼──┐
        │Django #1│   │Django #2│  │Django #3│   ← multiple copies, all identical
        └────┬────┘   └────┬────┘  └────┬────┘
             │             │            │
       ┌─────▼─────────────▼────────────▼──────┐
       │              Redis Cache               │  ← fast answers for common requests
       └──────────────────┬────────────────────┘
                          │
       ┌──────────────────▼────────────────────┐
       │          PostgreSQL Database           │  ← the real data store
       └──────────────────┬────────────────────┘
                          │
       ┌──────────────────▼────────────────────┐
       │           SQS Queue                   │  ← job waiting list for ML
       └──────────────────┬────────────────────┘
                          │
        ┌─────────────────▼─────────────────┐
        │         ML Worker Fleet           │  ← multiple AI workers process grades
        └───────────────────────────────────┘
                          │
       ┌──────────────────▼────────────────────┐
       │                 S3                    │  ← image storage (unlimited)
       └───────────────────────────────────────┘
```

## Glossary (Every Technical Word Explained)

| Word | What it means |
|---|---|
| **Horizontal scaling** | Adding more copies of the same server |
| **Load Balancer** | A traffic manager that sends each incoming request to whichever server is least busy |
| **Stateless** | The server doesn't remember you between requests. Every request carries all the info the server needs (your JWT token). |
| **JWT** | JSON Web Token — encrypted text that proves who you are |
| **PostgreSQL** | A proper production database |
| **Read Replica** | A copy of the database that only handles reading (not writing) |
| **Redis** | A super-fast database that stores things in memory (RAM) |
| **Cache** | Storing the answer to a question so you don't have to calculate it again |
| **SQS** | Simple Queue Service (AWS). A waiting list for jobs |
| **Async** | "Don't wait — I'll tell you when it's done." |
| **S3** | AWS Simple Storage Service. Like Google Drive for your app |
| **CloudFront** | AWS CDN. Caches copies of your images near users |
| **ECS Fargate** | AWS service that runs your Django app in containers |
| **Lambda** | AWS serverless computing. You give it a Python function, it runs it whenever called |
| **Aurora** | AWS's version of PostgreSQL. Fully managed |
