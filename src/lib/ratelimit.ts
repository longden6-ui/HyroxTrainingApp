// Rate limiting for public predictor [T-09, US-01 criterion 5]
// Prevent scraping and enumeration of the predictor endpoint

const RATE_LIMIT_CONFIG = {
  // Per-IP limit: max 30 predictions per hour
  perIp: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
  // Per-session limit: max 10 predictions per minute
  perSession: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
};

// In-memory store for rate limit tracking
// In production, use Redis or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers.get('x-real-ip') || 'unknown';
}

function getSessionId(headers: Headers): string {
  // In a real app, extract from session cookie or auth token
  // For now, use a combination of IP and User-Agent
  const ip = getClientIp(headers);
  const userAgent = headers.get('user-agent') || '';
  return `${ip}:${userAgent}`.substring(0, 100);
}

function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // Create new window
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false; // Rate limit exceeded
  }

  entry.count++;
  return true;
}

export function validateRateLimit(headers: Headers): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const clientIp = getClientIp(headers);
  const sessionId = getSessionId(headers);

  // Check per-IP limit
  const ipEntry = rateLimitStore.get(clientIp);
  const ipRemaining = Math.max(
    0,
    RATE_LIMIT_CONFIG.perIp.maxRequests - (ipEntry?.count || 0),
  );

  // Check per-session limit
  const sessionEntry = rateLimitStore.get(sessionId);
  const sessionRemaining = Math.max(
    0,
    RATE_LIMIT_CONFIG.perSession.maxRequests - (sessionEntry?.count || 0),
  );

  // Both must pass
  const ipPassed = checkRateLimit(
    clientIp,
    RATE_LIMIT_CONFIG.perIp.maxRequests,
    RATE_LIMIT_CONFIG.perIp.windowMs,
  );

  const sessionPassed = checkRateLimit(
    sessionId,
    RATE_LIMIT_CONFIG.perSession.maxRequests,
    RATE_LIMIT_CONFIG.perSession.windowMs,
  );

  const allowed = ipPassed && sessionPassed;
  const remaining = Math.min(ipRemaining, sessionRemaining);
  const resetTime = Math.max(
    ipEntry?.resetTime || Date.now(),
    sessionEntry?.resetTime || Date.now(),
  );

  return { allowed, remaining, resetTime };
}

// Cleanup old entries every hour to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);
