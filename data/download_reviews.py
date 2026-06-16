"""
data/download_reviews.py
------------------------
Pull REAL customer reviews from the **Amazon Reviews 2023 (UCSD/McAuley)** dataset
so the product pages can show authentic Amazon-style reviews that genuinely match
the product.

Why two streams (meta + reviews):
    Filtering review *text* alone can't tell a real shoe from a "shoe horn" or
    "boot dryer" — they all mention "shoe". So we GROUND each product's identity in
    the dataset's **product title** (the meta file), then attach that exact ASIN's
    real reviews:
      1. stream meta_<category>.jsonl.gz → keep ASINs whose TITLE is genuinely the
         product type (a shoe / a men's shirt / a phone / a laptop) and NOT an
         accessory or a women's/niche item;
      2. stream the review file → collect reviews for those exact ASINs, grouped by
         ASIN, until enough products each have >= min reviews.
    Both files are multi-GB; we stream + early-stop, pulling a slice not the whole.

Output (two JSONL per storefront bucket; consumed by `manage.py seed_demo`):
    data/reviews_{phone,laptop,monitor,footwear,apparel}.jsonl
        Each line: {rating,title,text,author_id,asin,ptitle,verified,helpful,timestamp}
        (`ptitle` = the real product title the review belongs to.)
    data/catalog_{phone,laptop,monitor,footwear,apparel}.jsonl
        Each line: {asin,title,brand,price_inr,image,avg_rating,rating_number,description}
        — one product record per qualifying ASIN, so the catalog (real image + price +
        title) and the reviews are keyed by the SAME ASIN set (exact 1:1 join in seed_demo).

Usage:
    python data/download_reviews.py                       # all buckets (stream + early-stop)
    python data/download_reviews.py --bucket footwear
    python data/download_reviews.py --asins 55 --min-per-asin 6
    python data/download_reviews.py --local /path/to/dir  # read meta_*.jsonl.gz / *.jsonl.gz
                                                          #   from disk instead of streaming
"""
from __future__ import annotations
import argparse
import gzip
import json
import logging
import re
import urllib.request
from decimal import Decimal
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_DIR = Path(__file__).parent
_BASE = "https://mcauleylab.ucsd.edu/public_datasets/data/amazon_2023/raw/"
_REVIEW_BASE = _BASE + "review_categories/"
_META_BASE = _BASE + "meta_categories/"

# USD→INR conversion for the dataset's USD prices (matches import_amazon_data.py default).
USD_TO_INR = 83.0
# Per-bucket sanity bounds on the converted INR price — skip out-of-band products so the
# catalog never shows an absurd ₹2 phone or a ₹9-lakh t-shirt.
INR_BOUNDS = {
    "phone":    (5_000, 150_000),
    "laptop":   (20_000, 300_000),
    "monitor":  (8_000, 80_000),
    "footwear": (1_000, 20_000),
    "apparel":  (300, 8_000),
}

