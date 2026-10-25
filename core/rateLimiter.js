/**
 * In-Memory Sliding Window Rate Limiter
 * 
 * Provides rate limiting and abuse protection with zero external dependencies.
 * Tracks requests per client IP within a configurable sliding window.
 */

function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 10 * 60 * 1000; // Default: 10 minutes
  const maxRequests = options.max || 25; // Default: 25 requests per window
  const message = options.message || 'Too many requests. Please wait a few moments before trying again.';

  const ipHits = new Map();

  // Periodic cleanup of stale entries every 5 minutes
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipHits.entries()) {
      if (now - record.resetTime > windowMs) {
        ipHits.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref(); // Prevent blocking process exit in tests
  }

  function rateLimiterMiddleware(req, res, next) {
    // Determine client IP (handles x-forwarded-for or standard socket address)
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : (req.socket.remoteAddress || '127.0.0.1');

    const now = Date.now();
    let record = ipHits.get(clientIp);

    if (!record || now - record.resetTime > windowMs) {
      record = {
        count: 1,
        resetTime: now
      };
      ipHits.set(clientIp, record);
    } else {
      record.count += 1;
    }

    // Set standard rate limit headers
    const remaining = Math.max(0, maxRequests - record.count);
    const resetSeconds = Math.ceil((record.resetTime + windowMs - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', resetSeconds);
      return res.status(429).json({
        success: false,
        error: message
      });
    }

    next();
  }

  rateLimiterMiddleware.reset = function() {
    ipHits.clear();
  };

  rateLimiterMiddleware.getHits = function(ip) {
    return ipHits.get(ip);
  };

  return rateLimiterMiddleware;
}

module.exports = { createRateLimiter };
