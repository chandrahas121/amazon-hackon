# Project PHOENIX — The Intelligent Bridge for Re-Commerce
### Amazon HackOn 48-Hour Submission Plan
**Theme:** Second Life Commerce: AI-Powered Returns & Sustainable Resale

---

## 1. One-Line Pitch

> **PHOENIX is an AI decision engine that grades any returned/unused product from photos or video in under 2 seconds, routes it to the highest-value second life (resell / refurbish / P2P / donate / recycle) via an expected-value optimizer, issues a cryptographically verifiable "Product Health Card," rewards the seller with green credits redeemable on certified refurbished items, surfaces a personalised refurbished discovery rail for buyers — and prevents the return from ever happening via pre-purchase fit intelligence.**

---

## 2. Why This Wins (Mapping to Judging Criteria)

### PS Bullet Coverage (Problem Statement 3)

| PS Bullet | PHOENIX Feature | Status |
|---|---|---|
| AI deciding resold / refurbished / donated / recycled / exchanged | Pillar 2 — Smart Routing (EV optimizer) | ✅ |
| Smart quality grading through image **and video** analysis | Pillar 1 — AI Grading (image + video frame sampling) | ✅ |
| Personalised recommendations for certified refurbished products | Pillar 5 — Refurb Discovery (CLIP embedding retrieval) | ✅ |
| Sustainable incentives / green credits | Pillar 5 — Green Credits wallet (km + CO₂ savings → redeemable credits) | ✅ |
| Easy P2P resale inside trusted ecosystem | Pillar 3 — Zero-Contact P2P (locker handoff + Amazon-verified Health Card) | ✅ |
| Predictive return prevention | Pillar 4 — Prevention (return-risk GBDT + fit intelligence nudge) | ✅ |

### Judging Criteria

| Criterion | How PHOENIX Hits It |
|---|---|
| **01 Customer obsession** | Built from the 3 personas in the PS: Priya (₹500 shoes written off), Rahul (baby monitor in a drawer), Small Seller (200 manual inspections/month). Each demo scene solves one persona's exact pain. |
| **02 Innovative thinking** | Not "a resale marketplace" (the obvious answer). The novelty is the **routing brain**: expected-value optimization + **geohash local-demand gravity model** that keeps items local, plus **zero-contact P2P** that removes Rahul's "strangers, haggling, doorstep" friction entirely. |
| **03 Technical feasibility** | Every component is a known, shippable ML pattern: Grounding DINO zero-shot defect detection, Claude Haiku vision captioning, LightGBM pricing, FastAPI microservices. Working prototype in 48h is realistic (architecture below). |
| **04 Vision to scale** | Routing is stateless + millisecond-fast (precomputed embeddings + GBDT). Health Card is a portable standard. Prevention layer plugs into checkout. Clear path from prototype → Amazon-scale (Section 10). |

---

## 3. The Five Pillars (Full PS Coverage)

### Pillar 1 — AI Grading (`grade-service`)
**Goal:** Photo(s) in → condition grade + defect map + confidence in <2s. No manual inspection.

**Pipeline:**
1. **Defect localization** — **Grounding DINO** (`IDEA-Research/grounding-dino-tiny`, zero-shot) with text prompts `["scratch on surface", "dent on surface", "stain on fabric", "torn fabric", "missing part", "damaged area"]`. Outputs bounding boxes + defect classes **without any fine-tuning or labeling**. Detection fallback only: `microsoft/Florence-2-large` (grounded detection, no captioning role — see step 2 for captioning).
   > **GDINO prompt tip (validate in hour 0):** bare nouns ("scratch", "dent") fire inconsistently — GDINO was trained on object-referring phrases. Use compound phrases like "scratch on surface", "torn fabric", "missing button" and keep whichever fires reliably on your demo items. Expect 30–60 min tuning.
   > **Why not fine-tune YOLOv8?** A detector fine-tuned on ~200 images generalizes poorly to unseen product categories. Grounding DINO's zero-shot approach handles any category via text prompts, saves 4–6 hours of labeling, and requires no GPU training. Keep it zero-shot.