# storefront bucket → review file, meta file, and TITLE rules used to keep only
# real products of the right type.
#   need  — the product title must contain at least one (whole word)
#   avoid — if the title contains any (whole word) it's an accessory / wrong item
BUCKETS = {
    "phone": {
        "review": "Cell_Phones_and_Accessories.jsonl.gz",
        "meta": "Cell_Phones_and_Accessories.jsonl.gz",
        "need": ("smartphone", "unlocked phone", "cell phone", "iphone", "galaxy",
                 "pixel", "oneplus", "moto g", "5g phone"),
        "avoid": ("case", "cover", "protector", "tempered", "cable", "charger", "holder",
                  "mount", "stylus", "adapter", "earphone", "earbud", "headphone", "lens",
                  "strap", "stand", "grip", "wallet", "skin", "sticker", "glass", "ring",
                  "battery", "charm", "popsocket", "kickstand", "armband", "lanyard",
                  "band", "gear", "watch", "replacement", "tripod", "selfie", "gimbal",
                  "dock", "speaker", "tablet", "screen", "kit", "tool", "repair"),
    },
    "laptop": {
        "review": "Electronics.jsonl.gz",
        "meta": "Electronics.jsonl.gz",
        "need": ("laptop", "notebook", "macbook", "ultrabook", "chromebook"),
        "avoid": ("bag", "sleeve", "case", "charger", "adapter", "stand", "cooling",
                  "hub", "dock", "webcam", "headset", "ssd", "hard drive", "ram",
                  "memory", "mouse", "keyboard", "skin", "protector", "battery",
                  "replacement", "cable", "fan", "screen"),
    },
    "footwear": {
        "review": "Clothing_Shoes_and_Jewelry.jsonl.gz",
        "meta": "Clothing_Shoes_and_Jewelry.jsonl.gz",
        "need": ("shoe", "shoes", "sneaker", "sneakers", "boot", "boots", "loafer",
                 "loafers", "trainer", "trainers", "running shoe"),
        "avoid": ("horn", "tree", "trees", "polish", "oil", "conditioner", "lace",
                  "laces", "insole", "insoles", "sock", "socks", "cleaner", "brush",
                  "spray", "rack", "dryer", "goo", "stretcher", "protector", "deodorizer",
                  "cream", "wax", "bag", "keychain", "charm", "grabber", "holder", "mat",
                  "women", "womens", "girls", "kids", "toddler", "heel", "heels", "pump",
                  "stiletto", "sandal", "slipper"),
    },
    "monitor": {
        "review": "Electronics.jsonl.gz",
        "meta": "Electronics.jsonl.gz",
        "need": ("monitor", "display", "ultrasharp", "led monitor", "ips monitor"),
        "avoid": ("mount", "arm", "stand", "cable", "riser", "hub", "privacy", "filter",
                  "cleaner", "tv", "television", "soundbar", "mouse", "keyboard", "webcam",
                  "speaker", "dock", "adapter", "bracket", "vesa", "splitter", "switch",
                  "extender", "kvm", "wall", "sleeve", "skin", "protector"),
    },
    "apparel": {
        "review": "Clothing_Shoes_and_Jewelry.jsonl.gz",
        "meta": "Clothing_Shoes_and_Jewelry.jsonl.gz",
        "need": ("shirt", "t-shirt", "tshirt", "tee", "jeans", "trouser", "trousers",
                 "chino", "chinos", "polo", "hoodie", "jacket", "sweatshirt", "blazer",
                 "sweater", "henley"),
        "avoid": ("women", "womens", "girl", "girls", "ladies", "dress", "gown", "skirt",
                  "blouse", "bra", "panty", "panties", "pantyhose", "stockings", "lingerie",
                  "swimsuit", "bikini", "pajama", "pajamas", "robe", "costume", "belt",
                  "wallet", "watch", "sock", "socks", "tie", "scarf", "glove", "gloves",
                  "hat", "cap", "sunglasses", "necklace", "bracelet", "earring", "shoe",
                  "boot", "sneaker", "maternity", "nursing", "leggings", "tights"),
    },
}


def _clean(s: str) -> str:
    """Repair the curly-quote mojibake (U+FFFD), collapse the <br /> HTML, trim."""
    if not s:
        return ""
    return (s.replace("�", "'")
             .replace("<br />", " ").replace("<br>", " ")
             .replace("\n", " ").strip())


def _has(low: str, words) -> bool:
    """Whole-word match (optional plural) — 'pant' never matches 'pantyhose'."""
    return any(re.search(r"\b" + re.escape(w) + r"(?:s|es)?\b", low) for w in words)


def _title_ok(title: str, spec: dict) -> bool:
    t = (title or "").lower()
    if not t or len(t) < 6:
        return False
    if _has(t, spec["avoid"]):
        return False
    return _has(t, spec["need"])


