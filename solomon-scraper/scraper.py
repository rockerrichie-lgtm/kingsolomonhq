"""
Solomon's IQ — Data Scraper
Pulls real brand signals from Google Trends, Reddit, and YouTube.
Computes KPI scores and writes them to Supabase kpi_snapshots.

Sources:
  - Awareness: Google Trends (search interest) + YouTube (video search volume)
  - Buzz:      Reddit (mention volume + sentiment)
  - Imagery:   Reddit (adjective/attribute extraction from mentions)
  - Usage:     Reddit (post-experience language: reviews, feedback)
  - Consideration: Google Trends (comparison/vs/review search intent)

Run: python scraper.py
"""

import os
import time
import json
import re
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv
from pytrends.request import TrendReq
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
REDDIT_CLIENT_ID = os.getenv("REDDIT_CLIENT_ID")
REDDIT_CLIENT_SECRET = os.getenv("REDDIT_CLIENT_SECRET")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Helpers ──────────────────────────────────────────────────────────────────

def score_to_zone(score: float, is_buzz: bool = False) -> str:
    """Map a 0-100 (or -100 to +100 for buzz) score to a zone name."""
    if is_buzz:
        # Normalise buzz to 0-100 for zone calculation
        score = (score + 100) / 2
    if score <= 20:   return "critical"
    if score <= 40:   return "emerging"
    if score <= 60:   return "contested"
    if score <= 80:   return "established"
    return "category_defining"

def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))