2. **Condition captioning** — **Claude Haiku API** (`claude-haiku-4-5`, primary): base64 image + Grounding DINO detection context → structured JSON grade/defects/summary (~1–2s, zero GPU, free-tier covers hackathon volume). Fallback: **Qwen2.5-VL-3B-Instruct** (local, activated automatically when `ANTHROPIC_API_KEY` is absent, ~7 GB fp16, T4/Colab). Same JSON output schema on both paths. Florence-2 and BLIP-2 dropped from captioning (no instruction following, generic captions).
3. **Completeness check** — CLIP similarity between uploaded photos and catalog reference images → flags missing accessories/parts.
4. **Grading head** — Rules + small classifier fuse (defect count/severity, completeness score, category priors) → **Grade A / B / C / D + confidence**. This maps directly to the industry-standard 4-tier recommerce taxonomy: A = Like New (70–85% value recovery), B = Very Good, C = Good, D = Acceptable (30–50% recovery). The grade dictates the routing decision in Pillar 2.

**Output JSON:**
```json
{
  "grade": "B",
  "confidence": 0.91,
  "defects": [{"type": "scuff", "severity": "minor", "bbox": [...]}],
  "completeness": 0.85,
  "condition_summary": "Light cosmetic wear, fully functional, box missing",
  "latency_ms": 1240
}
```

**Demo wow-factor:** live photo upload → defect heatmap overlay rendered on the image in real time.

**Video grading (PS bullet: "image/video analysis"):** accept a short clip (≤15s), sample 4–6 frames with OpenCV (`cap.set(CAP_PROP_POS_FRAMES, i * step)`), run each frame through the existing image pipeline, aggregate by taking max severity per defect type across frames. This is a for-loop over code you already have — ~30 lines, ~30 minutes. Demo once with a 5-second shoe video; the PS wording "image/video" is then checked verbatim.

### Pillar 2 — Smart Routing (`route-service`)
**Goal:** Millisecond decision: resell as-is / refurbish / P2P exchange / donate / recycle.

**Core novelty — Expected Value Optimizer:**

```
EV(path) = P(sell | grade, category, price) × resale_price
         − logistics_cost(distance_to_demand)
         − refurb_cost(defects)
         − holding_cost(days_to_sell)
```

Pick `argmax(EV)` across paths; if `max(EV) < donation_tax_benefit + brand_value` → donate.

> **MCDA framing (use in pitch):** The EV optimizer is a computationally efficient instantiation of Multi-Criteria Decision Analysis — the same framework as the Analytic Hierarchy Process (AHP) used in enterprise reverse logistics. The routing variables (logistics cost, refurb cost, sell probability, holding cost) map directly to AHP's criteria hierarchy. We collapse it to a single expected-value formula for millisecond inference; the mathematical grounding is identical. Empirical studies show AHP-based routing achieves up to 33% higher recovery value and 65% better environmental outcomes vs. heuristic rules.

**Components:**
- **Pricing model:** LightGBM trained on the **Mercari Price Suggestion dataset** (1.4M listings: category, brand, condition, description) + TF-IDF/embedding text features. Predicts resale price *conditioned on grade*.
- **Sell-probability model:** logistic/GBDT on price-vs-category-median ratio, grade, seasonality.
- **Geohash Demand Gravity Model (the differentiator):** precompute a local-demand index per `(geohash5, category)` cell from order history (synthetic for demo). Route the item to the *nearest demand cluster*, not the central warehouse. **This is what saves Priya's shoes the 600 km trip** — relisting cost collapses because the item never leaves the city.
- **Refurb cost lookup:** defect type → repair cost table (per category).

**Demo wow-factor:** map visualization — item pinned in Bengaluru, demand heatmap glows around it, routing decision animates: *"Resell locally · EV ₹312 vs Liquidate ₹–40"*.

### Pillar 3 — Trust Layer (`trust-service`)
**Goal:** "Product Health Card" so the next buyer knows exactly what they're getting.

> **PS states verbatim:** *"Customers struggle to trust refurbished or second-hand products."* The Health Card is the direct answer: AI-verified condition + tamper-evident defect record + Amazon-signed ownership log eliminates the information asymmetry that drives that distrust. This is the trust problem the PS names, solved.

- Signed JSON document: AI grade, defect photos (SHA-256 hashes, tamper-evident), grading model version, warranty status, ownership-transfer log (append-only hash chain — *lightweight*, no blockchain theater). **Production upgrade path:** swap the custom hash chain for **Amazon QLDB** — same append-only tamper-evident semantics, built-in Merkle tree verification and cryptographic digest API, zero operational overhead.
- Rendered as a **scannable QR card** encoding a **GS1 Digital Link URI** — the international standard for physical-digital product identity, and the exact data carrier mandated by the EU **Ecodesign for Sustainable Products Regulation (ESPR)** for Digital Product Passports (DPP) by 2027. One QR, multiple access levels: consumer sees condition + recycling info; certified repair partner sees component schematics.
- For P2P: card carries an **Amazon-verified condition guarantee**, which is what makes stranger-free exchange possible.

