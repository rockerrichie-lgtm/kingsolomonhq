"""
Solomon's IQ — Data Scraper v2
Pulls real brand signals from multiple sources.
Computes KPI scores and writes them to Supabase kpi_snapshots with status = pending_review.

Sources:
  - Google Trends (pytrends-modern)
  - YouTube Data API v3
  - API Direct (Instagram, Facebook, Twitter/X, Reddit, TikTok, LinkedIn, YouTube, Web Search)
  - OpenWeb Ninja (Trustpilot reviews, Amazon reviews, News, Forums)
  - Google Play Store reviews
  - Apple App Store reviews
  - Google Alerts RSS

KPIs computed:
  - Awareness:     Google Trends + YouTube + API Direct (Web Search + Twitter + Facebook + Instagram)
  - Consideration: Google Trends intent queries + API Direct (Reddit + Twitter)
  - Usage:         Google Play + App Store + OpenWeb Ninja (Trustpilot + Amazon) + API Direct (Reddit)
  - Imagery:       NLP over all text signals — adjective/attribute extraction
  - Buzz:          API Direct (Twitter + Instagram + Facebook + Reddit + TikTok) + YouTube

Run: py scraper.py
"""

import os
import time
import json
import re
import requests
import feedparser
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# ─── Credentials ───────────────────────────────────────────────────────────────
# FILL IN YOUR KEYS IN THE .env FILE:
# SUPABASE_URL=https://alrwyeenxeuxgkcskkes.supabase.co
# SUPABASE_SERVICE_KEY=your_supabase_service_role_key
# YOUTUBE_API_KEY=your_youtube_api_key
# API_DIRECT_KEY=your_api_direct_key       ← paste your API Direct key here
# OPENWEBNINJA_KEY=your_openwebninja_key     ← paste your OpenWeb Ninja key here

SUPABASE_URL        = os.getenv("SUPABASE_URL")
SUPABASE_KEY        = os.getenv("SUPABASE_SERVICE_KEY")
YOUTUBE_API_KEY     = os.getenv("YOUTUBE_API_KEY")
API_DIRECT_KEY      = os.getenv("API_DIRECT_KEY")
OPENWEBNINJA_KEY    = os.getenv("OPENWEBNINJA_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─── Helpers ───────────────────────────────────────────────────────────────────

def score_to_zone(score: float, is_buzz: bool = False) -> str:
    if is_buzz:
        score = (score + 100) / 2
    if score <= 20:  return "critical"
    if score <= 40:  return "emerging"
    if score <= 60:  return "contested"
    if score <= 80:  return "established"
    return "category_defining"

def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))

def safe_get(url: str, params: dict = None, headers: dict = None, timeout: int = 15):
    default_headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125.0.0.0 Safari/537.36",
        "Accept": "application/json, text/html,*/*",
        "Accept-Language": "en-US,en;q=0.9",
    }
    if headers:
        default_headers.update(headers)
    try:
        r = requests.get(url, params=params, headers=default_headers, timeout=timeout)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  [HTTP error] {url}: {e}")
        return None

def classify_confidence(n_signals: int, avg_sentiment_variance: float) -> str:
    if n_signals == 0:       return "unexplained"
    if n_signals < 10:       return "external"
    if avg_sentiment_variance > 0.5: return "split"
    return "high"

# ─── Sentiment lexicon ─────────────────────────────────────────────────────────

POSITIVE_WORDS = {
    "good","great","excellent","amazing","love","best","fantastic","wonderful",
    "happy","awesome","superb","brilliant","outstanding","perfect","recommend",
    "reliable","fast","fresh","delicious","quality","smooth","safe","trust",
    "affordable","value","consistent","favourite","favorite","enjoyed","impressed"
}
NEGATIVE_WORDS = {
    "bad","terrible","awful","hate","worst","horrible","disgusting","slow",
    "poor","disappointing","disappointed","problem","issue","broken","failed",
    "expensive","overpriced","avoid","never","fraud","fake","dirty","cold",
    "wrong","delayed","late","missing","complaint","rude","scam","refund"
}
POSITIVE_IMAGERY = {
    "reliable","fresh","healthy","premium","innovative","trusted","popular",
    "convenient","affordable","modern","stylish","authentic","quality",
    "efficient","responsive","friendly","clean","fast","consistent","natural"
}
NEGATIVE_IMAGERY = {
    "cheap","outdated","unreliable","expensive","slow","poor","boring",
    "generic","average","mediocre","inconsistent","problematic","fake"
}
USAGE_SIGNALS = {
    "used","ordered","bought","tried","experience","review","after using",
    "been using","recently tried","switched to","daily","regularly","weekly",
    "delivery","arrived","received","quality","packaging","value for money",
    "repurchase","reorder","subscribe","subscription","recommend"
}

