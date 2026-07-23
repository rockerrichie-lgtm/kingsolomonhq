"""
Solomon's IQ + Eye — Data Scraper v3
Pulls real brand signals from multiple sources.
Writes to Supabase with status = pending_review.
Requires JR approval in /admin before customer sees data.

Sources:
  - Google Trends (pytrends)
  - API Direct (Twitter, Instagram, Facebook, Reddit, TikTok, YouTube, Web)
  - OpenWeb Ninja (Trustpilot, Amazon, News)
  - Google Play Store reviews
  - Apple App Store reviews
  - Google News RSS

KPIs — sub-bucket architecture v3:
  Awareness:     Searched / Found / Shown (3 separate indices)
  Consideration: Comparing / Trialling / Interested (proximity-filtered)
  Usage:         Repeat / Switchers (diagnostic) / Lost
  Imagery:       Positive attributes / Negative attributes / Net
  Buzz:          Praising / Questioning / Attacking + Net

Run: py scraper.py
"""

import os
import time
import re
import requests
import feedparser
from collections import Counter
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL     = os.getenv("SUPABASE_URL")
SUPABASE_KEY     = os.getenv("SUPABASE_SERVICE_KEY")
YOUTUBE_API_KEY  = os.getenv("YOUTUBE_API_KEY")
API_DIRECT_KEY   = os.getenv("API_DIRECT_KEY")
OPENWEBNINJA_KEY = os.getenv("OPENWEBNINJA_KEY")

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

def classify_confidence(n_signals: int, variance: float) -> str:
    if n_signals == 0:   return "unexplained"
    if n_signals < 10:   return "external"
    if variance > 0.5:   return "split"
    return "high"

# ─── Keyword extraction ────────────────────────────────────────────────────────

STOP_WORDS = {
    "the","a","an","is","it","was","to","and","in","of","for","with","this","that",
    "not","but","are","be","have","has","i","my","we","our","they","their","its",
    "on","at","by","as","so","do","did","get","got","no","he","she","you","your",
    "me","him","her","us","app","just","very","also","more","like","good","great",
    "bad","product","from","been","will","would","could","about","what",
    "when","which","there","then","than","only","some","them","into","after","over"
}

def extract_keywords(texts: list, top_n: int = 10) -> str:
    if not texts:
        return ""
    all_words = re.findall(r'\b\w+\b', " ".join(texts).lower())
    filtered = [w for w in all_words if len(w) > 3 and w not in STOP_WORDS]
    most_common = Counter(filtered).most_common(top_n)
    return ", ".join([w for w, _ in most_common])

# ─── Proximity filter for intent signals ──────────────────────────────────────

def proximity_match(text: str, brand: str, intent_words: list, window: int = 10) -> bool:
    text_lower = text.lower()
    brand_lower = brand.lower()
    words = text_lower.split()
    for i, w in enumerate(words):
        if brand_lower in w:
            surrounding = words[max(0, i - window):i + window]
            surrounding_text = " ".join(surrounding)
            if any(intent in surrounding_text for intent in intent_words):
                return True
    return False

# ─── Sentiment lexicon ─────────────────────────────────────────────────────────

POSITIVE_WORDS = {
    "good","great","excellent","amazing","love","best","fantastic","wonderful",
    "happy","awesome","superb","brilliant","outstanding","perfect","recommend",
    "reliable","fast","fresh","quality","smooth","safe","trust","affordable",
    "value","consistent","favourite","favorite","enjoyed","impressed","natural"
}
NEGATIVE_WORDS = {
    "bad","terrible","awful","hate","worst","horrible","disgusting","slow",
    "poor","disappointing","disappointed","problem","issue","broken","failed",
    "expensive","overpriced","avoid","fraud","fake","dirty","wrong","delayed",
    "late","missing","complaint","rude","scam","refund","never"
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
    "delivery","arrived","received","packaging","value for money",
    "repurchase","reorder","subscribe","subscription","recommend"
}

EYE_THEMES = {
    "Product": {
        "keywords": ["product","quality","formula","ingredients","packaging","smell","texture",
                     "color","colour","size","design","effective","works","result","performance"],
    },
    "Experience": {
        "keywords": ["experience","easy","simple","convenient","app","website","interface",
                     "navigate","checkout","process","smooth","seamless","fast","quick"],
    },
    "Customer Service": {
        "keywords": ["support","service","help","response","team","staff","assist","resolve",
                     "customer care","refund","return","exchange","complaint","query"],
    },
    "Pricing": {
        "keywords": ["price","cost","value","worth","affordable","expensive","cheap","discount",
                     "offer","deal","promo","coupon","subscription","money"],
    },
    "Collections": {
        "keywords": ["range","collection","variety","options","choice","selection","products",
                     "catalogue","lineup","new launch","available","stock","limited edition"],
    }
}

def simple_sentiment(text: str) -> float:
    words = re.findall(r'\b\w+\b', text.lower())
    pos = sum(1 for w in words if w in POSITIVE_WORDS)
    neg = sum(1 for w in words if w in NEGATIVE_WORDS)
    total = pos + neg
    if total == 0: return 0.0
    return (pos - neg) / total