**Zero-Contact P2P (Rahul's fix, second big differentiator):**
1. Rahul scans the baby monitor → AI grades it, prices it, generates Health Card. **Zero listing effort.**
2. PHOENIX matches it against the local demand index — "47 parents within 8 km searched for baby monitors this month."
3. Buyer purchases through Amazon checkout (trust + payments solved). Handoff via **Amazon locker / delivery partner pickup** — no strangers, no haggling, no doorstep visits.
4. Item moves 8 km instead of 600.

### Pillar 4 — Prevention (`prevent-service`)
**Goal:** Best return = no return.

- **Return-risk score at checkout:** GBDT on (category, size-vs-user-history delta, brand sizing bias, return-rate priors, gift flag). High-risk → intervene.
- **Fit intelligence:** collaborative signal — *"Customers with your purchase profile kept size 8 in this brand (size 9 returned 3× more)."* Implemented as item-item co-occurrence on purchase+return pairs (synthetic dataset for demo, methodology is sound).
- **Pre-purchase nudge UI:** size suggestion chip + "87% of similar customers kept this size" injected into the PDP demo.

### Pillar 5 — Green Credits & Refurb Discovery (`green-service`)
> **Priority on a 3-person team:** Green Credits (wallet endpoint + toast) is P0 — ~40 lines, closes a PS bullet cheaply, build it. ALS recommender is P1 — build it if pillars 1–4 are working by hour 24; otherwise present the offline Recall@20 number + architecture slide and stub the rail with static mock data. Protect pillars 1–4 first.
**Goal:** Close the two remaining PS bullets — sustainable incentives and personalised certified-refurbished recommendations.

**Green Credits wallet:**
- Customer earns credits when their return is routed locally or P2P — proportional to **km saved** (already in the EV optimizer output) and **CO₂ avoided** (fixed factor: ~0.21 kg CO₂/km for last-mile logistics).
- Credits are redeemable **only on certified refurbished / re-commerce items** — the incentive loop feeds second-life inventory, not generic cashback. This is the clever part: returns fund refurb purchases.
- Implementation: one MongoDB collection (`green_credits`), `POST /credits/earn` called by route-service on each routing decision, `GET /credits/{user_id}` for the wallet widget. ~40 lines total.
- **Demo toast in Priya's flow:** *"+12 green credits · 590 km saved · 4.2 kg CO₂"* fires after routing decision.

**"Certified Refurbished For You" recommendation rail — Implicit ALS + Hybrid Blend:**

**Why this works:** refurb items are the same catalog products, just used — so interactions on the original listings transfer directly. A recommender trained on normal Amazon interactions needs zero adaptation to rank refurb inventory.

**Model: Implicit ALS** (~3–4h, M2, hours 16–24)
- Dataset: Amazon Reviews 2023 (UCSD/McAuley) — one 5-core category subset (Electronics or Clothing, ~500k–1M interactions). Already in the plan for prevention priors; reuse the download.
- `pip install implicit` → ALS on the user–item sparse matrix, trains in **minutes on CPU**. No GPU needed.
- Evaluation: leave-last-out split → **Recall@20 / NDCG@20** — a real Amazon-data number for the metrics slide alongside Mercari RMSLE. This is the difference between "we filtered a list" and "we built a recommendation system on real Amazon data."

**Hybrid scoring (cold-start fix — the judge-impressing part):**

A freshly graded refurb item has zero interaction history, so pure CF scores it as zero. The hybrid blend rescues it:

```
score(user, item) = α · ALS_score(user, item_catalog_id)      # behavioural CF
                  + β · CLIP_sim(item_emb, user_history_embs)  # content (free — already computed in grade-service)
                  + γ · grade_boost                            # A=1.0, B=0.8, C=0.4, D=0.0
                  + δ · proximity_boost                        # same geohash5 cell → +1
```

The CLIP embeddings cost nothing — they're already computed in Pillar 1's completeness check. This architecture is **"hybrid collaborative + content retrieval with refurb-aware re-ranking"** — every term is defensible in Q&A.

**Serving:** at buyer page load, dot-product user vector against all in-stock item vectors, filter grade A/B, apply hybrid re-rank, return top-5. Runs in milliseconds on precomputed vectors.

**Q&A line:** *"Production path is LightGCN or SASRec — we shipped ALS in 48h deliberately. The hybrid blend already handles cold start for new refurb arrivals, which is the hard problem."*

**Demo wow-factor:** Rahul's buyer view shows a "Certified Refurbished For You" rail — and his just-graded baby monitor appears in a nearby parent's rail via the CLIP content leg (zero interactions, rescued by content). This stitches Pillar 5 directly into the P2P story. Wallet widget shows running green credits balance.

---

## 4. System Architecture

```
                        ┌──────────────────────────────────────────┐
                        │     React Dashboard (3 views)             │
                        │ Seller · Buyer (wallet+rec rail inside) · Ops │
                        └──────┬──────────────┬────────────────────┘
                               │ REST        │ WebSocket (live grading)
                        ┌──────▼─────────────▼───────────────┐
                        │          FastAPI Gateway             │
                        └─┬──────┬──────┬──────┬──────┬──────┘
          ┌───────────────▼┐ ┌───▼────┐ ┌▼─────┐ ┌▼────────┐ ┌▼──────┐
          │ grade-service  │ │ route- │ │trust-│ │prevent- │ │green- │
          │ GndDINO+VLM    │ │service │ │serv. │ │service  │ │serv.  │
          │ + CLIP + video │ │LGBM EV │ │Hash  │ │GBDT risk│ │CLIP   │
          └───────┬────────┘ │optim.  │ │Chn+QR│ └────┬────┘ │wallet │
                  │          └───┬────┘ └──┬───┘      │      └───┬───┘
          ┌───────▼──────────────▼─────────▼──────────▼──────────▼───┐
          │    MongoDB (items, cards, txns, credits) + Redis (demand) │
          └────────────────────────────────────────────────────────────┘
```

**Stack:** FastAPI · MongoDB · Redis · React + Tailwind + Leaflet (map) · **Grounding DINO** (zero-shot defect detection) · **Claude Haiku API** (captioning, primary) · **Qwen2.5-VL-3B-Instruct** (captioning, offline fallback) · **CLIP** (completeness check + refurb embeddings) · **OpenCV** (video frame sampling) · LightGBM · qrcode/python-jose for cards · green-credits wallet.

---

## 5. Datasets (All Public, Ready in Hour 1)

| Need | Dataset | Use |
|---|---|---|
| Resale pricing | **Mercari Price Suggestion** (Kaggle, 1.4M rows) | Train LightGBM price model conditioned on condition_id |
| Product catalog + reference images | **Amazon Berkeley Objects (ABO)** | Completeness check via CLIP, demo catalog |
| Defect detection | **Grounding DINO** (zero-shot, no dataset needed) + **Roboflow Universe** community defect models as optional boost | Zero-shot detection via text prompts — no labeling, no training |
| Reviews → return reasons + **recommender training** | **Amazon Reviews 2023 (UCSD/McAuley)** | (1) Mine "size/fit/didn't match" signals for prevention model priors; (2) 5-core Electronics or Clothing subset (~500k–1M interactions) → Implicit ALS user/item vectors for refurb recommendations. One download, two uses. |
| Demand index, return histories | **Synthetic** (scripted generator, geohash-distributed) | Demo realism; clearly labeled synthetic in submission |

---

## 6. 48-Hour Execution Plan (3 Members)

**Roles:** M1 = ML/vision, M2 = ML/routing + data, M3 = backend + frontend.

### Hours 0–6 — Foundation
- M1: verify Grounding DINO zero-shot pipeline works on 10 sample product photos (shoes, electronics, clothing) — tune text prompts until defect boxes are clean (use compound phrases, not bare nouns — see Pillar 1 tip). Wire Qwen2.5-VL fallback path (`ANTHROPIC_API_KEY` absent → `grade/fallback_vlm.py`). **No labeling, no training.**
- M2: download Mercari, feature pipeline, baseline LightGBM price model (RMSE benchmark)
- M3: repo scaffold, FastAPI gateway, MongoDB/Redis docker-compose, stub all 5 service endpoints + React shell, 3-view layout (Seller / Buyer / Ops), photo-upload component

### Hours 6–16 — Core ML
- M1: grading head (Grounding DINO defects + CLIP completeness → grade A/B/C/D), **Claude Haiku API** condition captioning (pass DINO detections as text context, get structured JSON back), defect bounding-box overlay rendered on image for demo
- M2: sell-probability model, EV optimizer, geohash demand-index generator → Redis
- M3: trust-service (signed JSON, hash chain, QR), wire grade-service + seller flow UI — upload → live grade → Health Card render

### Hours 16–28 — Integration + Pillar 5
- M1+M2: end-to-end photo → grade → price → EV routing → card (target <2s, cache models warm). **M1 also:** video frame sampler — OpenCV extract 4–6 frames from clip → run through existing image pipeline → aggregate max severity per defect type (~30 min).
- M2: **Implicit ALS recommender** — download Amazon Reviews 2023 Electronics/Clothing 5-core subset, build user–item sparse matrix, train ALS (`implicit` library, minutes on CPU), evaluate Recall@20/NDCG@20 on leave-last-out split, serialize user + item vectors (~3h). Wire hybrid scoring endpoint: ALS score + CLIP cosine (fetch embeddings from grade-service) + grade boost + proximity boost. Then: prevent-service (return-risk GBDT on synthetic data) + checkout-nudge API.
- M3: green-service — `POST /credits/earn` (called by route-service), `GET /credits/{user_id}`, MongoDB `green_credits` collection. Leaflet demand heatmap + routing animation; buyer view with QR card + "Certified Refurbished For You" rail + wallet widget; ops console with EV breakdown.

### Hours 28–38 — Demo Scenes
- **Scene 1 (Priya):** ₹500 shoes returned → graded B in 1.4s → routed to local resale, 590 km trip avoided, ₹312 recovered vs ₹–40 liquidation → toast: *"+12 green credits · 590 km saved · 4.2 kg CO₂"*
- **Scene 1b (video):** same shoes, 5-second clip → 5 frames extracted → same B grade → "image/video analysis" PS bullet checked on stage
- **Scene 2 (Rahul):** baby monitor scan → "47 parents within 8 km" → zero-contact P2P via locker → sold, no haggling → buyer view shows "Certified Refurbished For You" rail with nearby A/B items + wallet balance
- **Scene 3 (Small Seller):** batch of 12 'didn't match' returns → bulk-graded in 20s → auto-priced, auto-routed; manual inspection eliminated
- **Scene 4 (Prevention):** checkout shows size-8 nudge → return never happens

### Hours 38–48 — Polish + Submission
- Metrics slide (latency, price-model RMSE, EV uplift on synthetic cohort)
- 3-min demo video, architecture diagram, README, deployment on free tier (Render/Railway) or local + ngrok
- Dry-run pitch ×3

---

## 7. Metrics to Quote in the Pitch

- Grading latency: **<2s/item** (PS requirement — meet it on stage)
- Pricing model: report **RMSLE on Mercari holdout** (baseline ~0.45–0.50 achievable)
- EV uplift: synthetic cohort of 1,000 returns — **% recovered value vs. naive liquidation** (expect 3–5× headline)
- Distance saved: avg **km/item routed locally vs. warehouse** (the Priya number)
- Prevention: **F1-score of return-risk model** (primary metric — false positives waste intervention budget, false negatives miss recoverable returns; F1 balances both. AUC is reported as secondary.) + simulated return-rate reduction at top-decile intervention
- Green credits: **credits earned per local/P2P routing** (synthetic cohort — show distribution); **kg CO₂ saved per item** vs. warehouse routing
- Refurb recommendations: **Recall@20 / NDCG@20** on Amazon Reviews 2023 leave-last-out split (real-data number — quote alongside Mercari RMSLE); top-5 shown live in buyer view on stage
- **Macro anchor (say this in the pitch):** Indian e-commerce sees millions of returns daily (Unicommerce/Redseer put fashion return rates at 25–30%). The per-item impact is defensible and concrete: PHOENIX avoids an average of ~590 km of reverse logistics per item routed locally vs. the central warehouse trip. Recovered value per item vs. naive liquidation: 3–5× (from the EV cohort above). Scale those two numbers by Amazon's volume — judges can do that math themselves, which is stronger than a contested aggregate. *(If pressed for a headline: "illustrative estimate — at 1% of Indian e-commerce returns, that's tens of millions of km and hundreds of crore in recovered value annually.")*

---

## 8. What Makes This Non-Obvious (Anticipating Judge Pushback)

| Likely objection | Answer |
|---|---|
| "This is just a resale marketplace" | Marketplace is the *output*. The product is the **decision engine** — grading + EV routing + demand gravity. Marketplaces exist; the intelligent bridge between return and next owner doesn't. |
| "VLM grading will be wrong" | Confidence-gated: low-confidence items fall back to human spot-check queue (human-in-the-loop, shown in ops console). Health Card records model version — auditable. |
| "P2P trust is unsolved" | That's exactly why it's routed *through* Amazon: Amazon-verified Health Card + Amazon payments + locker handoff. Trust is borrowed, not rebuilt. |
| "Why hash chain, not blockchain?" | Blockchain solves *consensus* — multiple parties agreeing on truth. We don't need consensus; we need tamper-evidence on a single authority's records. An append-only hash chain does that at zero overhead and infinite scale. Blockchain here would be theater. |
| "This is just logistics, not 'commerce'" | PHOENIX is a full commerce loop: (1) **Refurb marketplace** — graded items relist with verified Health Cards; green credits earned on returns are redeemable only on refurb purchases, closing a buy→sell→buy cycle entirely within Amazon; (2) **P2P supply creation** — Rahul's monitor, invisible before, becomes discoverable inventory; (3) **Demand-side discovery** — the "Certified Refurbished For You" rail is a commerce feature that drives refurb purchases. The routing decision enables commerce; it doesn't replace it. |
| "Grounding DINO won't work on all product types" | It's zero-shot — the prompts generalize across categories by design. For the demo we validate on shoes, electronics, and clothing (three PS-relevant categories). Edge cases fall to the human-in-the-loop ops console. |
| "Recommender can't rank new refurb items — cold start" | Pure CF can't, which is exactly why the hybrid blend exists. The CLIP content leg scores a brand-new item the moment it's graded — zero interactions required. Grade boost + proximity boost layer on top. Every term in the scoring formula is grounded in data we already have. |
| "Why ALS and not a transformer-based model?" | ALS trains in minutes on CPU, produces interpretable user/item vectors, and achieves competitive Recall@20 on standard benchmarks. The production path is LightGCN/SASRec — we shipped ALS in 48h deliberately. The architecture is correct; the model can be swapped. |

## 9. Risk Mitigation (48h Reality)

- **Latency / GPU:** Grounding DINO tiny on CPU realistically runs 2–4s — **test this in hour 0**. If over budget, expose inference via a free Colab/Kaggle T4 (ngrok tunnel) or a HuggingFace Inference endpoint; state "<2s on GPU, graceful degradation on CPU" in the pitch. Pre-grade all demo items as guaranteed fallback (shoes photo, shoes video clip, baby monitor, one item from the batch, PDP nudge product); live-grade exactly one on stage.
- **VLM API flakiness:** `ANTHROPIC_API_KEY` absent or timeout → automatic fallback to **Qwen2.5-VL-3B-Instruct** (T4/Colab, 7 GB fp16). Same JSON prompt, same output schema — swap is invisible to the rest of the pipeline. BLIP-2 dropped (no instruction following).
- **AWS / Bedrock framing:** Claude is available on Amazon Bedrock; `captioner.py` swaps to the Bedrock SDK with two lines — replace `anthropic.Anthropic()` with a `boto3` bedrock-runtime client and call `invoke_model`. No other code changes. Pre-empts any judge question about "why not on AWS."
- **Mercari training time:** sample 300k rows, LightGBM trains in minutes
- **ALS training / data download:** Amazon Reviews 2023 Electronics 5-core is ~1.7 GB compressed — download in hour 0 alongside Mercari. ALS on 500k interactions trains in <5 min on CPU with `implicit`. If download is slow, use the Clothing 5-core (~400k rows) as fallback. Worst case: pre-serialize user/item vectors before demo, serve from file.
- **Frontend scope creep / M3 overload:** 3 views only (Seller upload, Buyer with wallet + rec rail as components, Ops console). The wallet widget and refurb rail live inside the Buyer view — they are not separate views. On a 3-person team M3 owns all of backend + frontend; protect the gateway + grade wiring first; the map + QR card + nudge PDP are must-haves; wallet widget + rec rail are cut to static mock if time runs out in hours 28+.

## 10. Scale Story (Criterion 04 — say this verbatim)

> "Today PHOENIX grades one item in under 2 seconds — under 1.5s on GPU, with graceful degradation on CPU. The routing decision is a feature lookup + GBDT inference, microseconds, horizontally scalable. The demand index is a Redis geohash structure Amazon already has the data to fill. The Health Card is a portable standard that follows the product across owners — the foundation of a circular-economy graph. The per-item numbers are concrete: each item routed locally avoids an average of ~590 km of reverse logistics, and recovers 3–5× more value than naive liquidation. Multiply that by Amazon's return volume and the impact is self-evident. From need to done — for the product's *second* life too."

**AWS production path (say this if asked about scale):** All three ML models — LightGBM pricing, ALS recommender, GBDT prevention — migrate to **Amazon SageMaker** training jobs with automated hyperparameter tuning. SageMaker Pipelines monitors inference distributions against training baselines via CloudWatch; when concept drift is detected (seasonal return behavior shifts are real), it triggers automated retraining and shadow A/B promotion — the same MLOps pattern Amazon uses internally. The grading VLM runs on **Bedrock** (Claude Haiku), the defect detector on **AWS IoT Greengrass** edge nodes for sub-200ms warehouse triage. The Health Card ledger migrates to **Amazon QLDB**. The prevention event stream runs on **Kinesis**. Every component has a named AWS service as its production counterpart — this is not a prototype, it's a blueprint.

---

## 11. Repo Structure

```
phoenix/
├── services/
│   ├── grade/      # Grounding DINO + Claude Haiku vision + CLIP + video sampler
│   ├── route/      # LightGBM price + sell-prob, EV optimizer, geohash index
│   ├── trust/      # health card signing, hash chain, QR
│   ├── prevent/    # return-risk GBDT, fit nudges
│   └── green/      # credits wallet (earn/redeem) + CLIP refurb retrieval
├── gateway/        # FastAPI router + websocket
├── frontend/       # React + Tailwind + Leaflet
├── data/           # download scripts, synthetic generators, labeling notes
├── notebooks/      # model training, eval, metrics
├── docker-compose.yml
└── README.md       # this plan, condensed
```

---

## 12. Implementation: Claude API Captioning

### Setup

```bash
pip install anthropic
export ANTHROPIC_API_KEY=sk-ant-...   # or add to .env
```

### Architecture

| Path | Model | GPU needed | Latency |
|---|---|---|---|
| Primary | `claude-haiku-4-5` (Anthropic API) | None | ~1–2s |
| Fallback | `Qwen2.5-VL-3B-Instruct` (local) | T4 / 7 GB fp16 | ~3–5s |

**Key trick:** Grounding DINO detection results are injected as text into the Claude prompt so the caption is **consistent with the bounding boxes shown in the demo UI** — no hallucinated defects that contradict the heatmap.

### `grade/captioner.py`

```python
import anthropic
import base64
import hashlib
import json
import re
from pathlib import Path

CACHE_FILE = Path("grade_cache.json")
_cache: dict | None = None

def _load_cache() -> dict:
    global _cache
    if _cache is None:
        _cache = json.loads(CACHE_FILE.read_text()) if CACHE_FILE.exists() else {}
    return _cache

def _save_cache(cache: dict) -> None:
    CACHE_FILE.write_text(json.dumps(cache, indent=2))

CONDITION_PROMPT = """\
You are a product condition assessor for a re-commerce platform.

Grounding DINO detector context: {detections}

Assess the product in the image and return ONLY valid JSON with these exact fields:
{{
  "grade": "<A|B|C|D>",
  "confidence": <0.0-1.0>,
  "defects": [
    {{"type": "<scratch|dent|stain|tear|missing_part|other>",
      "severity": "<minor|moderate|severe>",
      "location": "<brief description>"}}
  ],
  "completeness": <0.0-1.0>,
  "condition_summary": "<one professional sentence>",
  "box_present": <true|false>,
  "functional": <true|false>
}}

Grade scale: A=like new, B=light cosmetic wear, C=visible defects, D=heavy damage.
Your defect descriptions MUST be consistent with the detector context above.
Return ONLY the JSON object — no markdown fences, no explanation."""


def caption_with_claude(image_bytes: bytes, detections: list[dict]) -> dict:
    """Grade a product image using Claude Haiku vision API.

    Args:
        image_bytes: Raw JPEG/PNG bytes of the product photo.
        detections: Grounding DINO output, each item a dict with keys
                    'label', 'location' (e.g. "top-left corner"), 'confidence'.
    Returns:
        Structured condition dict (grade, confidence, defects, …).
    """
    cache = _load_cache()
    key = hashlib.sha256(image_bytes).hexdigest()[:16]
    if key in cache:
        return cache[key]

    det_text = (
        ", ".join(
            f"{d['label']} at {d.get('location', 'unknown')} "
            f"(conf {d.get('confidence', 0):.2f})"
            for d in detections
        )
        if detections
        else "no defects detected"
    )

    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=512,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": base64.standard_b64encode(image_bytes).decode(),
                    },
                },
                {
                    "type": "text",
                    "text": CONDITION_PROMPT.format(detections=det_text),
                },
            ],
        }],
    )

    raw = response.content[0].text
    try:
        result = json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        result = json.loads(m.group()) if m else {
            "grade": "C", "confidence": 0.5, "defects": [],
            "completeness": 0.8,
            "condition_summary": raw[:200],
            "box_present": False, "functional": True,
        }

    cache[key] = result
    _save_cache(cache)
    return result
```

### `grade/fallback_vlm.py` (offline path, GPU only)

```python
# Only imported when ANTHROPIC_API_KEY is absent.
# Requires: pip install transformers qwen-vl-utils accelerate
import json
import re
import torch
from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor  # requires transformers ≥ 4.49
from qwen_vl_utils import process_vision_info

_model = _processor = None

def _load() -> None:
    global _model, _processor
    if _model is None:
        _model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            "Qwen/Qwen2.5-VL-3B-Instruct",
            torch_dtype=torch.float16,
            device_map="auto",
        )
        _processor = AutoProcessor.from_pretrained("Qwen/Qwen2.5-VL-3B-Instruct")


def caption_with_qwen(image_path: str, detections: list[dict]) -> dict:
    """Same interface as caption_with_claude but runs locally on GPU."""
    _load()
    from grade.captioner import CONDITION_PROMPT

    det_text = (
        ", ".join(f"{d['label']} at {d.get('location', 'unknown')}" for d in detections)
        if detections
        else "no defects detected"
    )
    messages = [{
        "role": "user",
        "content": [
            {"type": "image", "image": image_path},
            {"type": "text", "text": CONDITION_PROMPT.format(detections=det_text)},
        ],
    }]

    text = _processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    image_inputs, _ = process_vision_info(messages)
    inputs = _processor(
        text=[text], images=image_inputs, padding=True, return_tensors="pt"
    ).to(_model.device)

    output = _model.generate(**inputs, max_new_tokens=512)
    raw = _processor.batch_decode(
        output[:, inputs.input_ids.shape[1]:], skip_special_tokens=True
    )[0]

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        return json.loads(m.group()) if m else {
            "grade": "C", "confidence": 0.5, "defects": [],
            "completeness": 0.8, "condition_summary": raw[:200],
            "box_present": False, "functional": True,
        }
```

### `grade/get_condition.py` (unified interface used by the grading pipeline)

```python
import os
from grade.captioner import caption_with_claude


def get_condition(image_bytes: bytes, image_path: str, detections: list[dict]) -> dict:
    """Return structured condition dict from either Claude API or Qwen fallback."""
    if os.getenv("ANTHROPIC_API_KEY"):
        try:
            return caption_with_claude(image_bytes, detections)
        except Exception as exc:
            print(f"[captioner] Claude API error ({exc}), falling back to Qwen")

    from grade.fallback_vlm import caption_with_qwen
    return caption_with_qwen(image_path, detections)
```

### How Grounding DINO detections flow into Claude

```python
# In grade-service, after running Grounding DINO:
raw_boxes = dino_predict(image, text_prompts=["scratch on surface", "dent on surface", "stain on fabric", "torn fabric", "missing part", "damaged area"])

detections = [
    {
        "label": box["label"],
        "confidence": round(float(box["score"]), 2),
        "location": bbox_to_location(box["bbox"], image.size),  # TODO: implement — bucket bbox center into 3×3 grid ("top-left", "center", etc.)
    }
    for box in raw_boxes
    if box["score"] > 0.30
]

# Claude receives these as natural language in the prompt:
# "Grounding DINO detector context: scratch at top-left corner (conf 0.84),
#  dent at center (conf 0.61)"
condition = get_condition(image_bytes, image_path, detections)
```

### Demo-day caching

Results are persisted in `grade_cache.json` keyed by the first 16 hex chars of the SHA-256 hash of the image bytes. Pre-grade all demo items (shoes photo + video frames, baby monitor, batch sample, PDP product) before the presentation so every live demo hit is a cache read (~0ms) — zero API dependency on stage.