def simple_sentiment(text: str) -> float:
    words = re.findall(r'\b\w+\b', text.lower())
    pos = sum(1 for w in words if w in POSITIVE_WORDS)
    neg = sum(1 for w in words if w in NEGATIVE_WORDS)
    total = pos + neg
    if total == 0: return 0.0
    return (pos - neg) / total

# ─── Google Trends ─────────────────────────────────────────────────────────────

def fetch_google_trends_awareness(brand: str, competitors: list, geo: str = "IN") -> dict:
    print(f"  [Google Trends] Awareness: {brand}")
    for attempt in range(3):
        try:
            from pytrends.request import TrendReq
            pytrends = TrendReq(hl="en-IN", tz=330, timeout=(15, 35),
                requests_args={"headers": {"User-Agent": "Mozilla/5.0 Chrome/125.0.0.0"}})
            keywords = [brand] + competitors[:4]
            pytrends.build_payload(keywords, timeframe="now 7-d", geo=geo)
            data = pytrends.interest_over_time()
            if data.empty:
                return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}
            brand_col = brand if brand in data.columns else keywords[0]
            brand_values = data[brand_col].tolist()
            avg_interest = sum(brand_values) / len(brand_values) if brand_values else 0
            all_values = {kw: data[kw].mean() for kw in keywords if kw in data.columns}
            total = sum(all_values.values())
            share = (all_values.get(brand_col, 0) / total * 100) if total > 0 else 0
            score = round(clamp(avg_interest * 0.6 + share * 0.4, 0, 100))
            print(f"  [Google Trends] {brand}: score={score}, share={share:.1f}%")
            return {"score": score, "source": "Google Trends", "confidence": "high" if avg_interest > 5 else "external", "raw": {"avg_interest": avg_interest, "share_of_search": share}}
        except Exception as e:
            if "429" in str(e) and attempt < 2:
                wait = (attempt + 1) * 15
                print(f"  [Google Trends] Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  [Google Trends] Error: {e}")
                return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}
    return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}

def fetch_google_trends_consideration(brand: str, geo: str = "IN") -> dict:
    print(f"  [Google Trends] Consideration: {brand}")
    for attempt in range(3):
        try:
            from pytrends.request import TrendReq
            pytrends = TrendReq(hl="en-IN", tz=330, timeout=(15, 35),
                requests_args={"headers": {"User-Agent": "Mozilla/5.0 Chrome/125.0.0.0"}})
            intent_queries = [f"{brand} vs", f"{brand} review", f"{brand} price", f"{brand} offer"][:4]
            pytrends.build_payload(intent_queries, timeframe="now 7-d", geo=geo)
            data = pytrends.interest_over_time()
            if data.empty:
                return {"score": 0, "source": "Google Trends — intent queries", "confidence": "unexplained", "raw": None}
            avg_scores = [data[q].mean() for q in intent_queries if q in data.columns]
            avg = sum(avg_scores) / len(avg_scores) if avg_scores else 0
            score = round(clamp(avg, 0, 100))
            print(f"  [Google Trends] Consideration {brand}: {score}")
            return {"score": score, "source": "Google Trends — intent queries", "confidence": "high" if avg > 5 else "external", "raw": {"avg_intent_interest": avg}}
        except Exception as e:
            if "429" in str(e) and attempt < 2:
                time.sleep((attempt + 1) * 15)
            else:
                print(f"  [Google Trends] Consideration error: {e}")
                return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}
    return {"score": 0, "source": "Google Trends", "confidence": "unexplained", "raw": None}

# ─── YouTube Data API v3 ───────────────────────────────────────────────────────

