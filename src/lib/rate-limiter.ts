/**
 * Simple in-memory rate limiter for API calls
 * Prevents excessive calls to external APIs
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  
  /**
   * Check if an operation is rate limited
   * @param key - Unique identifier for the operation
   * @param maxRequests - Maximum requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns true if allowed, false if rate limited
   */
  isAllowed(key: string, maxRequests: number = 60, windowMs: number = 60000): boolean {
    const now = Date.now();
    const entry = this.limits.get(key);
    
    if (!entry || now >= entry.resetTime) {
      // Reset window
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }
    
    if (entry.count >= maxRequests) {
      return false; // Rate limited
    }
    
    entry.count++;
    return true;
  }
  
  /**
   * Get remaining requests for a key
   */
  getRemaining(key: string, maxRequests: number = 60): number {
    const entry = this.limits.get(key);
    if (!entry || Date.now() >= entry.resetTime) {
      return maxRequests;
    }
    return Math.max(0, maxRequests - entry.count);
  }
  
  /**
   * Clear old entries to prevent memory leaks
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup old entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 5 * 60 * 1000);
}