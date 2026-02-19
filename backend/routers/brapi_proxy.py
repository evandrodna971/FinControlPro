import time
from fastapi import APIRouter, HTTPException, Request, Response
import httpx
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)

# Fallback token if env not set
# Fallback token if env not set
BRAPI_TOKEN = os.getenv("BRAPI_TOKEN", os.getenv("VITE_BRAPI_TOKEN", "vaojuu2uNboDzmhHXP6Sjg"))
BASE_URL = "https://brapi.dev/api"

# Simple In-Memory Cache
# Key: Query string (sorted), Value: {timestamp: float, data: bytes, headers: dict, status: int}
RESPONSE_CACHE = {}

# Cache TTL in seconds
TTL_LIST = 900   # 15 minutes for lists (quote/list)
TTL_HISTORY = 1800 # 30 minutes for charts (quote/ticker)

def get_cache_key(path: str, params: dict) -> str:
    # Sort params to ensure consistency
    sorted_params = sorted(params.items())
    return f"{path}?{sorted_params}"

def clean_expired_cache():
    # Basic cleanup (could be moved to a background task in production)
    now = time.time()
    keys_to_delete = []
    for k, v in RESPONSE_CACHE.items():
        # Default to shorter TTL if unknown
        ttl = TTL_HISTORY if 'quote/' in k and 'list' not in k else TTL_LIST
        if now - v['timestamp'] > ttl:
            keys_to_delete.append(k)
    
    for k in keys_to_delete:
        del RESPONSE_CACHE[k]

@router.get("/api/proxy/brapi/{path:path}")
async def proxy_brapi(path: str, request: Request):
    """
    Proxy requests to Brapi API to avoid CORS and rate limits issues on frontend.
    Forwards the request to: https://brapi.dev/api/{path}?token={BRAPI_TOKEN}&{query_params}
    Includes In-Memory Caching.
    """
    # 0. Cleanup (lazy)
    if len(RESPONSE_CACHE) > 100: # Simple limit to avoid memory leak
        clean_expired_cache()

    # Get query params from original request
    params = dict(request.query_params)
    
    # Ensure token is present (server-side injection)
    if "token" not in params:
        params["token"] = BRAPI_TOKEN

    # 1. Check Cache
    cache_key = get_cache_key(path, params)
    now = time.time()
    
    # Determine TTL based on endpoint
    ttl = TTL_LIST
    if 'quote' in path and 'list' not in path:
        # History/Quote specific
        ttl = TTL_HISTORY

    if cache_key in RESPONSE_CACHE:
        cached = RESPONSE_CACHE[cache_key]
        if now - cached['timestamp'] < ttl:
            logger.info(f"CACHE HIT: {cache_key}")
            return Response(
                content=cached['data'],
                status_code=cached['status'],
                headers=cached['headers'],
                media_type=cached['headers'].get("content-type")
            )

    # 2. Fetch from API (Cache Miss)
    url = f"{BASE_URL}/{path}"
    
    try:
        async with httpx.AsyncClient() as client:
            # Forward the request
            # We use match_content=True to get raw bytes similar to a reverse proxy
            brapi_response = await client.get(url, params=params, timeout=10.0)
            
            # Return the response with the original status code
            # We exclude 'content-encoding' and 'content-length' headers to let FastAPI handle them
            headers = {
                k: v for k, v in brapi_response.headers.items() 
                if k.lower() not in ["content-encoding", "content-length", "transfer-encoding"]
            }
            
            # 3. Store in Cache (only if success)
            if brapi_response.status_code == 200:
                RESPONSE_CACHE[cache_key] = {
                    'timestamp': now,
                    'data': brapi_response.content,
                    'status': brapi_response.status_code,
                    'headers': headers
                }
                logger.info(f"CACHE STORE: {cache_key}")

            return Response(
                content=brapi_response.content,
                status_code=brapi_response.status_code,
                headers=headers,
                media_type=brapi_response.headers.get("content-type")
            )

    except httpx.RequestError as exc:
        logger.error(f"An error occurred while requesting {exc.request.url!r}.")
        raise HTTPException(status_code=502, detail="Error communicating with Brapi API")
    except Exception as e:
        logger.error(f"Proxy error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error during proxy")