def fetch_youtube_data(brand: str) -> dict:
    print(f"  [YouTube] Fetching: {brand}")
    if not YOUTUBE_API_KEY:
        return {"score": 0, "text_signals": [], "source": "YouTube", "confidence": "unexplained", "raw": None}
    try:
        search_url = "https://www.googleapis.com/youtube/v3/search"
        params = {"part": "snippet", "q": brand, "type": "video", "regionCode": "IN",
                  "relevanceLanguage": "en", "maxResults": 25, "key": YOUTUBE_API_KEY}
        data = safe_get(search_url, params=params)
        if not data:
            return {"score": 0, "text_signals": [], "source": "YouTube", "confidence": "unexplained", "raw": None}
        items = data.get("items", [])
        result_count = data.get("pageInfo", {}).get("totalResults", 0)
        text_signals = []
        for item in items:
            snippet = item.get("snippet", {})
            text = f"{snippet.get('title', '')} {snippet.get('description', '')}"
            text_signals.append(text)
        score = round(clamp(min(100, result_count / 10000) * 50, 0, 50))
        print(f"  [YouTube] {brand}: {result_count} results, score={score}")
        return {"score": score, "text_signals": text_signals, "source": f"YouTube — {result_count} videos",
                "confidence": "high" if result_count > 100 else "external", "raw": {"result_count": result_count}}
    except Exception as e:
        print(f"  [YouTube] Error: {e}")
        return {"score": 0, "text_signals": [], "source": "YouTube", "confidence": "unexplained", "raw": None}

# ─── API Direct ────────────────────────────────────────────────────────────────
# API Direct covers: Twitter/X, LinkedIn, Facebook, Reddit, Instagram, TikTok, YouTube, Web Search
# All from one API key. Pay per request at ~$0.01 each.
# Sign up at: apidirect.io
# Add your key to .env as: API_DIRECT_KEY=your_key_here

def fetch_api_direct(platform: str, query: str) -> list:
    """
    Fetch mentions from API Direct for a given platform and query.
    Platform options: twitter, facebook, instagram, reddit, tiktok, linkedin, youtube, web
    Returns list of text signals.
    """
    if not API_DIRECT_KEY:
        print(f"  [API Direct] No API key — skipping {platform}")
        return []
    print(f"  [API Direct] {platform}: {query}")
    try:
        url = f"https://apidirect.io/api/v1/{platform}/search"
        headers = {"Authorization": f"Bearer {API_DIRECT_KEY}", "Content-Type": "application/json"}
        params = {"q": query, "limit": 20}
        r = requests.get(url, params=params, headers=headers, timeout=15)
        if r.status_code != 200:
            print(f"  [API Direct] {platform} returned {r.status_code}")
            return []
        data = r.json()
        results = data.get("results", data.get("data", []))
        texts = []
        for item in results:
            text = item.get("text", item.get("content", item.get("title", item.get("snippet", ""))))
            if text:
                texts.append(str(text))
        print(f"  [API Direct] {platform}: {len(texts)} signals")
        return texts
    except Exception as e:
        print(f"  [API Direct] {platform} error: {e}")
        return []

def fetch_all_social_signals(brand: str) -> dict:
    """
    Fetch brand mentions from all API Direct platforms.
    Returns dict of platform -> list of text signals.
    """
    platforms = {
        "twitter":   brand,
        "instagram": brand,
        "facebook":  brand,
        "reddit":    brand,
        "tiktok":    brand,
        "youtube":   brand,
        "web":       f"{brand} review",
    }
    signals = {}
    for platform, query in platforms.items():
        signals[platform] = fetch_api_direct(platform, query)
        time.sleep(1)
    return signals

# ─── OpenWeb Ninja ─────────────────────────────────────────────────────────────
# OpenWeb Ninja provides: Trustpilot reviews, Amazon reviews, News, Forums
# Sign up at: openwebninja.com
# Add your key to .env as: OPENWEBNINJA_KEY=your_key_here

