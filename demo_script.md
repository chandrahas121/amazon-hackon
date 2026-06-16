# 🎬 Project REVIVE — Demo Video Script
### Amazon HackOn · "Every product deserves a second life" · ~5 minutes

---

> **Format**: Narrated screencast. Speaker talks over live product demo.
> **Tone**: Conversational but sharp. Think "smart friend explaining, not reading a pitch deck."
> **Pacing guide**: Each section has a target duration. Total ≈ 5:00.

---

## 🔖 SECTION 0 — Cold Open + Problem (0:00 – 0:40)
**⏱ 40 seconds** · *Screen: Browser showing the REVIVE homepage (already logged in)*

### 🎙 NARRATION

> Before I start the demo, you'll notice our UI is built to look exactly like Amazon. That's intentional — we're not building a separate app. **REVIVE is designed to plug directly into the Amazon ecosystem** — it works with existing Amazon infrastructure, Amazon Pay, Amazon Flex agents, Amazon's fulfillment network. We cloned the UI to show exactly how this would feel for a real Amazon customer.

> Now, here's the problem we're solving.

> **Returns in e-commerce are broken.** The U.S. alone saw $850 billion in returns last year. Online return rates hit 19% — double the rate of physical stores. 63% of shoppers bracket orders — buying multiple sizes just to return what doesn't fit. And here's the worst part — for everyday items under ₹2,000, the cost of shipping them 600 km back to a warehouse **exceeds the product's value**. So they get liquidated or landfilled.

> **REVIVE is an AI decision engine that gives every returned or unused product a second life — locally, instantly, and profitably.** It grades condition in under 2 seconds, decides the best second life, and keeps items inside the city instead of shipping them back. Let me show you how.

### 📋 SCREEN ACTIONS
- Show the homepage with the Revive storefront loaded
- Briefly hover over the "Shop Revive" and "Amazon Renewed" tabs to show the unified catalog

---

## 🔖 SECTION 1 — Shopping Experience: VTON + FitTwin + Review Intelligence (0:40 – 1:50)
**⏱ 70 seconds** · *Screen: Browse → Product Detail → VTON → FitTwin → AI Review Summary*

### 🎙 NARRATION

> Let me start from the buyer's side. I'm shopping for clothes — let's say I'm looking at this kurta.

*Click on an apparel product*

> On the product page, notice two things that reduce return friction **before** the purchase happens.

> First — **Virtual Try-On**. I upload my photo, and the AI shows me exactly how this garment looks on my body. No guesswork about "will this colour suit me?" or "how does this drape?"

*Click "Virtual Try-On", show the try-on result*

> Second — **FitTwin**. This is our measurement-free size engine. It doesn't ask for height or weight. Instead, we built an index from the real **Rent the Runway dataset** — 190,000 real fit outcomes. For each shopper, we track the **median size they bought and kept across categories** — that's their size fingerprint. FitTwin finds shoppers whose sizing pattern matches yours — your **behavioral twins** — and tells you what size *they* found fit best for this exact item. No surveys, no body data — just real purchase behavior.

*Scroll to the FitTwin "How this fits" card — show the recommended size badge, direction pill*

> Now scroll down. See this **"What buyers say"** card? This isn't just star ratings. We mine the actual text of Amazon's customer reviews — over 60,000 real reviews from the Amazon Reviews 2023 dataset — and extract **pros, cons, fit verdicts, and return reasons** using a multi-agent AI pipeline. The fit signal from reviews is cross-referenced with FitTwin so the shopper sees a consistent message everywhere. That's information that **prevents the return from ever happening.**

*Show the "What buyers say" card with pros/cons/fit verdict*

> The philosophy here is simple — **the cheapest return to handle is the one that never happens.** Virtual Try-On removes colour/style doubt. FitTwin removes sizing doubt using real shopper behavior. Review intelligence removes expectation gaps. Together, they attack the three biggest reasons for apparel returns — *before* the purchase.

