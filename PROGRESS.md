# REVIVE v2 — Progress & Handoff (living doc)

> Shared context for any agent/model working on this repo. **Keep this updated as you finish work.** Repo root: `C:\projects\Hackon` (moved out of OneDrive). Design source of truth: **`final_idea_v2.md`**. Original idea: `final_idea.md`. Earlier analyses: `REVIVE_v2_PLAN.md`, `VERIFICATION_v2.md`.
> NOTE: working copy is under `...\OneDrive\Documents\amazon-hackon`. OneDrive has since been **quit** (user confirmed); the mid-merge corruption documented below is resolved. Sandbox bash may still lag behind file-tool writes — that's a sandbox artifact, not disk corruption.

> ## ⚡ CURRENT STATE (read first)
> Pillars 1/2/3/5 integrated; app builds; storefront looks like real Amazon (NEW catalog default + curated second-life). Both Health Cards live. Real Amazon dataset + guaranteed branded demo catalog wired.
> **To run the demo on your machine:**
> ```bash
> cd backend && python manage.py migrate          # applies 0005 + 0006
> python manage.py seed_real --per-file 4000 --revive 50 --renewed 25
> cd ../frontend && npm run build                  # or npm run dev
> ```
> Logins: buyer `demo@revive.in / demo12345`, sellers `*.seller@revive.in / seller12345`.

## SESSION LOG — 2026-06-14 · Integrate Pillars 1/2/3/5 (UNBLOCKED)

The repo was stuck **mid-merge** (`git status`: "All conflicts fixed but you are still merging") with conflict markers physically left in files that had been `git add`-ed without resolving, **plus** OneDrive had **corrupted ~10 source files** (silent truncation + one NUL-byte padding). This made the whole app fail to build and `ml/route.py` fail to import. Fixed everything needed to get Pillars 1/2/3/5 integrated and building.

**What was fixed**
- **Merge conflicts resolved (kept v2 / commit `433e6bf` side):** `ml/route.py` (10 blocks — disposition gate, risk_tier, keras-gated pricing, restock_new, electronics-only kirana block, per-defect discount), `GradingResultPage.jsx` (required-angle gate), `MyListingsPage.jsx` (delist/pause/relist), `ProductDetailPage.jsx` (kept HEAD side here — VTON price/grade props are actually used by `VirtualTryOn.jsx`).
- **OneDrive-corrupted files restored from the git index (`git show :0:<f>`):** `frontend/src/api/client.js`, `components/Header.jsx` (NUL padding), `components/Product.jsx`, `components/ProductFeed.jsx`, `components/stitch/SellIt.jsx`, `components/stitch/VirtualTryOn.jsx`, `pages/HomePage.jsx`, `pages/LoginPage.jsx`, `pages/SignupPage.jsx`, `pages/CheckoutPage.jsx`. (Conflict-marker files were re-resolved from the canonical git blob, not the laggy mount.)
- **Migration conflict fixed:** two leaf nodes (`0004_order_size` + `0004_product_rating`) → created **`core/migrations/0005_merge_0004_order_size_0004_product_rating.py`**. Migrations now apply cleanly in a linear graph.

**Verified this session**
- `ml/route.py` parses + `route_item()` matches §4A expectations exactly (B Footwear→resell_p2p/USED_P2P, A Phone→resell_p2p/OPEN_BOX, E Phone→refurbish/RENEWED_SPN, F→donate, sealed H&K→restock_new @ MRP, C Footwear→resell_p2p).
- **Frontend `vite build` succeeds — 1894 modules, clean** (the only error is an EPERM deleting OneDrive-locked `frontend/dist/`; build to a fresh `--outDir` is clean).
- **Backend `manage.py check` → 0 issues.** All ml modules (`grade, recommend, disposition, risk_tier, category_profiles, geohash, build_demand_index`) parse + import.
- Cross-pillar wiring confirmed: `grade/views.py` orchestrates grade→`route_item`; `trust/` card generate/get/verify/qr/ledger; `green/` wallet/vest/redeem/donate; `core` `RecommendView`. `api/client.js` exposes every endpoint the pages call.
- `check_pillar2.py` shows 12/15; the 3 "fails" are **stale v1 assertions** (price-tier vs risk-tier, HIGH-always-refurbish) that v2 deliberately changed — not regressions.