def fetch_trustpilot_reviews(brand: str) -> list:
    """Fetch Trustpilot reviews for a brand via OpenWeb Ninja."""
    if not OPENWEBNINJA_KEY:
        print(f"  [OpenWeb Ninja] No API key — skipping Trustpilot")
        return []
    print(f"  [OpenWeb Ninja] Trustpilot: {brand}")
    try:
        url = "https://api.openwebninja.com/trustpilot-company-and-reviews/company-search"
        headers = {"x-api-key": OPENWEBNINJA_KEY}
        params = {"query": brand}
        data = safe_get(url, params=params, headers=headers)
        if not data:
            return []
        companies = data.get("data", [])
        if not companies:
            return []
        company_id = companies[0].get("id", "")
        if not company_id:
            return []
        reviews_url = f"https://api.openwebninja.com/trustpilot-company-and-reviews/company-reviews"
        params = {"id": company_id, "page": 1}
        reviews_data = safe_get(reviews_url, params=params, headers=headers)
        if not reviews_data:
            return []
        reviews = reviews_data.get("data", {}).get("reviews", [])
        texts = [f"{r.get('review_title', '')} {r.get('review_text', '')}" for r in reviews if r.get("review_text")]
        print(f"  [OpenWeb Ninja] Trustpilot: {len(texts)} reviews")
        return texts
    except Exception as e:
        print(f"  [OpenWeb Ninja] Trustpilot error: {e}")
        return []

def fetch_amazon_reviews(brand: str) -> list:
    """Fetch Amazon product reviews for a brand via OpenWeb Ninja."""
    if not OPENWEBNINJA_KEY:
        return []
    print(f"  [OpenWeb Ninja] Amazon: {brand}")
    try:
        url = "https://api.openwebninja.com/realtime-amazon-data/product-search"
        headers = {"x-api-key": OPENWEBNINJA_KEY}
        params = {"query": brand, "country": "IN", "page": 1}
        data = safe_get(url, params=params, headers=headers)
        if not data:
            return []
        products = data.get("data", {}).get("products", [])
        if not products:
            return []
        asin = products[0].get("asin", "")
        if not asin:
            return []
        reviews_url = "https://api.openwebninja.com/realtime-amazon-data/product-reviews"
        params = {"asin": asin, "country": "IN", "page": 1}
        reviews_data = safe_get(reviews_url, params=params, headers=headers)
        if not reviews_data:
            return []
        reviews = reviews_data.get("data", {}).get("reviews", [])
        texts = [f"{r.get('title', '')} {r.get('body', '')}" for r in reviews if r.get("body")]
        print(f"  [OpenWeb Ninja] Amazon: {len(texts)} reviews")
        return texts
    except Exception as e:
        print(f"  [OpenWeb Ninja] Amazon error: {e}")
        return []

def fetch_news_mentions(brand: str) -> list:
    """Fetch news mentions for a brand via OpenWeb Ninja."""
    if not OPENWEBNINJA_KEY:
        return []
    print(f"  [OpenWeb Ninja] News: {brand}")
    try:
        url = "https://api.openwebninja.com/realtime-news-data/search-news"
        headers = {"x-api-key": OPENWEBNINJA_KEY}
        params = {"query": brand, "country": "IN", "language": "en", "page": 1}
        data = safe_get(url, params=params, headers=headers)
        if not data:
            return []
        articles = data.get("data", [])
        texts = [f"{a.get('title', '')} {a.get('snippet', '')}" for a in articles if a.get("title")]
        print(f"  [OpenWeb Ninja] News: {len(texts)} articles")
        return texts
    except Exception as e:
        print(f"  [OpenWeb Ninja] News error: {e}")
        return []

# ─── Google Play Store ─────────────────────────────────────────────────────────

def fetch_google_play_reviews(brand: str) -> list:
    """
    Fetch Google Play Store reviews using google-play-scraper library.
    Install: pip install google-play-scraper --break-system-packages
    """
    print(f"  [Google Play] Fetching reviews: {brand}")
    try:
        from google_play_scraper import search, reviews as gplay_reviews, Sort
        results = search(brand, lang="en", country="in", n_hits=3)
        if not results:
            return []
        app_id = results[0].get("appId", "")
        if not app_id:
            return []
        result, _ = gplay_reviews(app_id, lang="en", country="in", sort=Sort.NEWEST, count=30)
        texts = [r.get("content", "") for r in result if r.get("content")]
        print(f"  [Google Play] {brand}: {len(texts)} reviews (app: {app_id})")
        return texts
    except ImportError:
        print("  [Google Play] google-play-scraper not installed. Run: pip install google-play-scraper --break-system-packages")
        return []
    except Exception as e:
        print(f"  [Google Play] Error: {e}")
        return []

