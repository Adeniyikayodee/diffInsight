/**
 * Simple token bucket rate limiter
 */
export class RateLimiter {
  /**
   * @param {number} tokensPerInterval - Number of tokens per interval
   * @param {number} intervalMs - Interval in milliseconds
   */
  constructor(tokensPerInterval, intervalMs) {
    this.tokensPerInterval = tokensPerInterval;
    this.intervalMs = intervalMs;
    
    this.tokens = tokensPerInterval;
    this.lastRefill = Date.now();
    
    // Queue for pending requests
    this.queue = [];
    this.processing = false;
  }
  
  /**
   * Refills tokens based on elapsed time
   * @private
   */
  refillTokens() {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const refillAmount = (timePassed / this.intervalMs) * this.tokensPerInterval;
    
    this.tokens = Math.min(
      this.tokensPerInterval,
      this.tokens + refillAmount
    );
    
    this.lastRefill = now;
  }
  
  /**
   * Processes queued requests
   * @private
   */
  async processQueue() {
    if (this.processing) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      this.refillTokens();
      
      if (this.tokens < 1) {
        // Wait for next refill
        await new Promise(resolve => 
          setTimeout(resolve, this.intervalMs / this.tokensPerInterval)
        );
        continue;
      }
      
      const { resolve: resolveRequest } = this.queue.shift();
      this.tokens -= 1;
      resolveRequest();
    }
    
    this.processing = false;
  }
  
  /**
   * Acquires permission to make a request
   * @returns {Promise<void>}
   */
  async acquire() {
    return new Promise(resolve => {
      this.queue.push({ resolve });
      this.processQueue();
    });
  }
}

/**
 * Wraps API calls with rate limiting and retries
 */
export class RequestWrapper {
  /**
   * @param {Object} config
   * @param {number} config.maxRetries - Maximum number of retries
   * @param {number} config.baseDelayMs - Base delay between retries
   * @param {RateLimiter} config.rateLimiter - Rate limiter instance
   */
  constructor({
    maxRetries = 3,
    baseDelayMs = 1000,
    rateLimiter
  } = {}) {
    this.maxRetries = maxRetries;
    this.baseDelayMs = baseDelayMs;
    this.rateLimiter = rateLimiter;
  }
  
  /**
   * Wraps an async function with retry logic
   * @template T
   * @param {function(): Promise<T>} fn - Function to wrap
   * @returns {Promise<T>}
   */
  async withRetry(fn) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Wait for rate limit token
        await this.rateLimiter.acquire();
        
        // Execute request
        return await fn();
        
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (!this.isRetryable(error)) {
          throw error;
        }
        
        // Last attempt failed
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Wait before retry
        const delayMs = this.calculateDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error(
      `Request failed after ${this.maxRetries} retries. Last error: ${lastError.message}`
    );
  }
  
  /**
   * Checks if an error is retryable
   * @private
   */
  isRetryable(error) {
    // Retry on network errors
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
      return true;
    }
    
    // Retry on rate limits
    if (error.status === 429) {
      return true;
    }
    
    // Retry on server errors
    if (error.status >= 500 && error.status < 600) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Calculates delay before retry using exponential backoff
   * @private
   */
  calculateDelay(attempt) {
    const jitter = Math.random() * 0.1 + 0.9; // 0.9-1.0
    return Math.min(
      this.baseDelayMs * Math.pow(2, attempt) * jitter,
      30000 // Max 30 seconds
    );
  }
}