**Run on your (non-OneDrive) machine to finish DB setup**
- `cd backend && python manage.py migrate` (sandbox couldn't write the OneDrive sqlite — "disk I/O error"; migrations proven to apply against a local copy).
- `python data/check_pillar1.py` needs OpenRouter key + one-time DINO/DINOv2 HF download (network).
- **Don't re-run the old keep-theirs bash scripts** — the OneDrive mount served truncated copies; all edits here were written to canonical disk / from the git blob.

**Still open after this session:** Health Card UI split (two templates) — see §3; everything else in §3 unchanged.

## SESSION LOG — 2026-06-14e · Guaranteed branded demo catalog

Added `core/management/commands/_demo_catalog.py` — 43 guaranteed branded products (Samsung/Vivo/Apple/OnePlus/Xiaomi/Realme phones, Dell/HP/Lenovo/Apple/ASUS laptops, Nike/Adidas/Puma/Reebok/Skechers/Bata shoes, and Allen Solly/US Polo/Levi's/Van Heusen/etc. tees/shirts/pants). `seed_real` now upserts these (always) right after the real import. They carry a very high `rating_count`, so the popularity sort AND the second-life curation surface them first — guaranteeing the demo shows Samsung/Vivo/Apple as **Renewed**, Nike/Adidas shoes + branded apparel as **Revive**, and that Sell-It catalog search reliably finds Nike/Vivo/Samsung/Dell/Levi's/etc. Verified end-to-end (real data + demo) — clean run, brands present + curated.

**Final demo seed command** (uses everything in `data/meta_*.jsonl`):
```bash
cd backend && python manage.py migrate
python manage.py seed_real --per-file 4000 --revive 50 --renewed 25
```
For even more phones/laptops/shoes/apparel, delete the relevant `data/meta_*.jsonl` and re-download with a bigger cap (downloader skips existing files):
```bash
python data/download_datasets.py --meta --category Phones      --max-items 8000
python data/download_datasets.py --meta --category Electronics --max-items 8000
python data/download_datasets.py --meta --category Clothing    --max-items 8000
```
`seed_real` rebuilds the DB from the downloaded files each run — your downloaded data is never deleted.

## SESSION LOG — 2026-06-14d · Real-Amazon storefront + seller photos

Fixed the "everything is Revive/Renewed" problem: the store now looks like real Amazon — a NEW catalog by default, with only a curated minority listed as second-life.

**Model / backend**
- `Listing.Source.NEW = 'new'` added; `grade` now `blank=True`; new `Listing.images` JSONField (seller angle shots). Migration **`core/0006_*`** (run `migrate`).
- **Every product → one New listing at MRP.** `ListingListView`: no `source` → New catalog (popularity-sorted, 120); `source=revive` → p2p/return/warehouse; `source=renewed` → renewed; `source=all` → everything.
- `ListingSerializer` adds `is_new`, `mrp`, `images`, and `second_life` (a New tile's "Used/Renewed from ₹X" summary). `ListingDetailView` adds `buying_options` (New + second-life on the same product, New first). Live Sell-It POST now persists uploaded photos to `Listing.images`.

**Seed (`seed_real`)**
- Imports the FULL catalog as New, then **curates only ~60 second-life** (default `--revive 40 --renewed 20`): Renewed = high-value electronics (certified, no seller); Revive = a category-spread with seller angle photos. The rest stay New. Grades are only on the curated set — New items are ungraded (real grading stays the live AI demo).
- Verified on the REAL downloaded data: **1685 products → 1685 New · 40 Revive · 20 Renewed · 60 cards.** API check: All=120 New, Revive=40, Renewed=20, search filters New, a New tile returns buying_options [New, Used] + a `second_life` summary.

**Frontend**
- `Product.jsx`: New tiles (no grade badge, real rating + count, "Used/Renewed from ₹X") vs second-life tiles (grade + Revive/Renewed badge + strikethrough MRP/% off).
- `ProductFeed.jsx`: tabs All / Shop Revive / Renewed with surface-aware heading.
- `ProductDetailPage.jsx`: buying-options block in the buy box + a seller-photos strip.
- `HealthCard.jsx` Revive card: seller-photos strip.
- Frontend `vite build` clean; `manage.py check` 0 issues.

> **You must re-run on your machine:** `python manage.py migrate` then `python manage.py seed_real` — your current DB still has the old all-second-life data. After that the homepage is the New catalog and only ~60 items are Revive/Renewed.

## SESSION LOG — 2026-06-14b · Real Amazon dataset (replaces demo seed)

Wired the real **Amazon Reviews 2023 (UCSD/McAuley)** catalog in place of the hand-typed demo seed, with intelligent categorisation and v2-routed listings. (Note: this sandbox can't download GB-scale files or write the OneDrive-free sqlite, so the **download + import run on your machine**; the pipeline was validated end-to-end against a real-schema sample on a local DB copy.)

**New / changed files**
- `data/download_datasets.py` — added **`download_amazon_meta()`** + `--meta` flag. Streams `meta_*.jsonl.gz` from UCSD and **stops after N usable items**, so you pull a few MB, not the full multi-GB file. Writes `data/meta_<category>.jsonl`. Categories: Electronics, Phones, Clothing, Home, Sports, Toys, Beauty, Books.
- `backend/core/management/commands/import_amazon_data.py` — rewritten. **Per-item category inference** (`infer_category`, title-first; strips the ambiguous "Clothing, Shoes & Jewelry" umbrella so shirts aren't tagged Footwear) → one file yields Phone/Laptop/Footwear/Apparel/… . Every listing is **enriched through `ml.route.route_item()`** for a real grade-adjusted price + tier + risk_tier + disposition + condition_label, gets an image, a round-robin **seller**, a spread **geohash**, and a **Revive vs Amazon-Renewed** source split. Items dispositioned **RECYCLE_DONATE / RESTOCK_NEW are not listed** (they exit the storefront, per §6). Quality filters: real title+image, price ₹50–₹5,00,000.
- `backend/core/management/commands/seed_real.py` — **NEW one-command orchestrator**: ensures demo sellers + buyer, imports every `data/meta_*.jsonl`, generates Health Cards for a sample, creates demo orders + Green-Credit history. `--keep-demo`, `--per-file N`, `--as-listings F`. Replaces `seed_db` for real data.

**How to populate real data (on your machine)**
```bash
cd backend && python manage.py migrate            # graph fixed last session (0005 merge)
# download a slice per category (MB, not GB):
python data/download_datasets.py --meta --category Electronics --max-items 4000
python data/download_datasets.py --meta --category Clothing    --max-items 4000
python data/download_datasets.py --meta --category Home        --max-items 3000
python data/download_datasets.py --meta --category Sports      --max-items 2000
python manage.py seed_real                         # imports all data/meta_*.jsonl
```

**Validated this session** (real-schema 12-item sample, local DB copy): smart categorisation correct across Phone/Laptop/Electronics/Footwear/Apparel/Home/Beauty/Books/Toys/Sports; bad rows (no price / no image / empty title) filtered; listings carry real MRP→routed price, tier 1/2/3, LOW/MEDIUM/HIGH risk, OPEN_BOX/USED_P2P/RENEWED dispositions, sellers, geohash; Revive + Amazon-Renewed surfaces both populate; opened-hygiene item correctly excluded; Health Cards + demo orders + credits created. `manage.py check` → 0 issues; both commands discoverable.

> Sandbox-mount caveat (worse this session): bash served **persistently truncated** copies of files written by the file-tools, so the two management commands were (re)written via bash and patched there; the canonical on-disk files are complete and correct (verified via direct read). If a bash build/parse ever shows a truncation in a freshly-written file, it's the mount — read the file to confirm.

## 0. What REVIVE is
AI decision engine for returned/unused products: identify product from catalog → grade condition → **Disposition Gate** decides destination (Restock-New / Open-box / Used / Renewed / Recycle) → two-stage EV routing with geohash demand-gravity → Product Health Card → Green Credits. Stack: Django REST (`backend/`), React+Vite (`frontend/`), ML in `ml/` (Django-free, importable).

## 1. v2 architecture decisions (LOCKED — see final_idea_v2.md §2, §6)
- **Two independent axes (not one "tier"):** (a) **Category Profile** (product type) drives photo prompts + grading rubric + condition labels — customer-facing; (b) **Risk Tier** (value × fraud-risk: LOW/MEDIUM/HIGH) drives verification depth + guarantee + route eligibility — **backend-only, never shown to customer**.
- **Disposition Gate is authoritative** for the destination; EV optimizer only picks the physical resell route. Sealed+verified → Restock as New (normal catalog, full price, NOT Revive). Opened grade-A → Open box. Used B–D → Revive. Grade D–E electronics / HIGH → Renewed (SPN). Grade F/unsafe → Recycle.
- **Grades extended A–F**: A/B/C/D cosmetic + **E (functional defect/parts)** + **F (recycle)**.
- **Storefront = two surfaces only: Revive + Renewed** (Warehouse/Returns tabs removed). Renewed = Amazon authorized-center refurb → **professional Health Card** (repairs, usage, warranty, NO AI grade). Revive = AI-scanned seller/return items → **AI Health Card** (AI grade + defects + seller photos + seller rating + guarantee).
- **Location**: ask once for permission (silent), use for nearest-first sort only. No persistent "deals near you" bar.
- **Pricing**: catalog-match sets MRP (seller doesn't type it) + system-suggested resale price (adjustable ±15%); per-defect deductions applied.

## 2. IMPLEMENTED (with files)
### ML (`ml/`) — unit-tested green earlier
- `category_profiles.py` — capture prompts / rubric / condition labels per category; `is_electronics`, aliases. (Q1/Q7/Q8)
- `risk_tier.py` — `risk_tier(mrp,category)`, `tier_int`, `tier_meta`. (Q5)
- `disposition.py` — disposition gate → outcome + condition_label + customer_message. (Q11)
- `geohash.py` — `geohash_encode/decode`. (location)
- `instance_match.py` — DINOv2 (CLIP fallback) instance match vs catalog ref; fails open w/o torch. (Q4)
- `image_dedup.py` — dHash duplicate-photo detection (dhash returns None on failure; 0 is valid). (Q6)
- `route.py` — wired risk_tier + disposition (AUTHORITATIVE) + grades E/F + electronics-only kirana block + per-defect price discount + restock_new price=mrp. Tries `price_keras` only if `REVIVE_USE_KERAS_PRICE=1`, else heuristic.
- `price_keras.py` — loads model1_best.keras+model2_best.keras+price_vectorizers.pkl; gated behind `REVIVE_USE_KERAS_PRICE=1` (so 2.3GB model never loads during scans by default). (Q3/perf)
- `notebooks/export_vectorizers.py` — regenerates the missing TF-IDF vectorizers from Mercari train.tsv (NO retraining) → `price_vectorizers.pkl`.

### Backend (`backend/`)
- `core/models.py`: User.lat/lng; **Listing.Source.NEW**, `grade` blank-able, **Listing.images** (seller angle shots, JSON); risk_tier/disposition/condition_label, grades E/F, statuses paused/delisted; Product.rating/rating_count.
- Migrations: `0003_v2_fields`, `0004_product_rating`, **`0005_merge_*`** (leaf-node fix), **`0006_listing_images_alter_listing_grade_and_more`** (NEW source + images). Run `migrate`.
- `core/views.py`: **NEW-catalog storefront** — `ListingListView` default = New catalog (popularity sort, 120); `?source=revive` / `?source=renewed` / `?source=all`. `ListingDetailView` adds **`buying_options`** (New + second-life). POST persists **seller photos** to `Listing.images`. Plus geohash-on-create, Near-me sort, ManageListingView (delist/pause/relist), CatalogSuggestView, RecommendView (excludes New).
- `core/serializers.py`: ListingSerializer adds **`is_new`, `mrp`, `images`, `second_life`** (New tile's "Used/Renewed from ₹X").
- `route/views.py`: `LocalDemandView`; accepts grades E/F.
- `grade/views.py`: InspectAndRouteView wired **instance gate** + **dedup gate**; `skip_match=true` for seller's own item.
- `trust/views.py`: `_serialize_card` returns `source`, `condition_label`, `seller_name`, `product` block (self-describing card → drives Revive vs Renewed UI).
- `core/management/commands/`: **`import_amazon_data.py`** (smart per-item categorise + route-enriched second-life), **`seed_real.py`** (NEW catalog + curated ~60 second-life + cards + orders + credits), **`_demo_catalog.py`** (43 guaranteed branded products, high rating_count). `data/download_datasets.py` has `--meta` streaming downloader.

### Frontend (`frontend/src/`)
- `components/Product.jsx` — **New tiles** (no grade badge, real rating + count, "Used/Renewed from ₹X") vs **second-life tiles** (grade + Revive/Renewed badge + strikethrough MRP/% off).
- `components/ProductFeed.jsx` — tabs **All / Shop Revive / Renewed**, surface-aware heading.
- `pages/ProductDetailPage.jsx` — **buying-options block** (New + Renewed/Revive) + **seller-photos strip**; VTON props.
- `components/stitch/HealthCard.jsx` — **dispatcher on `source`**: RenewedHealthCard (professional, no AI grade) + ReviveHealthCard (AI grade + defects + functional + seller name/rating + **seller photos strip** + guarantee).
- `pages/HomePage.jsx` — one-time location, near-me sort; maps is_new/mrp/second_life/rating through.
- `pages/MyListingsPage.jsx` — Delist/Pause/Relist. `pages/GradingResultPage.jsx` — category prompts + required-angle gate. `components/stitch/SellIt.jsx` — category prompts, grade-all-images, catalog match → MRP + suggested price.
- `api/client.js` — grade/route/card/credits/recommend/storefront/manageListing/suggestCatalog.

## 3. LEFT TO DO
### DONE since v2 integration (kept for reference)
- ✅ **Health Card UI split** — `HealthCard.jsx` dispatcher on `source`: Renewed (professional, no AI grade) + Revive (AI grade + defects + functional + seller + guarantee).
- ✅ **Seller photos persisted per listing** — `Listing.images`; seeded for curated Revive + persisted by live Sell-It POST; shown on product page + Revive card.
- ✅ **Real-Amazon storefront** — `Source.NEW` + New catalog default; only a curated minority is Revive/Renewed; buying-options block; `second_life` summary.
- ✅ **Real Amazon dataset + guaranteed branded demo catalog** — `seed_real` + `_demo_catalog`.
- ✅ **Restock-as-New** — importer excludes RESTOCK_NEW/RECYCLE_DONATE from second-life listings (they stay in the New catalog / exit), per §6.

### Still open / optional
- **Review text**: importer stores rating + rating_count only. Add a `Review` model + import review jsonl if individual reviews are wanted.
- **Real demand index (Q10):** `ml/build_demand_index.py` still synthetic; feed real order/search history.
- **DINOv2 threshold calibration (Q4):** env `REVIVE_INSTANCE_THRESHOLD` default 0.55 — calibrate on real pairs.
- **Demo product images** are clean category-representative Unsplash URLs (a few phones/laptops share one) — swap exact press shots into `_demo_catalog.py` `IMG`/items if desired.
- **S9–S11** (ops console, agent app, kirana app) — deferred.
- **Servable trained price model** — optional; see §5.

## 4. TESTS TO RUN (on your machine — sandbox can't run reliably, see §6)
First: `cd backend && python manage.py migrate` then `python manage.py check`.
Then `cd frontend && npm run build`.

**A. Routing/disposition (most important — just changed, unverified at runtime):**
```python
# from repo root, after: pip env with ml importable
from ml.route import route_item
for g,c,m,sealed in [('B','Footwear',6000,False),('A','Phone',8000,False),
                     ('E','Phone',8000,False),('F','Apparel',1500,False),
                     ('A','Home & Kitchen',2500,True),('C','Footwear',3000,False)]:
    r=route_item('x',g,c,defects=[{'severity':'minor'}],geohash5='tdr1w',mrp=m,
                 sealed=sealed,opened=not sealed)
    print(g,c,m,'->',r['chosen_path'],r['disposition'],r['condition_label'],r['price'])
```
EXPECT (the bug fixes): B Footwear→`resell_p2p`/`resell_warehouse` (NOT donate); A Phone open-box→`resell_*` (NOT refurbish); E Phone→`refurbish`/RENEWED_SPN; F→`donate`/`recycle`; sealed Home&Kitchen→`restock_new` with price==MRP(2500); C Footwear→`resell_p2p`.
**If you see donate/refurbish for B/A, delete `__pycache__` (stale bytecode) and re-run.**

**B. Sell flow (SellIt):** list a **shoe** → must ask soles/insole, NEVER screen/battery; list a **phone** → screen-on + battery. Upload all required angles → "Grade my item" enables → grades the whole set. Uploading the same photo twice → duplicate warning. Catalog match dropdown fills MRP + suggested price (needs §5 data imported).

**C. Return flow (GradingResultPage):** returned shoe asks for soles (not screen); required-angle gate blocks scan; different shoe model → instance-mismatch message (DINOv2 downloads `facebook/dinov2-small` from HF once — needs internet).

**D. Storefront:** **All** tab = NEW catalog (Amazon-like, no grades); **Shop Revive** + **Renewed** tabs = curated second-life; a New product with a second-life option shows "Used/Renewed from ₹X" + buying-options on its page; location asked once; nearest-first ordering.

**E. My Listings:** Delist / Pause / Relist work and update status.

## 5. PRICE MODEL (.keras) — how to make it serve (optional)
`.keras` weights exist in `ml/artifacts/` but the TF-IDF vectorizers were never saved, so weights alone are unusable. To serve them:
1. `cd backend && uv add tensorflow nltk`
2. Run `ml/notebooks/export_vectorizers.py` on Kaggle (same Mercari train.tsv) → confirm printed dim == **150007** → download output to `ml/artifacts/price_vectorizers.pkl`.
3. Set env `REVIVE_USE_KERAS_PRICE=1` and restart backend. Log should show `[price_keras] Keras ensemble + vectorizers loaded.`
Default (no env) = fast catalog/heuristic pricing. RAM ~1GB for the models. Recommended for hackathon: keep heuristic, cite trained RMSLE≈0.42 as offline benchmark.

## 6. ENVIRONMENT GOTCHAS (critical for agents using the sandbox)
- **Sandbox bash mount LAGS behind file-tool (Edit/Write) edits** and can serve truncated/old copies of large just-edited files (observed `route.py` fluctuating 879–885 lines mid-sync). **The canonical files on disk (what your local Python/Read tool sees) are correct.** Don't trust a sandbox SyntaxError on a freshly-edited large file — verify by reading the file; run real tests locally.
- **Stale `.pyc` after the folder move:** Python may prefer old `ml/__pycache__/*.pyc`. If tests show old behavior, `rm -rf ml/__pycache__` (or `find . -name __pycache__ -exec rm -rf {} +`) and re-run. On the sandbox the pyc dir was read-only; use `PYTHONPYCACHEPREFIX=/tmp/x` to force fresh compile.
- Migrations through **0006** must be applied (`python manage.py migrate`): 0005 = leaf-node merge, 0006 = `Source.NEW` + `Listing.images` + blank grade. The OneDrive-mounted sqlite threw "disk I/O error" in the sandbox; migrations were proven to apply against a local copy — run on your machine.
- **Re-seed after pulling**: `seed_real` wipes + rebuilds the catalog from `data/meta_*.jsonl` (your downloaded data is never deleted) and always re-adds the `_demo_catalog` brands.

## 7. ISSUE → STATUS MAP (user's original Q1–Q11 + later feedback)
Q1 return prompts category-based ✅ | Q2 catalog price/match ✅ | Q3 delist ✅ | Q4 instance gate (DINOv2) ✅ | Q5 risk tier backend-only ✅ | Q6 dedup ✅ | Q7 category not tier ✅ | Q8 rubric+E/F ✅ | Q9 grade+defects in price ✅ | Q10 demand index ⚠️ synthetic | Q11 Revive/Renewed + 2 health cards ✅ design & implementation.
Later: multi-image grade ✅ | grading speed (keras gated) ✅ | location once ✅ | real data importer ✅ | disposition-authoritative routing ✅.
Latest feedback: two Health Cards (Renewed vs Revive) ✅ | seller photos persisted + shown ✅ | **real-Amazon storefront** (New catalog default, curated minority Revive/Renewed, All tab, buying options) ✅ | grades are demo-curated only, real grading stays the live AI flow ✅ | guaranteed branded catalog so Sell-It search finds Nike/Vivo/Samsung/Dell/Levi's etc. ✅.