### 📋 SCREEN ACTIONS
1. Navigate to an apparel product from the homepage
2. Click "Virtual Try-On" → show the generated result
3. Point out the FitTwin recommendation / fit signal badge
4. Scroll to "What buyers say" card — highlight pros, cons, fit verdict, return reasons

---

## 🔖 SECTION 2 — Bracketeering Detection (1:50 – 2:20)
**⏱ 30 seconds** · *Screen: Add multiple sizes → Checkout → Nudge*

### 🎙 NARRATION

> Now watch what happens when a shopper does what 63% of online buyers do — **bracket**. I'm going to add this same item in size M… and also size L.

*Add two sizes of the same product to cart*

> I head to checkout, and immediately — the system catches it. See this banner?

*Navigate to checkout, show the ReturnNudge banner*

> Our return-prevention model detects bracketeering at checkout — multiple sizes of the same item in cart — and surfaces a nudge: *"We noticed you added multiple sizes. Check FitTwin to find your best fit before ordering."* We're not blocking the sale. We're **gently steering the shopper back to make a confident single-size purchase**, which reduces the guaranteed return of the extra size.

> This is powered by a gradient-boosted model that reads cart signals in real time. A small intervention here saves the entire reverse-logistics cost of a return downstream.

### 📋 SCREEN ACTIONS
1. Go back, add the same product in two different sizes (M, L) 
2. Navigate to checkout
3. Point to the bracket detection nudge / ReturnNudge banner
4. Click the link back to the product page briefly, then go back to checkout

---

## 🔖 SECTION 3 — Place Order + Return Flow (2:20 – 2:50)
**⏱ 30 seconds** · *Screen: Place order → Orders page → Return an electronics item*

### 🎙 NARRATION

> Let me place this order. Done. Now let me show you the return side.

*Place order, briefly show success*

> Let's say a user bought an iQOO Neo 7 Pro and wants to return it. They go to My Orders, click Return.

*Navigate to Orders → click Return on the iQOO*

> Our Return Wizard walks them through the process. They select a reason, upload photos, and the AI grades the item. But here's the key — this phone is high-value electronics, above ₹10,000. So our **Risk Tier system** — which runs entirely in the backend, the customer never sees "Tier 3" — automatically schedules a **Flex agent pickup for professional SPN inspection**. Battery cycle count, IMEI blacklist check, certified data wipe — the full diagnostic.

### 📋 SCREEN ACTIONS
1. Place the order (quick)
2. Navigate to "My Orders"
3. Click Return on the iQOO Neo 7 Pro
4. Walk through the Return Wizard steps
5. Show the "Agent pickup scheduled" confirmation with the 90-day guarantee badge

---

## 🔖 SECTION 4 — Sell Unused Item: Nike Shoes + AI Grading (2:50 – 3:50)
**⏱ 60 seconds** · *Screen: Sell It page → Upload photos → AI Grade → Publish listing*

### 🎙 NARRATION

> Now the other entry point — selling unused items. Let's say I have a pair of Nike shoes sitting in my closet. I go to Sell It.

*Navigate to the Sell It page*

> I type "Nike Downshifter 13" and select Footwear. In production, Amazon's Catalog API would auto-fill the MRP and model — it's not publicly available, so we've wired the architecture for it. The MRP matters because it sets the **Risk Tier** behind the scenes — guarantee depth, verification level.

> I enter the original price. Notice the guarantee badge updates — this is the buyer protection tier computed in real time.

*Enter MRP, show tier badge change*

> Now photos. The system knows this is **Footwear**, so it asks for category-specific angles — **front, side, sole, insole, box**. A phone would get asked for "screen powered on" and "ports." An apparel item would get "fabric close-up" and "tag." This is our **Category Profile** system — product type drives capture, not price.

*Upload photos into the correct slots*

> I hit **"Grade my item"** and watch. The AI pipeline runs in under 2 seconds. Here's what happens behind the scenes: **Grounding DINO** zero-shot detects defects — scratches, scuffs, sole wear. A **Vision LLM** describes the condition in natural language. **CLIP** checks completeness — are the laces there? Is the box present? A **fusion head** blends these three weak signals into one reliable grade — **Grade B, Very Good, 90% confidence** — with a defect map showing exactly where the wear is.