# ── Real-metadata extractors (ported from import_amazon_data.py — kept here because
#    this script is standalone and must not import the Django app) ──────────────────
def _first_image(meta) -> str:
    """Best product image URL — prefer hi_res, then large, then thumb."""
    for im in (meta.get("images") or []):
        for key in ("hi_res", "large", "thumb"):
            if isinstance(im, dict) and im.get(key):
                return im[key]
    return ""


def _price_inr(meta) -> float | None:
    """Convert the dataset's USD price to INR; None if missing/unparseable."""
    p = meta.get("price")
    try:
        if p in (None, "", "None"):
            return None
        usd = float(str(p).replace("$", "").replace(",", ""))
        return round(usd * USD_TO_INR, 2)
    except (ValueError, TypeError):
        return None


def _desc(meta) -> str:
    d = meta.get("description") or []
    if isinstance(d, list):
        d = " ".join(x for x in d if isinstance(x, str))
    feats = meta.get("features") or []
    if isinstance(feats, list):
        feats = " ".join(x for x in feats if isinstance(x, str))
    return _clean(str(d) + " " + str(feats))[:2000]


def _meta_lines(bucket: str, spec: dict, local: Path | None):
    """Yield raw JSON lines from the meta file — streamed from the dataset host, or
    read from a local meta_*.jsonl.gz when --local is given."""
    if local is not None:
        path = local / ("meta_" + spec["meta"])
        logger.info(f"[{bucket}] meta (local): {path}")
        with gzip.open(path, "rb") as gz:
            yield from gz
        return
    url = _META_BASE + "meta_" + spec["meta"]
    logger.info(f"[{bucket}] meta: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (REVIVE seed)"})
    with urllib.request.urlopen(req, timeout=180) as resp:  # noqa: S310
        with gzip.GzipFile(fileobj=resp) as gz:
            yield from gz


def _review_lines(bucket: str, spec: dict, local: Path | None):
    """Yield raw JSON lines from the review file — streamed or read locally (--local)."""
    if local is not None:
        path = local / spec["review"]
        logger.info(f"[{bucket}] reviews (local): {path}")
        with gzip.open(path, "rb") as gz:
            yield from gz
        return
    url = _REVIEW_BASE + spec["review"]
    logger.info(f"[{bucket}] reviews: {url}")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (REVIVE seed)"})
    with urllib.request.urlopen(req, timeout=180) as resp:  # noqa: S310
        with gzip.GzipFile(fileobj=resp) as gz:
            yield from gz


def _collect_good_asins(bucket: str, spec: dict, want: int, scan_cap: int,
                        local: Path | None = None) -> dict:
    """Stream the meta file; keep {asin: record} for real products of this type.

    A record keeps the real title + image + INR price + brand + rating + description
    that the stream already reads — every kept ASIN MUST have a usable image and a
    price within the bucket's INR bounds, so the catalog never shows a placeholder."""
    lo, hi = INR_BOUNDS.get(bucket, (0, 10 ** 12))
    good: dict[str, dict] = {}
    scanned = 0
    for raw in _meta_lines(bucket, spec, local):
        if len(good) >= want or scanned >= scan_cap:
            break
        scanned += 1
        try:
            m = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        asin = m.get("parent_asin") or m.get("asin") or ""
        title = (m.get("title") or "").strip()
        if not asin or asin in good or not _title_ok(title, spec):
            continue
        image = _first_image(m)
        price = _price_inr(m)
        if not image or price is None or not (lo <= price <= hi):
            continue
        good[asin] = {
            "asin": asin,
            "title": _clean(title)[:200],
            "brand": _clean(m.get("store") or "")[:100],
            "price_inr": price,
            "image": image[:500],
            "avg_rating": float(m.get("average_rating") or 0.0),
            "rating_number": int(m.get("rating_number") or 0),
            "description": _desc(m),
        }
        if len(good) % 50 == 0:
            print(f"\r  [{bucket}] real products found {len(good)}/{want} "
                  f"(scanned {scanned})", end="", flush=True)
    print()
    logger.info(f"[{bucket}] {len(good)} real products from meta (scanned {scanned})")
    return good


