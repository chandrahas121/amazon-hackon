# REVIVE — *Every product deserves a second life*

> **HackOn with Amazon 2026 · Team Vijaya**
> Theme: *Second Life Commerce — AI-Powered Returns & Sustainable Resale*

REVIVE is **not another resale marketplace** — marketplaces already exist. REVIVE is the
**intelligent decision layer** that sits inside Amazon and answers, in under two seconds, the one
question no e-commerce system answers today about a returned or unused item:

> *What is this item, what condition is it in, and what is its most valuable, least-wasteful
> second life — restock as new, resell locally, refurbish, donate, or recycle?*

It keeps products **inside the city** instead of shipping them ~600 km back to a warehouse,
turning the most carbon-intensive step of returns into the one we eliminate.

- 🌐 **Live app:** https://amazon-hackon-mu.vercel.app/
- 📦 **Repo:** https://github.com/chandrahas121/amazon-hackon

---

## Table of Contents

1. [The Problem](#1-the-problem)
2. [What Makes REVIVE Different](#2-what-makes-revive-different)
3. [End-to-End Workflow](#3-end-to-end-workflow)
4. [Feature Walkthrough](#4-feature-walkthrough)
5. [System Architecture](#5-system-architecture)
6. [The Decision Engine — Core Algorithms](#6-the-decision-engine--core-algorithms)
7. [Tech Stack](#7-tech-stack)
8. [Repository Layout](#8-repository-layout)
9. [Data Model](#9-data-model)
10. [API Reference](#10-api-reference)
11. [Local Setup](#11-local-setup)
12. [Seeding the Demo](#12-seeding-the-demo)
13. [Configuration & Environment Variables](#13-configuration--environment-variables)
14. [Deployment & Scaling](#14-deployment--scaling)
15. [Future Vision](#15-future-vision)

---

## 1. The Problem

Every returned or unused product faces exactly one decision — *what happens next* — yet no
intelligent system in e-commerce makes that call today.

- In 2025, U.S. retail returns hit **$849.9B** (15.8% of all retail sales); online return rates of
  **19.3%** run more than double the 8.7% seen in stores.
- The reverse-logistics market grows from **$700B (2023) → $954B (2029)**.
- For the long tail of everyday goods, **shipping an item 600 km back to a warehouse, inspecting,
  and restocking it costs more than the item is worth** — so it is liquidated or landfilled by
  default.
- The reverse supply chain emits up to **24 million metric tons of CO₂** annually; 22% of fashion
  returns come back completely unsellable.
- Regulation is catching up: the EU's **ESPR** (in force since July 2024) outlaws destruction of
  returned goods and mandates **Digital Product Passports** — doing nothing becomes
  non-compliant.

REVIVE attacks the **exact moment** the decision is made: the instant an item is returned or sits
unused in a drawer.

---

## 2. What Makes REVIVE Different

Existing systems treat a return as a *logistics* problem (how do we move it back?) or a
*marketplace* problem (where do we relist it?). REVIVE's insight is that the missing piece is a
**decision engine** — not a faster truck or another storefront. Four design choices make it
genuinely different.

### ① Two independent axes: **Category** and **Risk** — never one rating for everything

REVIVE asks two separate questions about every item:

- **What kind of product is it?** → the **Category Profile**
  ([`ml/category_profiles.py`](ml/category_profiles.py)) decides which photos to capture and how to
  grade it. A shoe is checked for sole wear; a phone is checked for a working screen. The frontend
  mirror is [`frontend/src/utils/categoryProfiles.js`](frontend/src/utils/categoryProfiles.js).
  **A ₹6,000 Nike Air Max is Footwear and is NEVER asked for a "powered-on screen" photo,
  regardless of value.**
- **How valuable and fraud-prone is it?** → the **Risk Tier**
  ([`ml/risk_tier.py`](ml/risk_tier.py)) decides verification depth, guarantee window, the liable
  party, and route eligibility. This axis is **backend-only — never shown to the customer.**

Risk is driven by **value AND category fraud-risk**, not price alone. A ₹4,500 phone is cheap but
highly fraud-prone (IMEI swap, dead battery) and needs agent verification; a ₹4,500 cast-iron pan
does not. Pure-price tiering can't tell them apart.

| Risk tier | Verification | Guarantee | Liable party | Maps to PRD value tier |
|-----------|-------------|-----------|--------------|------------------------|
| **LOW**    | AI-only grading              | 7-day  | Seller (escrow)              | Tier 1 · < ₹2,000 |
| **MEDIUM** | AI + agent doorstep check    | 30-day | Seller + A-to-Z backstop     | Tier 2 · ₹2,000–₹10,000 |
| **HIGH**   | AI + SPN professional node   | 90-day | SPN-liable, priority routing | Tier 3 · > ₹10,000 |

An AI vision engine then grades every item **A → F** and boxes each defect in under two seconds,
replacing slow, subjective hand inspection.

### ② A **Disposition Gate** — not blind resale

Mirroring how Amazon FBA and major retailers actually operate
([`ml/disposition.py`](ml/disposition.py)), a return is routed to the *correct* second life before
anything is listed:

| Outcome | Meaning | Where it goes |
|---------|---------|---------------|
| `RESTOCK_NEW`    | Verified sealed & unopened | Back to the **normal catalog at full price** (exits second-life) |
| `OPEN_BOX`       | Unused but opened          | Unified storefront, slight discount |
| `USED_P2P`       | Opened/used, grade B–D     | Unified storefront, grade-adjusted price |
| `RENEWED_SPN`    | Grade D–E, refurbishable   | SPN refurb → "Renewed", 90-day, SPN-tested |
| `RECYCLE_DONATE` | Grade F / unsafe / dead    | Exits the marketplace (NGO / certified e-waste) |

**Not every return deserves a second life — deciding which ones do is the hard part nobody
automates.** A return *can* be sold as new again, but only if verified unopened and in original
condition; once opened it can never be "New".

### ③ **Demand-gravity routing** keeps items local

A two-stage engine ([`ml/route.py`](ml/route.py)):

1. **Stage 1 — Demand Gate:** waits for local demand using a **geohash-5 demand-gravity model**
   (`demand / (1 + dist² / 25)`) fed by real order and search history. Low-value as-is returns are
   **not warehoused on arrival** — they stay local and are only *activated* when a nearby buyer
   appears.
2. **Stage 2 — EV optimizer:** picks the cheapest path to a buyer who is often within 5 km.

Benchmarked at roughly **64% cheaper and 4× faster** than a warehouse round-trip, saving ~590 km and
~4.2 kg CO₂ per locally routed item.

### ④ **Trust is engineered in** — and bad purchases are prevented upstream

- Every item ships with a verifiable **Product Health Card** ([`backend/trust/`](backend/trust/)):
  a signed condition grade, defect photos, functional status, and a **tamper-evident SHA-256 hash**
  — solving the trust deficit of peer-to-peer resale. This is the same idea regulators now mandate
  as a **Digital Product Passport**.
- When a buyer **keeps** an order past the return window, they earn **Green Credits**
  ([`backend/green/`](backend/green/)) redeemable **only in the Revive store** — rewarding customers
  for *not* returning, and channelling that reward back into second-life inventory. A
  self-reinforcing loop: fewer returns feed more Revive inventory, and credits drive more Revive
  purchases.

---

## 3. End-to-End Workflow

```
User returns item (Return Wizard)   ┐
                                    ├─► Catalog match  (auto-fills MRP, ASIN, reference image)
User lists item   (Sell It)         ┘            │
                                                 ├─► Category Profile  (drives capture + grading)
                                                 └─► Risk Tier         (sets LOW/MED/HIGH — backend only)
                                                                │
                              Capture + image integrity  (category / instance / duplicate gates)
                                       VLM + DINOv2 + pHash       │
                                                                  ▼
                                        AI grading (<2s)   ── Cosmetic A–F + functional status
                                                                  │
                                                                  ▼
                                            ┌────────  Disposition Gate  ────────┐
                                            │                                    │
                          Restock new   Open box   Used·Revive   Renewed·SPN   Recycle/donate
                          (→ New catalog)     └──────────┬──────────┘          (→ NGO / e-waste)
                                                         ▼
                                          List in unified storefront
                                          (Revive AI card · Renewed pro card)
                                                         │
                                                         ▼
                                Two-stage smart routing  (demand gate → EV routing by tier)
                                    ┌────────────┬───────────────┬──────────────┐
                              Route A·Direct   Route B·Kirana   Route C·Central/SPN
                               peer <5 km      relay 5–25 km     (Tier 3 / HIGH only)
                                    └────────────┴───────┬───────┴──────────────┘
                                                         ▼
                                       Sale + Health Card  (UPI payout to seller · Green Credits to buyer)
```

The lifecycle state machine lives in [`backend/core/lifecycle.py`](backend/core/lifecycle.py)
(mirrored on the frontend in `frontend/src/utils/lifecycle.js`): an item does **not** appear live
instantly — it progresses through a short, narratable track per disposition
(*Pickup scheduled → Refurbishing → Certified & live → Sold* for Renewed;
*Held locally → Live near you → Sold* for Revive).

---

## 4. Feature Walkthrough

### Instant catalog match + AI grading
The system recognizes the exact product from the catalog and pulls its real specs and price, so
condition is judged against the *true item*, not a seller's guess. The grading pipeline
([`ml/grade.py`](ml/grade.py)) fuses **Grounding DINO** (defect bounding boxes) + **CLIP**
(completeness vs. reference) + an **LLM caption** (severity) into a final **A–F grade + confidence**,
targeting **<2s** latency.

### Image integrity gates (anti-fraud)
Before grading, three gates run so a customer can't return a cheap item by photographing an
expensive one (or scan the wrong product):
- **Category gate** — VLM confirms "is this a shoe?" ([`ml/verify.py`](ml/verify.py))
- **Instance gate** — DINOv2 cosine similarity confirms *this* shoe, not just *a* shoe
  ([`ml/instance_match.py`](ml/instance_match.py))
- **Duplicate gate** — perceptual hash (pHash) catches reused/duplicate photos
  ([`ml/image_dedup.py`](ml/image_dedup.py))

All gates **fail open** if their model is unavailable, so the demo never dead-ends on an infra hiccup.

### Virtual Try-On + FitTwin (return *prevention*)
- **Virtual Try-On** ([`ml/tryon.py`](ml/tryon.py)) uses IDM-VTON via a HuggingFace Space so shoppers
  can preview colours/variants before buying.
- **FitTwin** ([`ml/fittwin/`](ml/fittwin/), [`backend/prevent/`](backend/prevent/)) finds the right
  size by learning from **other shoppers with a similar body profile** *and* from a user's own
  **kept orders** ([`backend/prevent/fit_profile.py`](backend/prevent/fit_profile.py)) — no
  measurements required. The mined fit signal is `runs_small | true_to_size | runs_large`.
- **Bracketing catch** — when a shopper keeps several sizes of the same item at checkout, a pop-up
  notices and offers to take them back to confirm the best fit before ordering. Since most apparel
  returns come from wrong colour/variant/fit, fixing that doubt at the point of purchase is the
  cheapest return to handle.

### Review intelligence — "What buyers say"
A **multi-agent review panel** ([`ml/review_insights.py`](ml/review_insights.py)) mines each
product's **real Amazon reviews** (Amazon Reviews 2023 / UCSD-McAuley dataset) into:
- an offline, deterministic **fit signal**, and
- a cached summary (`tldr`, `pros`, `cons`, `fit_verdict`, `return_reasons`, `nudge_line`)

driving the home-grid badge, the product-page "What buyers say" card, the **checkout return nudge**,
and the FitTwin line. The panel runs **once at seed time** (cached by ASIN), so it's free at request
time and fails open offline.

### Smart disposition + local routing
The Disposition Gate + two-stage demand-gravity / EV router (see §2, §6) route each item to a nearby
buyer instead of a long warehouse round-trip — cutting cost, speeding resale, and sharply lowering
carbon.

### Product Health Card
Every item ships with a signed, tamper-evident record of grade + defect photos + condition
([`backend/trust/`](backend/trust/)), with a QR code and an append-only ledger. The buyer can see
exactly what they're getting and verify it hasn't been faked.

### Green Credits
Keep an order instead of returning it → earn **Green Credits**, redeemable only in the Revive store
([`backend/green/credits.py`](backend/green/credits.py)). A pending earn is created at purchase and
**vests** when the return window closes; initiating a return **cancels** it. Buyers only — sellers
never earn.

---

## 5. System Architecture

```
                          ┌──────────────────────────────────────────┐
   Browser (React SPA) ──►│  CloudFront CDN  +  Vercel (static SPA)   │
                          └──────────────────────────────────────────┘
                                          │  HTTPS (JWT cookie)
                                          ▼
                          ┌──────────────────────────────────────────┐
                          │  Load balancer (nginx) → Django + DRF     │   ← stateless, horizontally
                          │  (gunicorn, JWT auth, replicas)           │     scalable
                          └──────────────────────────────────────────┘
                              │            │              │
              ┌───────────────┘            │              └────────────────┐
              ▼                            ▼                               ▼
   ┌────────────────────┐    ┌────────────────────────┐      ┌────────────────────────┐
   │ PostgreSQL          │    │ Redis (Upstash)         │      │ Celery ML worker fleet  │
   │ (Supabase)          │    │ • grade cache           │      │ • Grounding DINO        │
   │ ACID orders/listings│    │ • demand index          │◄────►│ • DINOv2 / CLIP         │
   │                     │    │ • Celery broker/result  │      │ • LLM caption (Haiku)   │
   └────────────────────┘    │ • storefront read-cache │      │ • EV router / disposition│
                             └────────────────────────┘      └────────────────────────┘
                                          ▲                               │
                                          │                  uploads ─────┘
                          ┌──────────────────────────────────────────┐
                          │  AWS S3 (images) → CloudFront             │
                          └──────────────────────────────────────────┘
```

Key principle: **the heavy ML pipeline is fully decoupled from the request path.** The Django API
pushes a job ticket to Redis and returns a `job_id` in O(1); background Celery workers do the GPU/CPU
work, so the web server never blocks under upload spikes.

---

## 6. The Decision Engine — Core Algorithms

REVIVE is not a CRUD app with a database behind it. The hard part is **three ML decisions about a
physical object** — grading it, routing it, and matching it to demand — all in a couple of seconds
and cheap enough to run on millions of items.

### 6.1 Automated Defect Grading (CV + LLM fusion) — [`ml/grade.py`](ml/grade.py)
```
Grounding DINO (defect boxes) → LLM (severity from cropped defects)
        → DINOv2 (catalog-match verify) → Fusion classifier → A/B/C/D/E/F + confidence
```
- SHA-256 cache check first (Redis in prod, file in dev) → repeat uploads are ~0 ms.
- GPU/CPU-intensive, so **fully decoupled via a Celery queue** — the API is **O(1)** (push ticket,
  return `job_id`); workers scale 1→N independently.
- Target latency: cached ~0 ms, uncached GPU ~1.5 s, CPU ~4 s.

### 6.2 Expected-Value (EV) routing optimizer — [`ml/route.py`](ml/route.py)
```
EV(path) = P(sell | grade, category, price) × resale_price
         − logistics_cost(distance_to_nearest_demand_cluster)
         − refurb_cost(defects)
         − holding_cost(days_to_sell)

route = argmax(EV) over { resell_p2p, resell_warehouse, refurbish, donate, recycle }
special rule:  if max(EV) < donation_tax_benefit + brand_value → donate
```
- **Stateless pure function**, near-zero DB reads → evaluates thousands of routes in parallel,
  optimized to run on serverless. Effectively **O(1)** per item.
- A LightGBM price model ([`ml/artifacts/price_model.pkl`](ml/artifacts/)) supplies grade/category
  resale value; the sell-probability model supplies `P(sell)`.
- Tier rules constrain eligible routes: Route A (direct peer, <5 km), Route B (kirana relay,
  5–25 km), Route C (central/SPN, HIGH-risk only).

### 6.3 Geospatial demand indexing — [`ml/build_demand_index.py`](ml/build_demand_index.py), [`ml/geohash.py`](ml/geohash.py)
```
demand_gravity(cell) = demand / (1 + dist² / 25)
HSET demand:{geohash5}  {category} → {demand_score, local_buyers, nearest_cluster, dist_km}
```
- A background cron job pre-computes local demand every ~6 hours into Redis; lookups are **O(1)**
  (<1 ms) instead of heavy on-the-fly SQL `GROUP BY`.
- `geohash_encode(lat, lng)` turns a live browser location into a demand cell (geohash-5 ≈ 5 km).
- Falls back gracefully: Redis → `ml/artifacts/demand_index.json` → in-memory synthetic index, so it
  works fully offline for the demo.

### 6.4 Disposition Gate — [`ml/disposition.py`](ml/disposition.py)
A deterministic rule cascade over `(grade, category, sealed, opened, verified_match, functional)`
producing one of the five outcomes in §2. Sealed-only/hygiene categories that arrive opened are
forced to `RECYCLE_DONATE`; verified sealed items become `RESTOCK_NEW`; everything else grades into
Open-box / Used / Renewed.

### 6.5 Hybrid recommender — [`ml/recommend.py`](ml/recommend.py)
```
score(user, item) = α·ALS_score + β·CLIP_sim(history) + γ·grade_boost + δ·proximity_boost
```
Implicit ALS (collaborative) + CLIP content + a grade boost (A=1.0…D=0.0) + a same-geohash proximity
boost. CLIP content carries cold-start refurb items that have no interaction history.

> **Note:** REVIVE does **not** ship a trained return-risk prediction model. The checkout "return
> nudge" is driven by the **review-mined heuristic** signal from §4 (review intelligence) plus
> FitTwin, not by a predictive risk model.

---

## 7. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | React 19 (Vite), Tailwind CSS, React Router 7, Axios | Fast, interactive SPA for Health Cards & Virtual Try-On |
| **Backend** | Django 4.2 + Django REST Framework, SimpleJWT | Robust ORM, rapid APIs, stateless JWT → effortless horizontal scaling |
| **Async** | Celery + Redis | Decouples the GPU/CPU grading pipeline from the request path |
| **Data / ML** | PyTorch, Grounding DINO, DINOv2, CLIP, LightGBM, Implicit ALS, Claude Haiku (LLM) | CV defect detection + fusion grading, price/recommendation models, LLM severity & review panels |
| **Datastores** | PostgreSQL (Supabase), Redis (Upstash) | ACID for orders/payments; microsecond cache + demand index |
| **Storage** | AWS S3 + CloudFront CDN | Infinitely scalable image storage; web servers never serve heavy blobs |
| **Infra** | Docker, gunicorn, WhiteNoise, nginx, Vercel | Identical envs across nodes; static SPA on the edge |

---

## 8. Repository Layout

```
amazon-hackon/
├── backend/                     # Django + DRF API
│   ├── revive/                  # project: settings, urls, wsgi/asgi, celery
│   ├── core/                    # User, Product, Review, Listing, Order
│   │   ├── lifecycle.py         # second-life state machine (source of truth)
│   │   ├── urls/                # auth.py · listings.py · orders.py
│   │   └── management/commands/ # seed_demo, seed_fittwin, import/assign helpers
│   ├── grade/                   # grading endpoints + Celery task (tasks.py) + try-on proxy
│   ├── route/                   # EV routing + demand-gate endpoints
│   ├── trust/                   # Product Health Card (hash, QR, ledger)
│   ├── prevent/                 # FitTwin + checkout return-nudge (RiskView, fit_profile)
│   └── green/                   # Green Credits (earn/vest/redeem/donate)
│
├── ml/                          # the decision engine (importable by backend)
│   ├── grade.py                 # CV+LLM fusion grading pipeline
│   ├── disposition.py           # Disposition Gate
│   ├── route.py                 # EV optimizer + demand gravity
│   ├── build_demand_index.py    # geohash demand index → Redis
│   ├── category_profiles.py     # per-category capture + rubric (Axis A)
│   ├── risk_tier.py             # value × fraud-risk tiering (Axis B, backend-only)
│   ├── verify.py / instance_match.py / image_dedup.py   # integrity gates
│   ├── review_insights.py       # multi-agent review panel → fit signal + summary
│   ├── recommend.py             # hybrid recommender
│   ├── fittwin/                 # body-profile size matching
│   ├── inference/               # dino.py · clip_model.py loaders
│   └── artifacts/               # trained models + caches (price, ALS, demand, grade cache)
│
├── frontend/                    # React (Vite) SPA
│   └── src/
│       ├── pages/               # Home, ProductDetail, Checkout, ReturnWizard, SellIt, …
│       ├── components/          # Header, ProductFeed, LifecycleTimeline, …
│       ├── utils/               # categoryProfiles.js · tier.js (mirror backend)
│       └── context/             # Auth + Cart
│
├── data/                        # dataset download + import + test scripts
├── docker-compose.yml           # db + redis + 2× backend + nginx
├── Dockerfile · nginx.conf · .env.example
└── final_idea_v1/v2/v3.md       # design docs (v2/v3 are the canonical specs)
```

---

## 9. Data Model

Core models in [`backend/core/models.py`](backend/core/models.py):

- **User** (`AbstractUser`, email login) — `return_rate`, live `lat/lng` + `geohash5`, and FitTwin
  fields (`height_in`, `weight_lb`, `bust_in`, `body_type`, `fit_size_profile`).
- **Product** — catalog reference (`asin`, `title`, `category`, `brand`, `mrp`,
  `reference_image_url`, real `rating`/`rating_count`), plus review-mined `fit_signal` and
  `review_summary` JSON.
- **Review** — real Amazon review text shown Amazon-style on the product page.
- **Listing** — the core inventory unit. Carries `source` (new/return/p2p/warehouse/renewed),
  `grade` (A–F), `price`, `geohash5`, `status` (the lifecycle stages), routing result
  (`chosen_path`, `tier`, `ev_data`), and v2 fields `risk_tier`, `disposition`, `condition_label`,
  plus seller-uploaded angle `images`.
- **Order** — purchase record (standard + P2P), `size` (feeds `fit_size_profile`),
  `escrow_released`, `return_window_closes`.
- **HealthCard** ([`backend/trust/models.py`](backend/trust/models.py)) — tamper-evident grade record
  with `card_hash` (SHA-256), inspection type (AI / AI+agent / AI+SPN), QR + ledger.

---

## 10. API Reference

All under `/api/`. Auth is JWT via httpOnly cookies.

| Group | Method · Path | Purpose |
|-------|---------------|---------|
| **Auth** | `POST /api/auth/register/` · `login/` · `logout/`, `GET /api/auth/me/` | Account + session |
| **Listings** | `GET /api/listings/`, `GET /api/listings/<id>/` | Browse / detail |
| | `GET /api/listings/mine/`, `POST /api/listings/<id>/manage/`, `POST /api/listings/<id>/advance/` | Seller management + lifecycle advance |
| | `POST /api/returns/process/` | Run a return through grading + disposition |
| | `GET /api/catalog/suggest/` | Catalog autocomplete for Sell-It |
| | `GET /api/recommend/` | Hybrid recommendations |
| **Orders** | `GET·POST /api/orders/` | List / create orders |
| **Grading** | `POST /api/grade/` | Synchronous grade |
| | `POST /api/grade/route/` · `inspect/` | Grade + route (+ integrity gates) |
| | `POST /api/grade/heatmap/` | Defect heatmap |
| | `POST /api/grade/async/`, `GET /api/grade/status/<job_id>/` | Async (Celery) grade + poll |
| **Try-On** | `POST /api/tryon/` | Virtual try-on |
| **Routing** | `POST /api/route/`, `POST /api/route/gate/` | EV route + demand gate |
| | `GET /api/route/heatmap/` · `local-demand/`, `POST /api/route/apply/<listing_id>/` | Demand data + apply route |
| **Health Card** | `POST /api/card/generate/`, `GET /api/card/<listing_id>/` | Generate / fetch card |
| | `GET /api/card/<listing_id>/verify/` · `qr/`, `POST /api/card/<listing_id>/ledger/` | Verify hash / QR / append ledger |
| **Prevent** | `POST /api/prevent/risk/`, `GET·POST /api/prevent/fit-twin/` | Checkout return nudge + FitTwin |
| **Green Credits** | `GET /api/credits/me/`, `POST /api/credits/vest/` · `redeem/` · `donate/`, `GET /api/credits/<user_id>/` | Wallet + earn/spend |

---

## 11. Local Setup

### Prerequisites
- Python 3.11+, Node 18+, and (optionally) Redis. The system runs **fully offline** without Redis or
  any LLM key — caches fall back to files and all ML gates fail open.

### Backend
```bash
cd backend
python -m venv .venv && source .venv/bin/activate     # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env                              # then fill in keys as needed
python manage.py migrate
python manage.py runserver                              # http://localhost:8000
```

### ML dependencies (heavy CV models — optional for the API to boot)
```bash
pip install -r ml/requirements.txt   # torch, transformers, Grounding DINO, CLIP, LightGBM, …
```
The backend `requirements.txt` ships only the **lightweight** ML deps (numpy, sklearn, LightGBM,
OpenAI SDK) so the API runs without torch; install `ml/requirements.txt` to enable on-device CV
grading.

### Frontend
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

### Async grading (optional, production-like)
```bash
# in backend/, with Redis running:
celery -A revive worker -l info
```

---

## 12. Seeding the Demo

The storefront is built by management commands in
[`backend/core/management/commands/`](backend/core/management/commands/):

```bash
cd backend
python manage.py seed_demo       # curated branded catalog + real Amazon ASINs + reviews + panels
python manage.py seed_fittwin    # FitTwin body-profile index
```

`seed_demo` combines two sources:
- the **curated branded catalog** (`_demo_catalog.py`) — phones, laptops, monitors, shoes, apparel +
  a few Home/Books/Toys — which guarantees Sell-It catalog search and recognizable demo brands; and
- **real Amazon ASINs** from `data/catalog_{bucket}.jsonl` (real image + title + price), each
  carrying its **own ASIN's real reviews 1:1** (`_real_catalog.py`).

Every product is a normal Amazon **New** listing; a hand-picked subset is *also* listed as **Revive**
(AI-graded, seller photos) or **Renewed** (professional) on the same product. Each product's reviews
are mined by the Pillar-4 review panel into a fit signal + "What buyers say" summary that also drives
the checkout nudge. Real products are skipped gracefully if the catalog files aren't present, so the
storefront still runs on the curated set alone.

> The real-Amazon dataset pipeline lives in [`data/`](data/) (`download_reviews.py`,
> `download_datasets.py`, plus `extract_mercari.py` for the price-model training set). The legacy
> `import_amazon_data.py` / `seed_real` path is deprecated in favour of `seed_demo`.

---

## 13. Configuration & Environment Variables

Copy `.env.example` → `.env`. Key settings (see [`backend/revive/settings.py`](backend/revive/settings.py)):

| Variable | Purpose | Default |
|----------|---------|---------|
| `LLM_PROVIDER` | `openrouter` \| `anthropic` \| `bedrock` \| `local` | `openrouter` |
| `OPENROUTER_API_KEY` / `OPENROUTER_MODEL` | LLM caption + review panels (vision-capable Haiku) | — |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Direct Anthropic path | `claude-haiku-4-5` |
| `BEDROCK_MODEL_ID` / `AWS_REGION` | Production Bedrock path (one-env-var swap) | — |
| `USE_REDIS` / `REDIS_URL` | Demand index, grade cache, Celery broker | off → file/in-memory fallback |
| `DATABASE_URL` | Postgres DSN; unset → SQLite for local dev | SQLite |
| `AWS_STORAGE_BUCKET_NAME` / `AWS_S3_REGION_NAME` / `AWS_CLOUDFRONT_DOMAIN` | S3 + CDN image storage (active when bucket set) | local `media/` |
| `SECRET_KEY` / `DEBUG` / `ALLOWED_HOSTS` | Standard Django | dev defaults |
| `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` | Cross-origin cookie auth | localhost |
| `REVIVE_INSTANCE_THRESHOLD` | DINOv2 instance-match cutoff | `0.55` |
| `REVIEW_PANEL_MULTI` | `1` = fan out one LLM call per review specialist | off (single cached call) |

**Provider note:** for AI work, REVIVE defaults to the latest, most capable Claude models. Vision
grading uses a **vision-capable** Haiku (e.g. `anthropic/claude-3-haiku` via OpenRouter, or Anthropic
direct) — non-vision routes must not be used for grading.

---

## 14. Deployment & Scaling

[`docker-compose.yml`](docker-compose.yml) brings up the full stack — **Postgres + Redis + 2× Django
(behind nginx)** — modelling the production topology:

```bash
docker compose up --build       # nginx :80 → backend1/backend2 → db + redis
```

REVIVE handles **100×–1000× growth** through three independent, decoupled scaling layers:

1. **Stateless horizontal API scaling** — Django stores zero session state (JWT cookies); spin up
   more identical containers behind the load balancer, any instance serves any user.
2. **Decoupled ML worker fleet** — grading is queued via Celery + Redis. A spike of 100k uploads
   drops 100k tickets into the queue without crashing the API; ML workers scale **1 → 500**
   independently of frontend browsing.
3. **Aggressive read caching + edge storage** — ~99% of e-commerce traffic is reads; storefront
   listings and Health Cards are cached in Redis (60 s TTL), and all images live on S3 + CloudFront,
   keeping the Django memory footprint tiny.

Live deployment: frontend on **Vercel**, images via **CloudFront**, datastores on **Supabase** +
**Upstash**.

---

## 15. Future Vision

REVIVE starts as a smarter way to handle returns, but the **decision engine underneath is the real
product**. In 1–3 years it becomes the default **second-life layer for commerce** — the system any
returned or unused item passes through to learn what it is, what condition it's in, and where it
should go next. Every item's signed **Product Health Card** is exactly the **Digital Product
Passport** regulators now mandate, positioning REVIVE as the trust-and-routing infrastructure for
the circular economy.

The engine does the same five things for **any physical object** — identify, grade, decide its best
second life, route it to a nearby owner, and certify its condition — so the expansion path is broad:
widen across retail categories → open the engine as an **API** to other sellers → enterprise IT-asset
recovery → durable high-trust segments (auto parts, rental returns, medical equipment) → cross-border
circular infrastructure under EU ESPR.

> *Today, the moment a product is returned, the smartest system in the chain is a shipping label. We
> want "give it a second life" to become a one-tap default that is faster, cheaper, and lower-carbon
> than shipping the item back — turning returns from a multi-billion-dollar liability into a
> strategic recommerce asset.*

---

### Team Vijaya · IIIT Bangalore

| Name | Email |
|------|-------|
| Bojja Sunhith Reddy | Sunhith.Reddy@iiitb.ac.in |
| Harsh Mohta | Harsh.Mohta@iiitb.ac.in |
| Chinthakunta Sai Venkata Chandrahas Reddy | Chandrahas.CSVR@iiitb.ac.in |

*Figures cited from market/operational research are illustrative estimates, not guarantees.*