def classify_eye_theme(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for theme, data in EYE_THEMES.items():
        scores[theme] = sum(1 for kw in data["keywords"] if kw in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Product"

# ─── Google Trends ─────────────────────────────────────────────────────────────

def fetch_google_trends_awareness(brand: str, competitors: list, geo: str = "IN") -> dict:
    print(f"  [Google Trends] Awareness: {brand} (geo={geo})")
    for attempt in range(3):
        try:
            from pytrends.request import TrendReq
            pytrends = TrendReq(hl="en-IN", tz=330, timeout=(15, 35),
                requests_args={"headers": {"User-Agent": "Mozilla/5.0 Chrome/125.0.0.0"}})
            keywords = [brand] + competitors[:4]
            pytrends.build_payload(keywords, timeframe="now 7-d", geo=geo)
            data = pytrends.interest_over_time()
            if data.empty:
                return {"score": 0, "source": "Google Trends", "confidence": "unexplained"}
            brand_col = brand if brand in data.columns else keywords[0]
            brand_values = data[brand_col].tolist()
            avg_interest = sum(brand_values) / len(brand_values) if brand_values else 0
            all_values = {kw: data[kw].mean() for kw in keywords if kw in data.columns}
            total = sum(all_values.values())
            share = (all_values.get(brand_col, 0) / total * 100) if total > 0 else 0
            score = round(clamp(avg_interest * 0.6 + share * 0.4, 0, 100))
            print(f"  [Google Trends] {brand}: score={score}, share={share:.1f}%")
            return {"score": score, "source": "Google Trends", "confidence": "high" if avg_interest > 5 else "external"}
        except Exception as e:
            if "429" in str(e) and attempt < 2:
                wait = (attempt + 1) * 60
                print(f"  [Google Trends] Rate limited, waiting {wait}s...")
                time.sleep(wait)
            else:
                print(f"  [Google Trends] Error: {e}")
                return {"score": 0, "source": "Google Trends", "confidence": "unexplained"}
    return {"score": 0, "source": "Google Trends", "confidence": "unexplained"}

def fetch_google_trends_consideration(brand: str, geo: str = "IN") -> dict:
    print(f"  [Google Trends] Consideration: {brand} (geo={geo})")
    for attempt in range(3):
        try:
            from pytrends.request import TrendReq
            pytrends = TrendReq(hl="en-IN", tz=330, timeout=(15, 35),
                requests_args={"headers": {"User-Agent": "Mozilla/5.0 Chrome/125.0.0.0"}})
            intent_queries = [f"{brand} vs", f"{brand} review", f"{brand} price", f"{brand} offer"][:4]
            pytrends.build_payload(intent_queries, timeframe="now 7-d", geo=geo)
            data = pytrends.interest_over_time()
            if data.empty:
                return {"score": 0, "source": "Google Trends intent", "confidence": "unexplained"}
            avg_scores = [data[q].mean() for q in intent_queries if q in data.columns]
            avg = sum(avg_scores) / len(avg_scores) if avg_scores else 0
            score = round(clamp(avg, 0, 100))
            print(f"  [Google Trends] Consideration {brand}: {score}")
            return {"score": score, "source": "Google Trends — intent queries", "confidence": "high" if avg > 5 else "external"}
        except Exception as e:
            if "429" in str(e) and attempt < 2:
                time.sleep((attempt + 1) * 60)
            else:
                print(f"  [Google Trends] Consideration error: {e}")
                return {"score": 0, "source": "Google Trends", "confidence": "unexplained"}
    return {"score": 0, "source": "Google Trends", "confidence": "unexplained"}

# ─── API Direct ────────────────────────────────────────────────────────────────

def fetch_api_direct(platform: str, query: str) -> list:
    if not API_DIRECT_KEY:
        print(f"  [API Direct] No API key — skipping {platform}")
        return []
    print(f"  [API Direct] {platform}: {query}")
    try:
        platform_endpoints = {
            "twitter":   "https://apidirect.io/v1/twitter/posts",
            "instagram": "https://apidirect.io/v1/instagram/posts",
            "facebook":  "https://apidirect.io/v1/facebook/posts",
            "reddit":    "https://apidirect.io/v1/reddit/posts",
            "tiktok":    "https://apidirect.io/v1/tiktok/videos",
            "youtube":   "https://apidirect.io/v1/youtube/posts",
            "web":       "https://apidirect.io/v1/web/search",
        }
        url = platform_endpoints.get(platform)
        if not url:
            return []
        headers = {"X-API-Key": API_DIRECT_KEY}
        params = {"query": query, "pages": 1}
        r = requests.get(url, params=params, headers=headers, timeout=15)
        if r.status_code == 402:
            print(f"  [API Direct] {platform} — free tier exhausted")
            return []
        if r.status_code != 200:
            print(f"  [API Direct] {platform} returned {r.status_code}: {r.text[:100]}")
            return []
        data = r.json()
        items = data.get("posts", data.get("videos", data.get("results", [])))
        texts = []
        for item in items:
            text = item.get("snippet", item.get("text", item.get("content", item.get("title", ""))))
            if text:
                texts.append(str(text))
        print(f"  [API Direct] {platform}: {len(texts)} signals")
        return texts
    except Exception as e:
        print(f"  [API Direct] {platform} error: {e}")
        return []

def fetch_all_social_signals(brand: str) -> dict:
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

def fetch_trustpilot_reviews(brand: str) -> list:
    if not OPENWEBNINJA_KEY:
        return []
    print(f"  [OpenWeb Ninja] Trustpilot: {brand}")
    try:
        headers = {"x-api-key": OPENWEBNINJA_KEY}
        data = safe_get("https://api.openwebninja.com/trustpilot-company-and-reviews/company-search",
                        params={"query": brand}, headers=headers)
        if not data: return []
        companies = data.get("data", [])
        if not companies: return []
        company_id = companies[0].get("id", "")
        if not company_id: return []
        reviews_data = safe_get("https://api.openwebninja.com/trustpilot-company-and-reviews/company-reviews",
                                params={"id": company_id, "page": 1}, headers=headers)
        if not reviews_data: return []
        reviews = reviews_data.get("data", {}).get("reviews", [])
        texts = [f"{r.get('review_title','')} {r.get('review_text','')}" for r in reviews if r.get("review_text")]
        print(f"  [OpenWeb Ninja] Trustpilot: {len(texts)} reviews")
        return texts
    except Exception as e:
        print(f"  [OpenWeb Ninja] Trustpilot error: {e}")
        return []

def fetch_amazon_reviews(brand: str, geo: str = "IN") -> list:
    if not OPENWEBNINJA_KEY:
        return []
    country_map = {"IN": "IN", "US": "US", "GB": "GB", "AU": "AU", "SG": "SG", "GLOBAL": "US"}
    country = country_map.get(geo, "IN")
    print(f"  [OpenWeb Ninja] Amazon: {brand} (country={country})")
    try:
        headers = {"x-api-key": OPENWEBNINJA_KEY}
        data = safe_get("https://api.openwebninja.com/realtime-amazon-data/product-search",
                        params={"query": brand, "country": country, "page": 1}, headers=headers)
        if not data: return []
        products = data.get("data", {}).get("products", [])
        if not products: return []
        asin = products[0].get("asin", "")
        if not asin: return []
        reviews_data = safe_get("https://api.openwebninja.com/realtime-amazon-data/product-reviews",
                                params={"asin": asin, "country": country, "page": 1}, headers=headers)
        if not reviews_data: return []
        reviews = reviews_data.get("data", {}).get("reviews", [])
        texts = [f"{r.get('title','')} {r.get('body','')}" for r in reviews if r.get("body")]
        print(f"  [OpenWeb Ninja] Amazon: {len(texts)} reviews")
        return texts
    except Exception as e:
        print(f"  [OpenWeb Ninja] Amazon error: {e}")
        return []

def fetch_news_mentions(brand: str, geo: str = "IN") -> list:
    if not OPENWEBNINJA_KEY:
        return []
    country_map = {"IN": "IN", "US": "US", "GB": "GB", "AU": "AU", "SG": "SG", "GLOBAL": "US"}
    country = country_map.get(geo, "IN")
    print(f"  [OpenWeb Ninja] News: {brand} (country={country})")
    try:
        headers = {"x-api-key": OPENWEBNINJA_KEY}
        data = safe_get("https://api.openwebninja.com/realtime-news-data/search",
                        params={"query": brand, "country": country, "language": "en", "page": 1}, headers=headers)
        if not data: return []
        articles = data.get("data", [])
        texts = [f"{a.get('title','')} {a.get('snippet','')}" for a in articles if a.get("title")]
        print(f"  [OpenWeb Ninja] News: {len(texts)} articles")
        return texts
    except Exception as e:
        print(f"  [OpenWeb Ninja] News error: {e}")
        return []

# ─── Google Play Store ─────────────────────────────────────────────────────────

def fetch_google_play_reviews(brand: str, geo: str = "IN") -> list:
    print(f"  [Google Play] Fetching: {brand}")
    country_map = {"IN": "in", "US": "us", "GB": "gb", "AU": "au", "SG": "sg", "GLOBAL": "us"}
    country = country_map.get(geo, "in")
    try:
        from google_play_scraper import search, reviews as gplay_reviews, Sort
        results = search(brand, lang="en", country=country, n_hits=3)
        if not results: return []
        app_id = results[0].get("appId", "")
        if not app_id: return []
        result, _ = gplay_reviews(app_id, lang="en", country=country, sort=Sort.NEWEST, count=30)
        texts = [r.get("content", "") for r in result if r.get("content")]
        print(f"  [Google Play] {brand}: {len(texts)} reviews (app: {app_id})")
        return texts
    except ImportError:
        print("  [Google Play] Not installed. Run: pip install google-play-scraper")
        return []
    except Exception as e:
        print(f"  [Google Play] Error: {e}")
        return []

# ─── Apple App Store ───────────────────────────────────────────────────────────

def fetch_app_store_reviews(brand: str, geo: str = "IN") -> list:
    print(f"  [App Store] Fetching: {brand}")
    country_map = {"IN": "in", "US": "us", "GB": "gb", "AU": "au", "SG": "sg", "GLOBAL": "us"}
    country = country_map.get(geo, "in")
    try:
        data = safe_get("https://itunes.apple.com/search",
                        params={"term": brand, "country": country, "media": "software", "limit": 5})
        if not data or not data.get("results"): return []
        app_id = data["results"][0].get("trackId", "")
        if not app_id: return []
        reviews_data = safe_get(f"https://itunes.apple.com/{country}/rss/customerreviews/id={app_id}/sortBy=mostRecent/json")
        if not reviews_data: return []
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

# ─── Google News RSS ───────────────────────────────────────────────────────────

def fetch_google_alerts_rss(brand: str, geo: str = "IN") -> list:
    print(f"  [Google News RSS] Fetching: {brand}")
    country_map = {"IN": "IN:en", "US": "US:en", "GB": "GB:en", "AU": "AU:en", "SG": "SG:en", "GLOBAL": "US:en"}
    ceid = country_map.get(geo, "IN:en")
    gl = geo if geo != "GLOBAL" else "US"
    try:
        query = brand.replace(" ", "+")
        rss_url = f"https://news.google.com/rss/search?q={query}&hl=en&gl={gl}&ceid={ceid}"
        feed = feedparser.parse(rss_url)
        texts = []
        for entry in feed.entries[:20]:
            title = entry.get("title", "")
            summary = entry.get("summary", "")
            if title:
                texts.append(f"{title} {summary}")
        print(f"  [Google News RSS] {brand}: {len(texts)} news items")
        return texts
    except Exception as e:
        print(f"  [Google News RSS] Error: {e}")
        return []

# ─── IQ KPI Classifier v3 — full sub-bucket architecture ──────────────────────

def compute_iq_kpis(brand, trends_awareness, trends_consideration, social_signals,
                    trustpilot_texts, amazon_texts, news_texts, play_texts, appstore_texts, alerts_texts):

    all_texts = (
        social_signals.get("twitter", []) + social_signals.get("instagram", []) +
        social_signals.get("facebook", []) + social_signals.get("reddit", []) +
        social_signals.get("tiktok", []) + social_signals.get("youtube", []) +
        social_signals.get("web", []) + trustpilot_texts + amazon_texts +
        news_texts + play_texts + appstore_texts + alerts_texts
    )
    review_texts = trustpilot_texts + amazon_texts + play_texts + appstore_texts
    social_texts = (
        social_signals.get("twitter", []) + social_signals.get("instagram", []) +
        social_signals.get("facebook", []) + social_signals.get("reddit", []) +
        social_signals.get("tiktok", [])
    )
    news_and_alerts = news_texts + alerts_texts

    # ── AWARENESS — three separate indices ──────────────────────────────────────
    # Searched = Google Trends brand search share (spontaneous recall proxy)
    searched_score = round(clamp(trends_awareness["score"], 0, 100))

    # Found = web mention volume (aided discovery proxy)
    web_texts = social_signals.get("web", [])
    found_score = round(clamp(len(web_texts) * 3, 0, 100))

    # Shown = social post volume across all platforms (feed presence proxy)
    social_post_count = sum(len(v) for platform, v in social_signals.items() if platform != "web")
    shown_score = round(clamp(social_post_count * 1.5, 0, 100))

    # Combined awareness for backward compatibility
    social_mention_count = sum(len(v) for v in social_signals.values())
    awareness_score = round(clamp(
        searched_score * 0.5 + found_score * 0.35 + shown_score * 0.15,
        0, 100
    ))

    # ── CONSIDERATION — proximity-filtered sub-indices ───────────────────────────
    consideration_texts = (
        social_signals.get("twitter", []) +
        social_signals.get("reddit", []) +
        social_signals.get("web", [])
    )

    comparing_signals = [t for t in consideration_texts if
        proximity_match(t, brand, ["vs", "versus", "or ", "better than", "worse than", "alternative", "compare", "which one", "difference between"])]
    trialling_signals = [t for t in consideration_texts if
        proximity_match(t, brand, ["tried", "testing", "sample", "first time", "just bought", "just ordered", "first purchase", "gave it a try", "trying out"])]
    interested_signals = [t for t in consideration_texts if
        proximity_match(t, brand, ["want to try", "thinking of", "planning to buy", "should i", "worth it", "is it good", "heard about", "considering"])]

    total_consideration_signals = max(len(comparing_signals) + len(trialling_signals) + len(interested_signals), 1)
    comparing_score  = round(clamp(len(comparing_signals)  / total_consideration_signals * 100, 0, 100))
    trialling_score  = round(clamp(len(trialling_signals)  / total_consideration_signals * 100, 0, 100))
    interested_score = round(clamp(len(interested_signals) / total_consideration_signals * 100, 0, 100))

    intent_total = len(comparing_signals) + len(trialling_signals) + len(interested_signals)
    intent_score = clamp(intent_total * 3, 0, 40)
    consideration_score = round(clamp(trends_consideration["score"] * 0.6 + intent_score * 0.4, 0, 100))

    # ── USAGE — three sub-indices ────────────────────────────────────────────────
    all_usage = review_texts + [t for t in social_texts if any(w in t.lower() for w in list(USAGE_SIGNALS))]

    repeat_signals   = [t for t in all_usage if any(w in t.lower() for w in
        ["repurchase", "buy again", "reorder", "daily", "weekly", "regularly",
         "always buy", "loyal", "subscription", "habit", "again and again"])]
    switcher_signals = [t for t in all_usage if any(w in t.lower() for w in
        ["switched to", "moved to", "changed from", "used to use",
         "better than my old", "left for", "replaced", "from competitor"])]
    lost_signals     = [t for t in all_usage if any(w in t.lower() for w in
        ["stopped using", "returned", "cancelled", "last time", "never again",
         "deleted", "unsubscribed", "gave up", "not buying again", "wont buy"])]

    total_usage_classified = max(len(repeat_signals) + len(lost_signals), 1)
    repeat_score   = round(clamp(len(repeat_signals)   / total_usage_classified * 100, 0, 100))
    lost_score     = round(clamp(len(lost_signals)     / total_usage_classified * 100, 0, 100))
    switcher_score = round(clamp(len(switcher_signals) / max(len(all_usage), 1) * 100, 0, 100))

    if not all_usage:
        usage_score = 0
        usage_confidence = "unexplained"
    else:
        sentiments_usage = [simple_sentiment(t) for t in all_usage]
        avg_s = sum(sentiments_usage) / len(sentiments_usage)
        # +10 baseline correction for review negativity bias (silent satisfied majority)
        usage_score = round(clamp(40 + avg_s * 35 + min(15, len(all_usage) / 3) + 10, 0, 100))
        variance_u = sum((s - avg_s) ** 2 for s in sentiments_usage) / len(sentiments_usage)
        usage_confidence = classify_confidence(len(all_usage), variance_u)

    # ── IMAGERY — positive / negative / net ──────────────────────────────────────
    if not all_texts:
        imagery_score = 40
        imagery_confidence = "external"
        imagery_pos_score = 40
        imagery_neg_score = 40
    else:
        pos_count = neg_count = 0
        for text in all_texts:
            words = set(re.findall(r'\b\w+\b', text.lower()))
            pos_count += len(words & POSITIVE_IMAGERY)
            neg_count += len(words & NEGATIVE_IMAGERY)
        total_img = pos_count + neg_count
        imagery_pos_score = round(clamp((pos_count / total_img) * 100, 0, 100)) if total_img > 0 else 50
        imagery_neg_score = round(clamp((neg_count / total_img) * 100, 0, 100)) if total_img > 0 else 50
        imagery_score = round(clamp((pos_count / total_img) * 80 + 10, 0, 100)) if total_img > 0 else 40
        imagery_confidence = classify_confidence(len(all_texts), 0.3)

    # ── BUZZ — praising / questioning / attacking ─────────────────────────────────
    buzz_texts = social_texts + news_and_alerts
    buzz_positive_keywords = ""
    buzz_negative_keywords = ""
    praising_score    = 0
    questioning_score = 0
    attacking_score   = 0

    if not buzz_texts:
        buzz_score = 0
        buzz_confidence = "unexplained"
    else:
        sentiments_buzz = [simple_sentiment(t) for t in buzz_texts]
        avg_s_buzz = sum(sentiments_buzz) / len(sentiments_buzz)
        buzz_score = round(clamp(avg_s_buzz * 100, -100, 100))
        variance_b = sum((s - avg_s_buzz) ** 2 for s in sentiments_buzz) / len(sentiments_buzz)
        buzz_confidence = classify_confidence(len(buzz_texts), variance_b)

        praising_texts    = [t for t, s in zip(buzz_texts, sentiments_buzz) if s > 0.3]
        questioning_texts = [t for t, s in zip(buzz_texts, sentiments_buzz) if -0.1 <= s <= 0.1]
        attacking_texts   = [t for t, s in zip(buzz_texts, sentiments_buzz) if s < -0.3]

        total_buzz_classified = max(len(praising_texts) + len(questioning_texts) + len(attacking_texts), 1)
        praising_score    = round(clamp(len(praising_texts)    / total_buzz_classified * 100, 0, 100))
        questioning_score = round(clamp(len(questioning_texts) / total_buzz_classified * 100, 0, 100))
        attacking_score   = round(clamp(len(attacking_texts)   / total_buzz_classified * 100, 0, 100))

        buzz_positive_keywords = extract_keywords(praising_texts)
        buzz_negative_keywords = extract_keywords(attacking_texts)

    total_sources = len([s for s in [
        trends_awareness["score"] > 0,
        len(social_signals.get("twitter", [])) > 0,
        len(social_signals.get("instagram", [])) > 0,
        len(social_signals.get("facebook", [])) > 0,
        len(social_signals.get("reddit", [])) > 0,
        len(social_signals.get("tiktok", [])) > 0,
        len(trustpilot_texts) > 0,
        len(amazon_texts) > 0,
        len(play_texts) > 0,
        len(appstore_texts) > 0,
        len(news_and_alerts) > 0,
    ] if s])

    return {
        "awareness": {
            "score": awareness_score, "zone": score_to_zone(awareness_score),
            "confidence": trends_awareness["confidence"],
            "source": f"Google Trends + Social ({social_mention_count} mentions) + Web",
            "sources_count": total_sources,
            "positive_keywords": "", "negative_keywords": "",
            "searched_score": searched_score,
            "found_score": found_score,
            "shown_score": shown_score,
            "sub_bucket_searched": searched_score,
            "sub_bucket_found": found_score,
            "sub_bucket_shown": shown_score,
        },
        "consideration": {
            "score": consideration_score, "zone": score_to_zone(consideration_score),
            "confidence": trends_consideration["confidence"],
            "source": f"Google Trends intent + {intent_total} proximity-filtered intent signals",
            "sources_count": total_sources,
            "positive_keywords": "", "negative_keywords": "",
            "searched_score": 0, "found_score": 0, "shown_score": 0,
            "sub_bucket_comparing": comparing_score,
            "sub_bucket_trialling": trialling_score,
            "sub_bucket_interested": interested_score,
        },
        "usage": {
            "score": usage_score, "zone": score_to_zone(usage_score),
            "confidence": usage_confidence,
            "source": f"Reviews + Social ({len(all_usage)} usage signals)",
            "sources_count": total_sources,
            "positive_keywords": "", "negative_keywords": "",
            "searched_score": 0, "found_score": 0, "shown_score": 0,
            "sub_bucket_repeat": repeat_score,
            "sub_bucket_switchers": switcher_score,
            "sub_bucket_lost": lost_score,
        },
        "imagery": {
            "score": imagery_score, "zone": score_to_zone(imagery_score),
            "confidence": imagery_confidence,
            "source": f"NLP attribute analysis over {len(all_texts)} signals",
            "sources_count": total_sources,
            "positive_keywords": "", "negative_keywords": "",
            "searched_score": 0, "found_score": 0, "shown_score": 0,
            "sub_bucket_searched": imagery_pos_score,
            "sub_bucket_found": imagery_neg_score,
            "sub_bucket_shown": 0,
        },
        "buzz": {
            "score": buzz_score, "zone": score_to_zone(buzz_score, is_buzz=True),
            "confidence": buzz_confidence,
            "source": f"Social + News sentiment ({len(buzz_texts)} signals)",
            "sources_count": total_sources,
            "positive_keywords": buzz_positive_keywords,
            "negative_keywords": buzz_negative_keywords,
            "searched_score": 0, "found_score": 0, "shown_score": 0,
            "sub_bucket_praising": praising_score,
            "sub_bucket_questioning": questioning_score,
            "sub_bucket_attacking": attacking_score,
        },
    }

# ─── Eye CX Classifier ─────────────────────────────────────────────────────────

def compute_eye_themes(brand, play_texts, appstore_texts, trustpilot_texts, amazon_texts, social_reddit):
    all_review_texts = play_texts + appstore_texts + trustpilot_texts + amazon_texts + social_reddit
    if not all_review_texts:
        return {}

    theme_texts = {theme: [] for theme in EYE_THEMES}
    for text in all_review_texts:
        theme = classify_eye_theme(text)
        theme_texts[theme].append(text)

    theme_results = {}
    for theme, texts in theme_texts.items():
        if not texts:
            continue
        sentiments = [simple_sentiment(t) for t in texts]
        avg_s = sum(sentiments) / len(sentiments)
        promoters  = sum(1 for s in sentiments if s > 0.3)
        detractors = sum(1 for s in sentiments if s < -0.3)
        total = len(sentiments)
        nps = round(((promoters - detractors) / total) * 100) if total > 0 else 0

        pos_texts = [t for t, s in zip(texts, sentiments) if s > 0.1]
        neg_texts = [t for t, s in zip(texts, sentiments) if s < -0.1]

        positive_keywords = extract_keywords(pos_texts)
        negative_keywords = extract_keywords(neg_texts)
        top_concern = ", ".join(negative_keywords.split(", ")[:3]) if negative_keywords else ""

        overall_sentiment = "positive" if avg_s > 0.1 else "negative" if avg_s < -0.1 else "neutral"
        dropout_rate = round((detractors / total) * 100, 1) if total > 0 else 0

        theme_results[theme] = {
            "nps_score": nps,
            "signal_count": total,
            "sentiment": overall_sentiment,
            "dropout_rate": dropout_rate,
            "top_concern": top_concern,
            "positive_keywords": positive_keywords,
            "negative_keywords": negative_keywords,
            "positive_signal_count": len(pos_texts),
            "negative_signal_count": len(neg_texts),
        }
        print(f"  [Eye] {theme}: NPS={nps}, signals={total} (+{len(pos_texts)}/-{len(neg_texts)}), sentiment={overall_sentiment}")

    return theme_results

# ─── Supabase writers ──────────────────────────────────────────────────────────

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

def write_kpi_snapshot(brand_id, competitor_id, kpi_name, score, zone, confidence,
                       source, snapshot_type, checkpoint, movement, sources_count=0,
                       positive_keywords="", negative_keywords="", kpi_data=None):
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
        "sources_count": sources_count,
        "last_updated": datetime.now(timezone.utc).isoformat(),
        "status": "pending_review",
        "positive_keywords": positive_keywords or None,
        "negative_keywords": negative_keywords or None,
    }
    # Write sub-bucket values from kpi_data if available
    if kpi_data:
        for field in [
            "sub_bucket_searched", "sub_bucket_found", "sub_bucket_shown",
            "sub_bucket_comparing", "sub_bucket_trialling", "sub_bucket_interested",
            "sub_bucket_repeat", "sub_bucket_switchers", "sub_bucket_lost",
            "sub_bucket_praising", "sub_bucket_questioning", "sub_bucket_attacking",
            "searched_score", "found_score", "shown_score",
        ]:
            if field in kpi_data:
                row[field] = kpi_data[field]
    try:
        supabase.table("kpi_snapshots").insert(row).execute()
        print(f"  [Supabase] {kpi_name}: {score} ({zone}) → pending_review ✅")
    except Exception as e:
        print(f"  [Supabase] Write error {kpi_name}: {e}")

def write_eye_audit(brand_id, user_id, theme_results):
    if not theme_results:
        print("  [Eye] No theme data to write.")
        return
    total_signals = sum(v["signal_count"] for v in theme_results.values())
    all_nps = [v["nps_score"] for v in theme_results.values()]
    overall_nps = round(sum(all_nps) / len(all_nps)) if all_nps else 0
    try:
        audit_res = supabase.table("cx_audits").insert({
            "brand_id": brand_id,
            "user_id": user_id,
            "audit_type": "secondary",
            "status": "pending_review",
            "audit_date": datetime.now(timezone.utc).isoformat(),
            "overall_cx_nps": overall_nps,
            "total_signals": total_signals,
            "benchmark": 45,
            "category_type": "LIHI",
        }).execute()
        audit_id = audit_res.data[0]["id"] if audit_res.data else None
        if not audit_id:
            print("  [Eye] Could not get audit ID.")
            return
        theme_rows = []
        for theme, data in theme_results.items():
            theme_rows.append({
                "audit_id": audit_id,
                "brand_id": brand_id,
                "theme": theme,
                "nps_score": data["nps_score"],
                "signal_count": data["signal_count"],
                "dropout_rate": data["dropout_rate"],
                "top_concern": data["top_concern"] or None,
                "sentiment": data["sentiment"],
                "confidence": "standard",
                "positive_keywords": data.get("positive_keywords") or None,
                "negative_keywords": data.get("negative_keywords") or None,
                "positive_signal_count": data.get("positive_signal_count", 0),
                "negative_signal_count": data.get("negative_signal_count", 0),
            })
        supabase.table("cx_theme_scores").insert(theme_rows).execute()
        print(f"  [Eye] Audit written → pending_review ✅ (overall NPS: {overall_nps}, {total_signals} signals)")
    except Exception as e:
        print(f"  [Eye] Write error: {e}")

# ─── Main scraper pipeline ─────────────────────────────────────────────────────

def run_scraper_for_brand(brand_id: str, brand_name: str, competitors: list,
                          user_id: str, scrape_iq: bool = True, scrape_eye: bool = True,
                          geo: str = "IN"):
    print(f"\n{'='*60}")
    print(f"Scraping: {brand_name} | {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"Products: {'IQ ✅' if scrape_iq else 'IQ ❌'} | {'Eye ✅' if scrape_eye else 'Eye ❌'} | Region: {geo}")
    print(f"{'='*60}")

    competitor_names = [c["name"] for c in competitors]

    if scrape_iq:
        trends_awareness = fetch_google_trends_awareness(brand_name, competitor_names, geo)
        time.sleep(60)
        trends_consideration = fetch_google_trends_consideration(brand_name, geo)
        time.sleep(60)
    else:
        trends_awareness    = {"score": 0, "source": "Skipped", "confidence": "unexplained"}
        trends_consideration = {"score": 0, "source": "Skipped", "confidence": "unexplained"}

    print(f"\n  [API Direct] Fetching all platforms...")
    social_signals = fetch_all_social_signals(brand_name)
    time.sleep(2)

    print(f"\n  [OpenWeb Ninja] Fetching reviews and news...")
    trustpilot_texts = fetch_trustpilot_reviews(brand_name)
    time.sleep(2)
    amazon_texts = fetch_amazon_reviews(brand_name, geo)
    time.sleep(2)
    news_texts = fetch_news_mentions(brand_name, geo)
    time.sleep(2)

    play_texts     = fetch_google_play_reviews(brand_name, geo)
    time.sleep(2)
    appstore_texts = fetch_app_store_reviews(brand_name, geo)
    time.sleep(2)
    alerts_texts   = fetch_google_alerts_rss(brand_name, geo)
    time.sleep(2)

    if scrape_iq:
        print(f"\n  [IQ Classifier v3] Computing sub-bucket scores...")
        kpis = compute_iq_kpis(
            brand=brand_name,
            trends_awareness=trends_awareness,
            trends_consideration=trends_consideration,
            social_signals=social_signals,
            trustpilot_texts=trustpilot_texts,
            amazon_texts=amazon_texts,
            news_texts=news_texts,
            play_texts=play_texts,
            appstore_texts=appstore_texts,
            alerts_texts=alerts_texts,
        )
        print(f"\n  [Supabase] Writing IQ snapshots...")
        for kpi_name, data in kpis.items():
            prev = get_previous_score(brand_id, kpi_name)
            movement = round(data["score"] - prev, 1) if prev is not None else None
            write_kpi_snapshot(
                brand_id=brand_id, competitor_id=None, kpi_name=kpi_name,
                score=data["score"], zone=data["zone"], confidence=data["confidence"],
                source=data["source"], snapshot_type="brand_level", checkpoint="current",
                movement=movement, sources_count=data["sources_count"],
                positive_keywords=data.get("positive_keywords", ""),
                negative_keywords=data.get("negative_keywords", ""),
                kpi_data=data,
            )

        print(f"\n  Scraping {len(competitors)} competitors...")
        for comp in competitors:
            print(f"\n  → {comp['name']}")
            comp_trends = fetch_google_trends_awareness(comp["name"], [brand_name], geo)
            time.sleep(60)
            comp_social = fetch_all_social_signals(comp["name"])
            time.sleep(2)
            comp_mention_count = sum(len(v) for v in comp_social.values())
            comp_awareness_score = round(clamp(
                comp_trends["score"] * 0.6 + clamp(comp_mention_count * 2, 0, 40) * 0.4, 0, 100))
            comp_social_texts = (
                comp_social.get("twitter", []) + comp_social.get("instagram", []) +
                comp_social.get("facebook", []) + comp_social.get("reddit", []) +
                comp_social.get("tiktok", [])
            )
            if comp_social_texts:
                sentiments = [simple_sentiment(t) for t in comp_social_texts]
                avg_s = sum(sentiments) / len(sentiments)
                comp_buzz_score = round(clamp(avg_s * 100, -100, 100))
                variance = sum((s - avg_s) ** 2 for s in sentiments) / len(sentiments)
                comp_buzz_conf = classify_confidence(len(comp_social_texts), variance)
            else:
                comp_buzz_score = 0
                comp_buzz_conf  = "unexplained"
            for kpi_name, score, zone, conf in [
                ("awareness", comp_awareness_score, score_to_zone(comp_awareness_score), comp_trends["confidence"]),
                ("buzz",      comp_buzz_score,      score_to_zone(comp_buzz_score, True), comp_buzz_conf),
            ]:
                prev = get_previous_score(brand_id, kpi_name, comp["id"])
                movement = round(score - prev, 1) if prev is not None else None
                write_kpi_snapshot(
                    brand_id=brand_id, competitor_id=comp["id"], kpi_name=kpi_name,
                    score=score, zone=zone, confidence=conf, source="Google Trends + Social",
                    snapshot_type="brand_level", checkpoint="current", movement=movement, sources_count=0,
                )

    if scrape_eye:
        print(f"\n  [Eye Classifier] Computing CX theme scores...")
        theme_results = compute_eye_themes(
            brand=brand_name,
            play_texts=play_texts,
            appstore_texts=appstore_texts,
            trustpilot_texts=trustpilot_texts,
            amazon_texts=amazon_texts,
            social_reddit=social_signals.get("reddit", []),
        )
        print(f"\n  [Supabase] Writing Eye audit...")
        write_eye_audit(brand_id=brand_id, user_id=user_id, theme_results=theme_results)

    print(f"\n  ✅ {brand_name} complete. Go to /admin → Data approval to review and publish.")


def main():
    print("Solomon Scraper v3 starting...")
    print(f"Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print(f"API Direct:    {'✅ configured' if API_DIRECT_KEY else '❌ missing'}")
    print(f"OpenWeb Ninja: {'✅ configured' if OPENWEBNINJA_KEY else '❌ missing'}")
    print(f"YouTube API:   {'✅ configured' if YOUTUBE_API_KEY else '⚠️  not set'}")

    brands_result = supabase.table("brands").select("id, brand_name, category, user_id, geo, category_type").execute()
    if not brands_result.data:
        print("No brands found. Exiting.")
        return

    for brand in brands_result.data:
        brand_id      = brand["id"]
        brand_name    = brand["brand_name"]
        user_id       = brand.get("user_id", "")
        geo           = brand.get("geo", "IN")
        category_type = brand.get("category_type", "LIHI")

        orders = supabase.table("orders")\
            .select("product")\
            .eq("user_id", user_id)\
            .eq("status", "paid")\
            .execute()

        paid_products = [o["product"] for o in (orders.data or [])]
        has_iq  = "iq"  in paid_products
        has_eye = "eye" in paid_products

        print(f"\n  [{brand_name}] Products: IQ={'✅' if has_iq else '❌'} | Eye={'✅' if has_eye else '❌'} | Region: {geo} | Type: {category_type}")

        if not has_iq and not has_eye:
            print(f"  ⚠️  {brand_name} has no paid products — skipping.")
            continue

        # Fetch all 8 competitors
        comps = supabase.table("competitors").select("id, name").eq("brand_id", brand_id).execute()
        competitors = comps.data or []

        run_scraper_for_brand(
            brand_id=brand_id,
            brand_name=brand_name,
            competitors=competitors,
            user_id=user_id,
            scrape_iq=has_iq,
            scrape_eye=has_eye,
            geo=geo,
        )
        time.sleep(5)

    print("\n✅ Scraper complete. Go to kingsolomonhq.com/admin → Data approval.")

if __name__ == "__main__":
    main()