# ─── Apple App Store ───────────────────────────────────────────────────────────

def fetch_app_store_reviews(brand: str) -> list:
    """
    Fetch Apple App Store reviews via iTunes public API.
    No authentication required — Apple exposes this publicly.
    """
    print(f"  [App Store] Fetching reviews: {brand}")
    try:
        search_url = "https://itunes.apple.com/search"
        params = {"term": brand, "country": "in", "media": "software", "limit": 5}
        data = safe_get(search_url, params=params)
        if not data or not data.get("results"):
            return []
        app_id = data["results"][0].get("trackId", "")
        if not app_id:
            return []
        reviews_url = f"https://itunes.apple.com/in/rss/customerreviews/id={app_id}/sortBy=mostRecent/json"
        reviews_data = safe_get(reviews_url)
        if not reviews_data:
            return []
        entries = reviews_data.get("feed", {}).get("entry", [])
        texts = []
        for entry in entries:
            if isinstance(entry, dict):
                title = entry.get("title", {}).get("label", "")
                content = entry.get("content", {}).get("label", "")
                if content:
                    texts.append(f"{title} {content}")
        print(f"  [App Store] {brand}: {len(texts)} reviews")
        return texts
    except Exception as e:
        print(f"  [App Store] Error: {e}")
        return []

# ─── Google Alerts RSS ─────────────────────────────────────────────────────────

def fetch_google_alerts_rss(brand: str) -> list:
    """
    Fetch Google Alerts RSS feed for brand mentions.
    Install feedparser: pip install feedparser --break-system-packages
    Note: Requires a Google Alert to be set up manually at google.com/alerts for the brand.
    Falls back to Google News RSS if no alert exists.
    """
    print(f"  [Google Alerts] Fetching: {brand}")
    try:
        # Google News RSS as fallback — publicly available, no auth needed
        query = brand.replace(" ", "+")
        rss_url = f"https://news.google.com/rss/search?q={query}&hl=en-IN&gl=IN&ceid=IN:en"
        feed = feedparser.parse(rss_url)
        texts = []
        for entry in feed.entries[:20]:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            if title:
                texts.append(f"{title} {summary}")
        print(f"  [Google Alerts] {brand}: {len(texts)} news items")
        return texts
    except Exception as e:
        print(f"  [Google Alerts] Error: {e}")
        return []

# ─── KPI Classifier ────────────────────────────────────────────────────────────