*Show the grade result card with defect map*

> It also suggests a resale price using a trained model anchored to the catalog MRP, with per-defect deductions — a cracked sole deducts a fixed amount, not just a letter grade. The seller can adjust ±20%.

> I publish the listing. Now — these shoes are low-value, under ₹2,000, so the system does NOT pick them up immediately. They stay at the seller's home and move **only when a buyer exists nearby** — "list before you move." Otherwise warehouses fill with unsold junk. Contrast that with the iQOO phone earlier — high-value items ARE picked up by Flex agents, refurbished by Amazon SPN partners, and resold as **Renewed** with a 90-day guarantee. Different value, different route.

> Every item ships with a **Product Health Card** — SHA-256 signed, tamper-evident, scannable QR. The buyer trusts math, not the seller.

### 📋 SCREEN ACTIONS
1. Navigate to Sell It
2. Type "Nike Downshifter 13", select Footwear, enter MRP
3. Show the tier/guarantee badge updating
4. Upload photos into category-specific slots (front, side, sole, insole)
5. Click "Grade my item" → show the AI grade card (Grade B, defects, condition notes, defect map)
6. Show the suggested price and ±20% band
7. Submit the listing → show success + Health Card generation

---

## 🔖 SECTION 5 — Revive Store + Green Credits (3:50 – 4:10)
**⏱ 20 seconds** · *Screen: Browse Revive tab → Green Credits page*

### 🎙 NARRATION

> Now let me show where these items end up. Click "Shop Revive" — this is the second-life storefront. Every item here has an AI grade badge and a Health Card. Buyers can see the condition, the defect report, and the guarantee before buying. It's a unified catalog — New, Open Box, Used, and Renewed items appear as **buying options** on the same product page, just like Amazon does today.

*Browse Revive products, click one to show the Health Card*

> And here's the flywheel — **Green Credits**. When a buyer keeps an order past the 7-day return window, they earn credits. Those credits are redeemable **only in the Revive store**. So we're rewarding customers for not returning, and channelling that reward into the second-life marketplace. It's a self-reinforcing loop — **less returns feed more Revive inventory, and credits drive more Revive purchases.**

*Show the Green Credits section at checkout or on the credits page*

### 📋 SCREEN ACTIONS
1. Click "Shop Revive" tab on homepage
2. Browse products, click one to show grade badge + Health Card
3. Show Green Credits widget (checkout sidebar or dedicated page)

---

## 🔖 SECTION 6 — Architecture Deep Dive with Flow Diagrams (4:10 – 5:00)
**⏱ 50 seconds** · *Screen: Switch to the flow diagrams (workflow + routing detail)*

### 🎙 NARRATION

> Let me show you the engine behind all of this.

*Switch to the REVIVE Workflow diagram*

> This is the end-to-end flow. An item enters from two paths — **Return Wizard** or **Sell It**. First stop: **Catalog Match** — we identify the exact product and pull the real MRP. This splits into two independent axes. **Category Profile** — customer-facing — decides *what to capture and how to grade*. A shoe gets sole prompts, a phone gets "screen powered on." **Risk Tier** — backend-only — decides *how hard to verify and what guarantee to issue.*

> Photos go through three integrity checks — **VLM category gate**, **DINOv2 instance gate** to catch lookalike fraud, and **pHash duplicate detection**. Then **AI grading in under 2 seconds** — cosmetic grade A through F, plus functional status.

> Next: the **Disposition Gate**. This is critical — not every return becomes "used." A sealed return goes back as **New** at full price. An opened-but-unused item becomes **Open Box**. Used items with grade B–D go to **Revive**. Grade D–E electronics go to **SPN Renewed**. Grade F gets recycled or donated. This mirrors exactly how Amazon FBA already handles returns — we're just automating the decision.

*Switch to the Routing Detail diagram*

