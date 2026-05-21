import time
from fastapi import Request, HTTPException, status

# In-memory dictionary for basic rate limiting
# Format: { "ip_address": [timestamp1, timestamp2, ...] }
RATE_LIMIT_CACHE = {}

# Allow 10 requests per minute
RATE_LIMIT_MAX_REQUESTS = 10
RATE_LIMIT_WINDOW_SECONDS = 60

async def rate_limiter(request: Request):
    """
    Basic dependency to enforce rate limiting by IP address.
    """
    client_ip = request.client.host if request.client else "unknown"
    
    current_time = time.time()
    
    if client_ip not in RATE_LIMIT_CACHE:
        RATE_LIMIT_CACHE[client_ip] = []
        
    # Remove timestamps older than the window
    RATE_LIMIT_CACHE[client_ip] = [
        timestamp for timestamp in RATE_LIMIT_CACHE[client_ip] 
        if current_time - timestamp < RATE_LIMIT_WINDOW_SECONDS
    ]
    
    if len(RATE_LIMIT_CACHE[client_ip]) >= RATE_LIMIT_MAX_REQUESTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Try again later."
        )
        
    RATE_LIMIT_CACHE[client_ip].append(current_time)