def fetch_bucket(bucket: str, target_asins: int, min_per_asin: int,
                 max_per_asin: int = 20, meta_cap: int = 500_000,
                 scan_cap: int = 3_000_000, local: Path | None = None) -> Path:
    spec = BUCKETS[bucket]
    out_path = DATA_DIR / f"reviews_{bucket}.jsonl"
    catalog_path = DATA_DIR / f"catalog_{bucket}.jsonl"

    # 1) Real products of this type, by title (with real image + INR price kept).
    #    Collect a LARGE pool so the review join hits often — every kept review is
    #    from a title-verified product that also has a usable photo + price.
    good = _collect_good_asins(bucket, spec, want=60_000, scan_cap=meta_cap, local=local)
    if not good:
        logger.warning(f"[{bucket}] no real products found in meta — skipping")
        return out_path

    # 2) Their real reviews, grouped by ASIN.
    logger.info(f"[{bucket}] need {target_asins} products >= {min_per_asin} reviews")
    acc: dict[str, list] = {}
    qualifying: set[str] = set()
    scanned = kept = 0
    for raw in _review_lines(bucket, spec, local):
        if len(qualifying) >= target_asins or scanned >= scan_cap:
            break
        scanned += 1
        try:
            r = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        asin = r.get("parent_asin") or r.get("asin") or ""
        if asin not in good:
            continue
        text = r.get("text") or ""
        title = (r.get("title") or "").strip()
        if not title or r.get("rating") is None or not (40 <= len(text) <= 650):
            continue
        lst = acc.setdefault(asin, [])
        if len(lst) >= max_per_asin:
            continue
        lst.append({
            "rating": int(round(float(r.get("rating", 0)))),
            "title": _clean(title)[:140],
            "text": _clean(text)[:650],
            "author_id": r.get("user_id", ""),
            "asin": asin,
            "ptitle": good[asin]["title"],
            "verified": bool(r.get("verified_purchase", False)),
            "helpful": int(r.get("helpful_vote", 0) or 0),
            "timestamp": r.get("timestamp", 0),
        })
        kept += 1
        if len(lst) == min_per_asin:
            qualifying.add(asin)
            print(f"\r  [{bucket}] products ready {len(qualifying)}/{target_asins} "
                  f"(kept {kept}, scanned {scanned})", end="", flush=True)
    print()

    # 3) Write reviews + the matching catalog, keyed by the SAME qualifying ASINs so
    #    seed_demo can attach each real product its OWN reviews 1:1.
    written = 0
    with open(out_path, "w", encoding="utf-8") as out:
        for asin in qualifying:
            for rec in acc[asin]:
                out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                written += 1
    with open(catalog_path, "w", encoding="utf-8") as cat:
        for asin in qualifying:
            cat.write(json.dumps(good[asin], ensure_ascii=False) + "\n")
    logger.info(f"[{bucket}] ✅ {len(qualifying)} products · {written} reviews "
                f"→ {out_path.name} + {catalog_path.name} (scanned {scanned} review lines)")
    return out_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Download real Amazon reviews grounded on product titles")
    ap.add_argument("--bucket", choices=list(BUCKETS), help="only this bucket (default: all)")
    ap.add_argument("--asins", type=int, default=55, help="distinct products per bucket")
    ap.add_argument("--min-per-asin", type=int, default=6, help="min reviews per product")
    ap.add_argument("--scan-cap", type=int, default=3_000_000, help="max review lines to stream")
    ap.add_argument("--local", type=str, default=None,
                    help="read meta_*.jsonl.gz / *.jsonl.gz from this folder instead of streaming")
    args = ap.parse_args()

    local = Path(args.local).expanduser() if args.local else None
    if local is not None and not local.is_dir():
        ap.error(f"--local path is not a directory: {local}")

    for b in ([args.bucket] if args.bucket else list(BUCKETS)):
        fetch_bucket(b, args.asins, args.min_per_asin, scan_cap=args.scan_cap, local=local)