> Finally — **Two-Stage Smart Routing.** Stage 1 is a **Demand Gate** that runs continuously. We encode every location into a geohash cell and compute a demand-gravity score: `demand / (1 + dist²/25)`. This is a physics gravity model — nearby demand pulls strongly, far demand fades. It's a Redis hash lookup, so it's **constant-time**, not a database scan.

> When a buyer exists, Stage 2 fires — **once**. The **EV optimizer** compares a small fixed set of routes — direct peer-to-peer under 5 km, kirana relay 5–25 km, central SPN node — and picks the one with the best expected value. If no route beats the donation benefit, it donates. The item stays local — **64% cheaper, 4× faster, 590 km and 4.2 kg CO₂ saved per locally routed item.**

> **That's REVIVE. Not a marketplace — a decision engine. Every product deserves a second life, and we decide which one in under two seconds.**

### 📋 SCREEN ACTIONS
1. Open the workflow diagram (`image/revive_v2_workflow.png`) — walk through top-to-bottom
2. Point to each block as you narrate: Catalog Match → Category Profile / Risk Tier → Image Integrity → AI Grading → Disposition Gate → 5 outcomes → Unified Storefront
3. Switch to the routing detail diagram (`image/revive_v2_routing_detail.png`)
4. Walk through Stage 1 (Demand Gate) → Stage 2 (EV Routing) → Route outcomes
5. End with a confident closing statement

---

## ⏱ TIMING SUMMARY

| Section | Content | Duration | Cumulative |
|---------|---------|----------|------------|
| 0 | Cold open + Problem statement | 0:40 | 0:40 |
| 1 | Shopping: VTON + FitTwin + Review Intelligence | 1:10 | 1:50 |
| 2 | Bracketeering detection at checkout | 0:30 | 2:20 |
| 3 | Place order + Return flow (iQOO) | 0:30 | 2:50 |
| 4 | Sell unused item: Nike shoes + AI grading deep dive | 1:00 | 3:50 |
| 5 | Revive store + Green Credits flywheel | 0:20 | 4:10 |
| 6 | Architecture walkthrough with flow diagrams | 0:50 | 5:00 |

---

## 🎯 KEY THEMES TO WEAVE THROUGHOUT

Hit these points **naturally** as you demo, not as a separate list:

| Theme | Where it lands |
|-------|---------------|
| **Customer-centric, bottom-up** | Sections 1–3: "We started from why customers return — wrong size, wrong colour, wrong expectations — and attacked each one at the point of purchase" |
| **Fits Amazon's business model** | Section 0 + 4: "We use Amazon Flex for pickup, Amazon Pay for escrow, Amazon's catalog API for MRP, the same Grade-and-Resell disposition logic Amazon FBA already uses" |
| **Profitability** | Section 6: "Every locally routed item is 64% cheaper than a warehouse round-trip. Recovery on items that were previously written off. Four revenue streams — recovered value, commission, reduced return rate, Green Credits driving Revive purchases" |
| **Real-world scalability** | Section 6: "Geohash + Redis = constant-time demand lookup. Gravity model scales to millions of items. The heavy routing decision fires once per item, not continuously" |
| **Algorithmic depth** | Section 4 + 6: Three-model fusion for grading, physics gravity model, two-stage EV routing, gradient-boosted return prediction |
| **Trust engineering** | Section 4 + 5: "Health Card with SHA-256 hash — the buyer trusts math, not the seller" |

---

## 📌 PRE-DEMO CHECKLIST

- [ ] Logged in as demo user (buyer account with orders + seller permissions)
- [ ] Backend running (`uv run python manage.py runserver`)
- [ ] Frontend running (`npm run dev`)
- [ ] Database seeded with products, reviews, and demo orders
- [ ] At least one apparel product and one electronics product (iQOO Neo 7 Pro) in the catalog
- [ ] Nike shoe photos ready for upload during the Sell It section
- [ ] Flow diagram images ready to share-screen (`image/revive_v2_workflow.png` and `image/revive_v2_routing_detail.png`)
- [ ] Screen recording software running
- [ ] Browser zoom at 100%, clean tabs
