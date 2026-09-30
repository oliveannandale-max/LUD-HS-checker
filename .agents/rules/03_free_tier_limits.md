# Google AI Studio Free Tier System Constraints & Rate Limits

## Model Target
- **Primary Model:** `gemini-2.5-flash` / `gemini-2.5-flash-lite` (Google AI Studio Free Tier)
- **Cost Allocation:** $0.00 / Zero-Cost Operational Model

---

## 1. Hard Quota Constraints (Free Tier)

| Metric | Free Tier Limit | Production Safety Buffer |
| :--- | :--- | :--- |
| **Requests Per Minute (RPM)** | 15 RPM | **12 RPM** (1 call every 5.0 seconds) |
| **Requests Per Day (RPD)** | 1,500 RPD | **1,200 RPD** |
| **Tokens Per Minute (TPM)** | 1,000,000 TPM | ~600,000 TPM |
| **Max Payload Size** | 20 MB / request | Recommended < 4 MB for images |

---

## 2. Rate-Limiting & Batch Queue Protocol
To prevent `429 RESOURCE_EXHAUSTED` errors during multi-page document or batch invoice processing:

1. **Client-Side Throttling:**
   - Enforce an asynchronous queue delay of minimum **4,200 ms** between consecutive API calls.
   - For batch jobs of `N` items, estimated duration = `N * 4.5 seconds`.
2. **Exponential Backoff Strategy:**
   - On `429 Too Many Requests`:
     - Attempt 1: Wait 5 seconds
     - Attempt 2: Wait 12 seconds
     - Attempt 3: Wait 30 seconds
     - Max retries: 3 attempts before flagging line item as requiring manual review.
3. **Image Optimization:**
   - Commercial invoice images, handwritten declarations, and bill of lading scans should be scaled down to a maximum dimension of 1568px before transmission.
   - Compression: JPEG quality 85% or WebP, typically yielding 200KB - 800KB images. This preserves razor-sharp OCR readability for handwriting while using minimal vision tokens.
4. **Caching & Deduplication:**
   - Pre-check repetitive SKU/product descriptions against `cache/sars_tariff_schedule1.json` before triggering a vision API call.
   - If an identical product description was resolved within the current session, reuse the cached classification.