def compute_kpis_from_all_signals(
    brand: str,
    trends_awareness: dict,
    trends_consideration: dict,
    youtube_data: dict,
    social_signals: dict,
    trustpilot_texts: list,
    amazon_texts: list,
    news_texts: list,
    play_texts: list,
    appstore_texts: list,
    alerts_texts: list,
) -> dict:
    """
    Master KPI classifier.
    Takes all raw signals from all sources and computes 5 KPI scores.
    """

    # ── Combine all text signals by KPI ──
    all_texts = (
        social_signals.get("twitter", []) +
        social_signals.get("instagram", []) +
        social_signals.get("facebook", []) +
        social_signals.get("reddit", []) +
        social_signals.get("tiktok", []) +
        social_signals.get("youtube", []) +
        social_signals.get("web", []) +
        youtube_data.get("text_signals", []) +
        trustpilot_texts +
        amazon_texts +
        news_texts +
        play_texts +
        appstore_texts +
        alerts_texts
    )

    review_texts = trustpilot_texts + amazon_texts + play_texts + appstore_texts
    social_texts = (
        social_signals.get("twitter", []) +
        social_signals.get("instagram", []) +
        social_signals.get("facebook", []) +
        social_signals.get("reddit", []) +
        social_signals.get("tiktok", [])
    )
    news_and_alerts = news_texts + alerts_texts

    # ── AWARENESS ──
    # Sources: Google Trends (60%) + YouTube (20%) + Social mentions volume (20%)
    social_mention_count = sum(len(v) for v in social_signals.values())
    social_mention_score = clamp(social_mention_count * 2, 0, 40)
    awareness_score = round(clamp(
        trends_awareness["score"] * 0.6 +
        youtube_data["score"] * 0.2 +
        social_mention_score * 0.2,
        0, 100
    ))
    awareness_sources = []
    if trends_awareness["score"] > 0: awareness_sources.append("Google Trends")
    if youtube_data["score"] > 0: awareness_sources.append("YouTube")
    if social_mention_count > 0: awareness_sources.append(f"Social ({social_mention_count} mentions)")
    if news_and_alerts: awareness_sources.append("News/Alerts")

    # ── CONSIDERATION ──
    # Sources: Google Trends intent (60%) + Social intent signals (40%)
    consideration_texts = social_signals.get("twitter", []) + social_signals.get("reddit", [])
    intent_signals = [t for t in consideration_texts if
        any(w in t.lower() for w in ["vs", "versus", "compare", "better", "review", "price", "buy", "worth", "should i"])]
    intent_score = clamp(len(intent_signals) * 3, 0, 40)
    consideration_score = round(clamp(
        trends_consideration["score"] * 0.6 + intent_score * 0.4,
        0, 100
    ))

    # ── USAGE ──
    # Sources: Reviews (70%) + Social post-experience signals (30%)
    usage_review_texts = review_texts
    usage_social_texts = [t for t in social_texts if
        any(w in t.lower() for w in list(USAGE_SIGNALS))]
    all_usage_texts = usage_review_texts + usage_social_texts

    if not all_usage_texts:
        usage_score = 0
        usage_confidence = "unexplained"
    else:
        sentiments = [simple_sentiment(t) for t in all_usage_texts]
        avg_s = sum(sentiments) / len(sentiments)
        volume_bonus = min(15, len(all_usage_texts) / 3)
        usage_score = round(clamp(40 + avg_s * 35 + volume_bonus, 0, 100))
        variance = sum((s - avg_s) ** 2 for s in sentiments) / len(sentiments)
        usage_confidence = classify_confidence(len(all_usage_texts), variance)

    # ── IMAGERY ──
    # Sources: All text signals — adjective extraction
    if not all_texts:
        imagery_score = 40
        imagery_confidence = "external"
    else:
        pos_count = 0
        neg_count = 0
        for text in all_texts:
            words = set(re.findall(r'\b\w+\b', text.lower()))
            pos_count += len(words & POSITIVE_IMAGERY)
            neg_count += len(words & NEGATIVE_IMAGERY)
        total_imagery = pos_count + neg_count
        if total_imagery == 0:
            imagery_score = 40
        else:
            imagery_score = round(clamp((pos_count / total_imagery) * 80 + 10, 0, 100))
        imagery_confidence = classify_confidence(len(all_texts), 0.3)

    # ── BUZZ ──
    # Sources: All social platforms — weighted sentiment
    buzz_texts = social_texts + news_and_alerts + youtube_data.get("text_signals", [])
    if not buzz_texts:
        buzz_score = 0
        buzz_confidence = "unexplained"
    else:
        sentiments = [simple_sentiment(t) for t in buzz_texts]
        avg_s = sum(sentiments) / len(sentiments)
        buzz_score = round(clamp(avg_s * 100, -100, 100))
        variance = sum((s - avg_s) ** 2 for s in sentiments) / len(sentiments)
        buzz_confidence = classify_confidence(len(buzz_texts), variance)

    total_sources = len(set(
        (["Google Trends"] if trends_awareness["score"] > 0 else []) +
        (["YouTube"] if youtube_data["score"] > 0 else []) +
        ([p for p, v in social_signals.items() if v]) +
        (["Trustpilot"] if trustpilot_texts else []) +
        (["Amazon"] if amazon_texts else []) +
        (["Google Play"] if play_texts else []) +
        (["App Store"] if appstore_texts else []) +
        (["News/Alerts"] if news_and_alerts else [])
    ))

    return {
        "awareness": {
            "score": awareness_score,
            "zone": score_to_zone(awareness_score),
            "confidence": trends_awareness["confidence"],
            "source": " + ".join(awareness_sources) if awareness_sources else "Multiple sources",
            "sources_count": total_sources,
        },
        "consideration": {
            "score": consideration_score,
            "zone": score_to_zone(consideration_score),
            "confidence": trends_consideration["confidence"],
            "source": f"Google Trends intent + Social signals ({len(intent_signals)} intent mentions)",
            "sources_count": total_sources,
        },
        "usage": {
            "score": usage_score,
            "zone": score_to_zone(usage_score),
            "confidence": usage_confidence if all_usage_texts else "unexplained",
            "source": f"Reviews + Social experience signals ({len(all_usage_texts)} signals)",
            "sources_count": total_sources,
        },
        "imagery": {
            "score": imagery_score,
            "zone": score_to_zone(imagery_score),
            "confidence": imagery_confidence,
            "source": f"NLP over {len(all_texts)} signals across all sources",
            "sources_count": total_sources,
        },
        "buzz": {
            "score": buzz_score,
            "zone": score_to_zone(buzz_score, is_buzz=True),
            "confidence": buzz_confidence,
            "source": f"Social + News sentiment ({len(buzz_texts)} signals)",
            "sources_count": total_sources,
        },
    }