def safe_get(url: str, params: dict = None, timeout: int = 15) -> dict | None:
    """HTTP GET with error handling and browser-like user agent."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json, text/html,*/*",
        "Accept-Language": "en-US,en;q=0.9",
    }
    try:
        r = requests.get(url, params=params, headers=headers, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  [HTTP error] {url}: {e}")
        return None

# ─── Sentiment (simple lexicon — no heavy ML model needed at MVP) ──────────────

POSITIVE_WORDS = {
    "good","great","excellent","amazing","love","best","fantastic","wonderful",
    "happy","awesome","superb","brilliant","outstanding","perfect","recommend",
    "reliable","fast","fresh","delicious","quality","smooth","safe","trust",
    "affordable","value","consistent","favourite","favorite","enjoyed","impressed"
}
NEGATIVE_WORDS = {
    "bad","terrible","awful","hate","worst","horrible","disgusting","slow",
    "poor","disappointing","disappointed","problem","issue","broken","failed",
    "expensive","overpriced","avoid","never","never again","rude","fraud",
    "fake","dirty","cold","wrong","delayed","late","missing","complaint"
}

def simple_sentiment(text: str) -> float:
    """
    Returns a sentiment score between -1.0 (very negative) and +1.0 (very positive).
    Based on lexicon matching — no external model required at MVP.
    """
    words = re.findall(r'\b\w+\b', text.lower())
    pos = sum(1 for w in words if w in POSITIVE_WORDS)
    neg = sum(1 for w in words if w in NEGATIVE_WORDS)
    total = pos + neg
    if total == 0:
        return 0.0
    return (pos - neg) / total

def classify_confidence(n_signals: int, avg_sentiment_variance: float) -> str:
    """
    Classify confidence based on signal volume and variance.
    High: many signals, low variance
    Split: high variance (mixed signals)
    External: few signals
    Unexplained: no signals at all
    """
    if n_signals == 0:
        return "unexplained"
    if n_signals < 10:
        return "external"
    if avg_sentiment_variance > 0.5:
        return "split"
    return "high"

# ─── Google Trends ─────────────────────────────────────────────────────────────

def fetch_google_trends_awareness(brand: str, competitors: list[str], geo: str = "IN") -> dict:
    """
    Fetch Google Trends interest over time for brand vs competitors.
    Returns awareness score (0-100) and raw interest value.
    """
    print(f"  [Google Trends] Fetching awareness for: {brand}")
    for attempt in range(3):
        try:
            pytrends = TrendReq(hl="en-IN", tz=330, timeout=(15, 35),
                               requests_args={"headers": {
                                   "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
                               }})
            keywords = [brand] + competitors[:4]
            pytrends.build_payload(keywords, timeframe="now 7-d", geo=geo)
            data = pytrends.interest_over_time()
            
            if data.empty:
                print(f"  [Google Trends] No data returned for {brand}")
                return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}
            
            brand_col = brand if brand in data.columns else keywords[0]
            brand_values = data[brand_col].tolist()
            avg_interest = sum(brand_values) / len(brand_values) if brand_values else 0
            awareness_score = round(avg_interest)
            all_values = {kw: data[kw].mean() for kw in keywords if kw in data.columns}
            total = sum(all_values.values())
            share = (all_values.get(brand_col, 0) / total * 100) if total > 0 else 0
            
            print(f"  [Google Trends] {brand}: avg_interest={avg_interest:.1f}, share={share:.1f}%")
            return {
                "score": round(clamp((awareness_score * 0.6 + share * 0.4), 0, 100)),
                "source": "Google Trends",
                "confidence": "high" if avg_interest > 5 else "external",
                "raw": {"avg_interest": avg_interest, "share_of_search": share}
            }
        except Exception as e:
            if "429" in str(e) and attempt < 2:
                wait = (attempt + 1) * 15
                print(f"  [Google Trends] Rate limited, waiting {wait}s before retry...")
                time.sleep(wait)
            else:
                print(f"  [Google Trends] Error: {e}")
                return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}
    return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}

def fetch_google_trends_consideration(brand: str, geo: str = "IN") -> dict:
    """
    Proxy consideration from purchase-intent related search queries.
    """
    print(f"  [Google Trends] Fetching consideration for: {brand}")
    for attempt in range(3):
        try:
            pytrends = TrendReq(hl="en-IN", tz=330, timeout=(15, 35),
                               requests_args={"headers": {
                                   "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
                               }})
            intent_queries = [
                f"{brand} vs",
                f"{brand} review",
                f"{brand} price",
                f"{brand} offer"
            ][:4]
            pytrends.build_payload(intent_queries, timeframe="now 7-d", geo=geo)
            data = pytrends.interest_over_time()
            
            if data.empty:
                return {"score": 0, "source": "Google Trends — intent queries", "confidence": "unexplained", "raw": None}
            
            avg_scores = [data[q].mean() for q in intent_queries if q in data.columns]
            avg_consideration = sum(avg_scores) / len(avg_scores) if avg_scores else 0
            score = round(clamp(avg_consideration, 0, 100))
            print(f"  [Google Trends] Consideration for {brand}: {score}")
            return {
                "score": score,
                "source": "Google Trends — intent queries (vs/review/price/offer)",
                "confidence": "high" if avg_consideration > 5 else "external",
                "raw": {"avg_intent_interest": avg_consideration}
            }
        except Exception as e:
            if "429" in str(e) and attempt < 2:
                wait = (attempt + 1) * 15
                print(f"  [Google Trends] Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  [Google Trends] Consideration error: {e}")
                return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}
    return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}

# ─── Reddit ────────────────────────────────────────────────────────────────────

def fetch_reddit_mentions(brand: str, limit: int = 50) -> list[dict]:
    """
    Pull recent public Reddit posts mentioning the brand using Reddit's public JSON API.
    No authentication required for public search.
    """
    print(f"  [Reddit] Fetching mentions for: {brand}")
    url = "https://www.reddit.com/search.json"
    params = {
        "q": brand,
        "sort": "new",
        "t": "week",
        "limit": limit,
        "type": "link"
    }
    data = safe_get(url, params=params)
    if not data:
        return []
    
    posts = []
    try:
        children = data["data"]["children"]
        for child in children:
            post = child["data"]
            posts.append({
                "title": post.get("title", ""),
                "selftext": post.get("selftext", ""),
                "score": post.get("score", 0),
                "subreddit": post.get("subreddit", ""),
                "url": post.get("url", ""),
                "created_utc": post.get("created_utc", 0)
            })
        print(f"  [Reddit] Found {len(posts)} posts for {brand}")
    except Exception as e:
        print(f"  [Reddit] Parse error: {e}")
    
    return posts

def compute_buzz_from_reddit(posts: list[dict], brand: str) -> dict:
    """
    Compute Buzz score (-100 to +100) from Reddit posts.
    Formula: (positive_weight - negative_weight) / total * 100
    """
    if not posts:
        return {"score": 0, "source": "Reddit", "confidence": "unexplained", "raw": None}
    
    sentiments = []
    for post in posts:
        text = f"{post['title']} {post['selftext']}"
        s = simple_sentiment(text)
        # Weight by Reddit score (upvotes) — popular posts matter more
        weight = max(1, min(post["score"], 100))
        sentiments.append((s, weight))
    
    weighted_sum = sum(s * w for s, w in sentiments)
    total_weight = sum(w for _, w in sentiments)
    avg_sentiment = weighted_sum / total_weight if total_weight > 0 else 0
    
    # Convert -1 to +1 range into -100 to +100
    buzz_score = round(clamp(avg_sentiment * 100, -100, 100))
    
    # Compute variance for confidence
    avg_s = sum(s for s, _ in sentiments) / len(sentiments)
    variance = sum((s - avg_s) ** 2 for s, _ in sentiments) / len(sentiments)
    confidence = classify_confidence(len(posts), variance)
    
    print(f"  [Reddit] Buzz for {brand}: {buzz_score} ({confidence} confidence, {len(posts)} posts)")
    return {
        "score": buzz_score,
        "source": f"Reddit — {len(posts)} public posts",
        "confidence": confidence,
        "raw": {"post_count": len(posts), "avg_sentiment": avg_sentiment, "variance": variance}
    }

def compute_usage_from_reddit(posts: list[dict], brand: str) -> dict:
    """
    Proxy Usage from Reddit posts that contain post-experience language.
    Looks for: 'used', 'ordered', 'bought', 'tried', 'review', 'experience', etc.
    """
    USAGE_SIGNALS = {
        "used","ordered","bought","tried","experience","review","after using",
        "been using","recently tried","switched to","daily","regularly","weekly",
        "delivery","arrived","received","quality","packaging","value for money"
    }
    
    usage_posts = []
    for post in posts:
        text = f"{post['title']} {post['selftext']}".lower()
        if any(signal in text for signal in USAGE_SIGNALS):
            usage_posts.append(post)
    
    if not usage_posts:
        return {"score": 0, "source": "Reddit — post-experience signals", "confidence": "external", "raw": None}
    
    sentiments = [simple_sentiment(f"{p['title']} {p['selftext']}") for p in usage_posts]
    avg_s = sum(sentiments) / len(sentiments)
    
    # Usage score: positive experience signals → high score
    # Base: 40 (neutral), +/- 30 based on sentiment, +volume bonus
    volume_bonus = min(10, len(usage_posts) / 5)
    usage_score = round(clamp(40 + avg_s * 30 + volume_bonus, 0, 100))
    variance = sum((s - avg_s) ** 2 for s in sentiments) / len(sentiments)
    confidence = classify_confidence(len(usage_posts), variance)
    
    print(f"  [Reddit] Usage for {brand}: {usage_score} ({len(usage_posts)} experience posts)")
    return {
        "score": usage_score,
        "source": f"Reddit — {len(usage_posts)} post-experience mentions",
        "confidence": confidence,
        "raw": {"experience_post_count": len(usage_posts), "avg_sentiment": avg_s}
    }

def compute_imagery_from_reddit(posts: list[dict], brand: str) -> dict:
    """
    Proxy Imagery from Reddit — extract top adjectives/descriptors used alongside brand.
    Score based on ratio of positive to negative descriptive associations.
    """
    POSITIVE_IMAGERY = {
        "reliable","fresh","healthy","premium","innovative","trusted","popular",
        "convenient","affordable","modern","stylish","authentic","quality",
        "efficient","responsive","friendly","clean","fast","consistent"
    }
    NEGATIVE_IMAGERY = {
        "cheap","outdated","unreliable","expensive","slow","poor","boring",
        "generic","average","mediocre","inconsistent","problematic"
    }
    
    pos_count = 0
    neg_count = 0
    for post in posts:
        text = f"{post['title']} {post['selftext']}".lower()
        words = set(re.findall(r'\b\w+\b', text))
        pos_count += len(words & POSITIVE_IMAGERY)
        neg_count += len(words & NEGATIVE_IMAGERY)
    
    total = pos_count + neg_count
    if total == 0:
        return {"score": 40, "source": "Reddit — brand imagery signals", "confidence": "external", "raw": None}
    
    imagery_score = round(clamp((pos_count / total) * 80 + 10, 0, 100))
    confidence = classify_confidence(len(posts), 0.3)
    
    print(f"  [Reddit] Imagery for {brand}: {imagery_score} (pos:{pos_count}, neg:{neg_count})")
    return {
        "score": imagery_score,
        "source": f"Reddit — imagery signals from {len(posts)} posts",
        "confidence": confidence,
        "raw": {"positive_associations": pos_count, "negative_associations": neg_count}
    }

# ─── YouTube ───────────────────────────────────────────────────────────────────

def fetch_youtube_awareness(brand: str, api_key: str | None, geo: str = "IN") -> dict:
    """
    Use YouTube Data API v3 to count search results for the brand.
    Falls back to Google Trends YouTube data if no API key.
    """
    print(f"  [YouTube] Fetching awareness for: {brand}")
    
    if not api_key:
        # Fallback: use PyTrends YouTube search data
        try:
            pytrends = TrendReq(hl="en-IN", tz=330, timeout=(10, 25))
            pytrends.build_payload([brand], timeframe="now 7-d", geo=geo, gprop="youtube")
            data = pytrends.interest_over_time()
            if not data.empty and brand in data.columns:
                avg = data[brand].mean()
                print(f"  [YouTube] Trends (no API key): {brand} avg={avg:.1f}")
                return {
                    "score": round(clamp(avg * 0.5, 0, 50)),
                    "source": "YouTube — Google Trends search interest",
                    "confidence": "external" if avg < 10 else "high",
                    "raw": {"youtube_trends_avg": avg}
                }
        except Exception as e:
            print(f"  [YouTube] Trends fallback error: {e}")
        return {"score": 0, "source": "YouTube", "confidence": "unexplained", "raw": None}
    
    # Use YouTube Data API v3
    url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": brand,
        "type": "video",
        "regionCode": geo,
        "relevanceLanguage": "en",
        "maxResults": 25,
        "key": api_key
    }
    data = safe_get(url, params=params)
    if not data:
        return {"score": 0, "source": "YouTube", "confidence": "unexplained", "raw": None}
    
    result_count = data.get("pageInfo", {}).get("totalResults", 0)
    # Normalize: 1M+ results = 100, 0 = 0
    normalized = min(100, result_count / 10000)
    score = round(clamp(normalized, 0, 50))  # YouTube caps at 50 — rest comes from Trends
    
    print(f"  [YouTube] {brand}: {result_count} results → score {score}")
    return {
        "score": score,
        "source": f"YouTube Data API — {result_count} video results",
        "confidence": "high" if result_count > 100 else "external",
        "raw": {"youtube_result_count": result_count}
    }

# ─── Score computation ─────────────────────────────────────────────────────────

def compute_awareness(trends_data: dict, youtube_data: dict) -> dict:
    """
    Combine Google Trends + YouTube into a single Awareness score.
    Weighting: Google Trends 70%, YouTube 30%
    """
    score = round(trends_data["score"] * 0.7 + youtube_data["score"] * 0.3)
    sources = []
    if trends_data["score"] > 0:
        sources.append("Google Trends")
    if youtube_data["score"] > 0:
        sources.append("YouTube")
    
    confidence = "high" if trends_data["confidence"] == "high" else trends_data["confidence"]
    return {
        "score": round(clamp(score, 0, 100)),
        "source": " + ".join(sources) if sources else "Google Trends + YouTube",
        "confidence": confidence
    }

# ─── Write to Supabase ─────────────────────────────────────────────────────────

def write_snapshot(brand_id: str, competitor_id: str | None, kpi_name: str,
                   score: float, zone: str, confidence: str, source: str,
                   snapshot_type: str, checkpoint: str, movement: float | None,
                   raw_signals: dict | None):
    """
    Write a single KPI snapshot to Supabase.
    Upserts brand-level snapshots (replaces existing current row for same KPI).
    """
    row = {
        "brand_id": brand_id,
        "competitor_id": competitor_id,
        "kpi_name": kpi_name,
        "score": score,
        "zone": zone,
        "confidence_level": confidence,
        "source": source,
        "snapshot_type": snapshot_type,
        "checkpoint": checkpoint,
        "trigger_method": "auto",
        "movement": movement,
        "raw_signals": raw_signals
    }
    
    try:
        # For brand-level current snapshots, delete old row first then insert
        # (unique index doesn't allow upsert easily across NULLs in Postgres)
        if snapshot_type == "brand_level" and checkpoint == "current" and not competitor_id:
            supabase.table("kpi_snapshots")\
                .delete()\
                .eq("brand_id", brand_id)\
                .eq("kpi_name", kpi_name)\
                .eq("snapshot_type", "brand_level")\
                .eq("checkpoint", "current")\
                .is_("competitor_id", "null")\
                .execute()
        
        supabase.table("kpi_snapshots").insert(row).execute()
        print(f"  [Supabase] Wrote {kpi_name}: {score} ({zone}, {confidence})")
    except Exception as e:
        print(f"  [Supabase] Write error for {kpi_name}: {e}")

# ─── Fetch previous snapshot for movement calculation ──────────────────────────

def get_previous_score(brand_id: str, kpi_name: str, competitor_id: str | None = None) -> float | None:
    """Fetch the most recent previous score for movement calculation."""
    try:
        query = supabase.table("kpi_snapshots")\
            .select("score")\
            .eq("brand_id", brand_id)\
            .eq("kpi_name", kpi_name)\
            .eq("snapshot_type", "brand_level")\
            .eq("checkpoint", "current")\
            .order("created_at", desc=True)\
            .limit(1)
        
        if competitor_id:
            query = query.eq("competitor_id", competitor_id)
        else:
            query = query.is_("competitor_id", "null")
        
        result = query.execute()
        if result.data:
            return result.data[0]["score"]
    except:
        pass
    return None

# ─── Main scraper ──────────────────────────────────────────────────────────────

def run_scraper_for_brand(brand_id: str, brand_name: str, competitors: list[dict], geo: str = "IN"):
    """
    Run the full scraping pipeline for a brand and all its competitors.
    Writes brand-level current snapshots for all 5 KPIs.
    """
    print(f"\n{'='*60}")
    print(f"Scraping: {brand_name} | {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*60}")
    
    competitor_names = [c["name"] for c in competitors]
    
    # ── 1. Google Trends — Awareness + Consideration ──
    trends_awareness = fetch_google_trends_awareness(brand_name, competitor_names, geo)
    time.sleep(10)  # Longer pause — Google Trends rate limits quickly
    trends_consideration = fetch_google_trends_consideration(brand_name, geo)
    time.sleep(10)
    
    # ── 2. YouTube — Awareness supplement ──
    youtube_data = fetch_youtube_awareness(brand_name, YOUTUBE_API_KEY, geo)
    time.sleep(3)
    
    # ── 3. Reddit — Buzz, Usage, Imagery ──
    reddit_posts = fetch_reddit_mentions(brand_name, limit=50)
    time.sleep(1)
    buzz_data = compute_buzz_from_reddit(reddit_posts, brand_name)
    usage_data = compute_usage_from_reddit(reddit_posts, brand_name)
    imagery_data = compute_imagery_from_reddit(reddit_posts, brand_name)
    
    # ── 4. Combine Awareness ──
    awareness_data = compute_awareness(trends_awareness, youtube_data)
    
    # ── 5. Write all 5 KPIs to Supabase ──
    print(f"\n  Writing brand snapshots...")
    
    kpis = [
        ("awareness",     awareness_data),
        ("consideration", trends_consideration),
        ("buzz",          buzz_data),
        ("usage",         usage_data),
        ("imagery",       imagery_data),
    ]
    
    for kpi_name, data in kpis:
        is_buzz = kpi_name == "buzz"
        prev = get_previous_score(brand_id, kpi_name)
        movement = round(data["score"] - prev, 1) if prev is not None else None
        
        write_snapshot(
            brand_id=brand_id,
            competitor_id=None,
            kpi_name=kpi_name,
            score=data["score"],
            zone=score_to_zone(data["score"], is_buzz=is_buzz),
            confidence=data["confidence"],
            source=data.get("source", ""),
            snapshot_type="brand_level",
            checkpoint="current",
            movement=movement,
            raw_signals=data.get("raw")
        )
    
    # ── 6. Scrape competitors (Awareness + Buzz only at MVP) ──
    print(f"\n  Scraping competitors...")
    for comp in competitors:
        print(f"\n  → {comp['name']}")
        comp_trends = fetch_google_trends_awareness(comp["name"], [brand_name] + [c["name"] for c in competitors if c["id"] != comp["id"]], geo)
        time.sleep(10)
        comp_yt = fetch_youtube_awareness(comp["name"], YOUTUBE_API_KEY, geo)
        time.sleep(3)
        comp_reddit = fetch_reddit_mentions(comp["name"], limit=25)
        time.sleep(3)
        comp_buzz = compute_buzz_from_reddit(comp_reddit, comp["name"])
        comp_awareness = compute_awareness(comp_trends, comp_yt)
        
        for kpi_name, data in [("awareness", comp_awareness), ("buzz", comp_buzz)]:
            is_buzz = kpi_name == "buzz"
            prev = get_previous_score(brand_id, kpi_name, comp["id"])
            movement = round(data["score"] - prev, 1) if prev is not None else None
            
            # Delete old competitor snapshot before inserting new one
            try:
                supabase.table("kpi_snapshots")\
                    .delete()\
                    .eq("brand_id", brand_id)\
                    .eq("competitor_id", comp["id"])\
                    .eq("kpi_name", kpi_name)\
                    .eq("checkpoint", "current")\
                    .execute()
            except:
                pass
            
            write_snapshot(
                brand_id=brand_id,
                competitor_id=comp["id"],
                kpi_name=kpi_name,
                score=data["score"],
                zone=score_to_zone(data["score"], is_buzz=is_buzz),
                confidence=data["confidence"],
                source=data.get("source", ""),
                snapshot_type="brand_level",
                checkpoint="current",
                movement=movement,
                raw_signals=data.get("raw")
            )

def main():
    """
    Fetch all brands from Supabase and run the scraper for each.
    In production this runs on a schedule (every 6 hours for Awareness, 2 hours for Buzz).
    For MVP, we run all KPIs together on each trigger.
    """
    print("Solomon's IQ — Scraper starting...")
    
    # Fetch all brands
    brands_result = supabase.table("brands").select("id, brand_name, category").execute()
    if not brands_result.data:
        print("No brands found in database. Exiting.")
        return
    
    for brand in brands_result.data:
        brand_id = brand["id"]
        brand_name = brand["brand_name"]
        
        # Fetch competitors for this brand
        comps_result = supabase.table("competitors")\
            .select("id, name")\
            .eq("brand_id", brand_id)\
            .execute()
        competitors = comps_result.data or []
        
        run_scraper_for_brand(brand_id, brand_name, competitors)
        time.sleep(3)
    
    print("\nScraper complete.")

if __name__ == "__main__":
    main()