# ─── Supabase writer ───────────────────────────────────────────────────────────

def get_previous_score(brand_id: str, kpi_name: str, competitor_id=None):
    try:
        query = supabase.table("kpi_snapshots")\
            .select("score")\
            .eq("brand_id", brand_id)\
            .eq("kpi_name", kpi_name)\
            .eq("snapshot_type", "brand_level")\
            .eq("checkpoint", "current")\
            .eq("status", "published")\
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

def write_snapshot(brand_id: str, competitor_id, kpi_name: str, score: float,
                   zone: str, confidence: str, source: str, snapshot_type: str,
                   checkpoint: str, movement, raw_signals, sources_count: int = 0):
    """
    Write KPI snapshot to Supabase with status = pending_review.
    Customer never sees this until you approve it in the admin panel.
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
        "raw_signals": raw_signals,
        "sources_count": sources_count,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "status": "pending_review",   # ← NEVER published directly. Always goes through admin approval.
    }
    try:
        supabase.table("kpi_snapshots").insert(row).execute()
        print(f"  [Supabase] {kpi_name}: {score} ({zone}) → pending_review")
    except Exception as e:
        print(f"  [Supabase] Write error {kpi_name}: {e}")

# ─── Main scraper pipeline ─────────────────────────────────────────────────────

def run_scraper_for_brand(brand_id: str, brand_name: str, competitors: list, geo: str = "IN"):
    print(f"\n{'='*60}")
    print(f"Scraping: {brand_name} | {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"{'='*60}")

    competitor_names = [c["name"] for c in competitors]

    # ── Step 1: Google Trends ──
    trends_awareness    = fetch_google_trends_awareness(brand_name, competitor_names, geo)
    time.sleep(12)
    trends_consideration = fetch_google_trends_consideration(brand_name, geo)
    time.sleep(12)

    # ── Step 2: YouTube ──
    youtube_data = fetch_youtube_data(brand_name)
    time.sleep(3)

    # ── Step 3: API Direct — all social platforms ──
    print(f"\n  [API Direct] Fetching all social platforms...")
    social_signals = fetch_all_social_signals(brand_name)
    time.sleep(2)

    # ── Step 4: OpenWeb Ninja — Trustpilot + Amazon + News ──
    print(f"\n  [OpenWeb Ninja] Fetching reviews and news...")
    trustpilot_texts = fetch_trustpilot_reviews(brand_name)
    time.sleep(2)
    amazon_texts = fetch_amazon_reviews(brand_name)
    time.sleep(2)
    news_texts = fetch_news_mentions(brand_name)
    time.sleep(2)

    # ── Step 5: Google Play + App Store ──
    play_texts     = fetch_google_play_reviews(brand_name)
    time.sleep(2)
    appstore_texts = fetch_app_store_reviews(brand_name)
    time.sleep(2)

    # ── Step 6: Google Alerts RSS ──
    alerts_texts = fetch_google_alerts_rss(brand_name)
    time.sleep(2)

    # ── Step 7: Classify all signals into 5 KPIs ──
    print(f"\n  [Classifier] Computing KPI scores...")
    kpis = compute_kpis_from_all_signals(
        brand=brand_name,
        trends_awareness=trends_awareness,
        trends_consideration=trends_consideration,
        youtube_data=youtube_data,
        social_signals=social_signals,
        trustpilot_texts=trustpilot_texts,
        amazon_texts=amazon_texts,
        news_texts=news_texts,
        play_texts=play_texts,
        appstore_texts=appstore_texts,
        alerts_texts=alerts_texts,
    )

    # ── Step 8: Write to Supabase as pending_review ──
    print(f"\n  [Supabase] Writing brand snapshots as pending_review...")
    for kpi_name, data in kpis.items():
        prev = get_previous_score(brand_id, kpi_name)
        movement = round(data["score"] - prev, 1) if prev is not None else None
        write_snapshot(
            brand_id=brand_id,
            competitor_id=None,
            kpi_name=kpi_name,
            score=data["score"],
            zone=data["zone"],
            confidence=data["confidence"],
            source=data["source"],
            snapshot_type="brand_level",
            checkpoint="current",
            movement=movement,
            raw_signals=None,
            sources_count=data["sources_count"],
        )

    # ── Step 9: Competitors — Awareness + Buzz only ──
    print(f"\n  Scraping {len(competitors)} competitors...")
    for comp in competitors:
        print(f"\n  → {comp['name']}")
        comp_trends = fetch_google_trends_awareness(comp["name"], [brand_name], geo)
        time.sleep(12)
        comp_yt = fetch_youtube_data(comp["name"])
        time.sleep(3)
        comp_social = fetch_all_social_signals(comp["name"])
        time.sleep(2)

        comp_mention_count = sum(len(v) for v in comp_social.values())
        comp_social_score = clamp(comp_mention_count * 2, 0, 40)
        comp_awareness_score = round(clamp(
            comp_trends["score"] * 0.6 + comp_yt["score"] * 0.2 + comp_social_score * 0.2, 0, 100))

        comp_social_texts = (
            comp_social.get("twitter", []) + comp_social.get("instagram", []) +
            comp_social.get("facebook", []) + comp_social.get("reddit", []) +
            comp_social.get("tiktok", []) + comp_yt.get("text_signals", [])
        )
        if comp_social_texts:
            sentiments = [simple_sentiment(t) for t in comp_social_texts]
            avg_s = sum(sentiments) / len(sentiments)
            comp_buzz_score = round(clamp(avg_s * 100, -100, 100))
            variance = sum((s - avg_s) ** 2 for s in sentiments) / len(sentiments)
            comp_buzz_confidence = classify_confidence(len(comp_social_texts), variance)
        else:
            comp_buzz_score = 0
            comp_buzz_confidence = "unexplained"

        for kpi_name, score, zone, conf, source in [
            ("awareness", comp_awareness_score, score_to_zone(comp_awareness_score), comp_trends["confidence"], "Google Trends + Social"),
            ("buzz",      comp_buzz_score,       score_to_zone(comp_buzz_score, True), comp_buzz_confidence, "Social sentiment"),
        ]:
            prev = get_previous_score(brand_id, kpi_name, comp["id"])
            movement = round(score - prev, 1) if prev is not None else None
            write_snapshot(
                brand_id=brand_id,
                competitor_id=comp["id"],
                kpi_name=kpi_name,
                score=score,
                zone=zone,
                confidence=conf,
                source=source,
                snapshot_type="brand_level",
                checkpoint="current",
                movement=movement,
                raw_signals=None,
                sources_count=0,
            )

    print(f"\n  ✅ {brand_name} complete. All data pending your approval in /admin")

def main():
    print("Solomon's IQ — Scraper v2 starting...")
    print(f"Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"API Direct: {'✅ configured' if API_DIRECT_KEY else '❌ missing — add API_DIRECT_KEY to .env'}")
    print(f"OpenWeb Ninja: {'✅ configured' if OPENWEBNINJA_KEY else '❌ missing — add OPENWEBNINJA_KEY to .env'}")
    print(f"YouTube API: {'✅ configured' if YOUTUBE_API_KEY else '⚠️  missing — YouTube falls back to Trends'}")

    brands_result = supabase.table("brands").select("id, brand_name, category").execute()
    if not brands_result.data:
        print("No brands found in database. Exiting.")
        return

    for brand in brands_result.data:
        brand_id   = brand["id"]
        brand_name = brand["brand_name"]
        comps = supabase.table("competitors").select("id, name").eq("brand_id", brand_id).execute()
        competitors = comps.data or []
        run_scraper_for_brand(brand_id, brand_name, competitors)
        time.sleep(5)

    print("\n✅ Scraper complete. Go to kingsolomonhq.com/admin → Data approval to review and publish.")

if __name__ == "__main__":
    main()