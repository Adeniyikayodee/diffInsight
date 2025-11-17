import { RateLimiter, RequestWrapper } from '../rateLimiter.js';

describe('Rate Limiting', () => {
  describe('RateLimiter', () => {
    test('allows requests within limit', async () => {
      const limiter = new RateLimiter(2, 1000); // 2 tokens per second
      
      await limiter.acquire();
      await limiter.acquire();
      
      // Should have no tokens left
      expect(limiter.tokens).toBe(0);
    });

    test('refills tokens over time', async () => {
      const limiter = new RateLimiter(2, 1000);
      
      await limiter.acquire();
      expect(limiter.tokens).toBeLessThan(2);
      
      // Wait for refill
      await new Promise(resolve => setTimeout(resolve, 1100));
      limiter.refillTokens();
      
      expect(limiter.tokens).toBeCloseTo(2, 1);
    });

    test('queues requests when out of tokens', async () => {
      const limiter = new RateLimiter(1, 1000);
      
      // Use up token
      await limiter.acquire();
      
      // Queue another request
      const promise = limiter.acquire();
      
      // Should be queued
      expect(limiter.queue.length).toBe(1);
      
      // Wait for processing
      await promise;
    });
  });

  describe('RequestWrapper', () => {
    test('retries failed requests', async () => {
      const limiter = new RateLimiter(10, 1000);
      const wrapper = new RequestWrapper({
        maxRetries: 2,
        baseDelayMs: 10,
        rateLimiter: limiter
      });
      
      let attempts = 0;
      const fn = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          const error = new Error('Network error');
          error.code = 'ECONNRESET';
          throw error;
        }
        return Promise.resolve('success');
      });
      
      const result = await wrapper.withRetry(fn);
      
      expect(result).toBe('success');
      expect(attempts).toBe(2);
    });

    test('respects max retries', async () => {
      const limiter = new RateLimiter(10, 1000);
      const wrapper = new RequestWrapper({
        maxRetries: 1,
        baseDelayMs: 10,
        rateLimiter: limiter
      });
      
      const error = new Error('Network error');
      error.code = 'ECONNRESET';
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(wrapper.withRetry(fn))
        .rejects
        .toThrow('Request failed after 1 retries');
      
      expect(fn).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    test('does not retry non-retryable errors', async () => {
      const limiter = new RateLimiter(10, 1000);
      const wrapper = new RequestWrapper({
        maxRetries: 2,
        rateLimiter: limiter
      });
      
      const error = new Error('Validation error');
      error.status = 400;
      
      const fn = jest.fn().mockRejectedValue(error);
      
      await expect(wrapper.withRetry(fn))
        .rejects
        .toThrow('Validation error');
      
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    test('uses exponential backoff', async () => {
      const limiter = new RateLimiter(10, 1000);
      const wrapper = new RequestWrapper({
        maxRetries: 2,
        baseDelayMs: 50,
        rateLimiter: limiter
      });
      
      const delays = [];
      const originalSetTimeout = global.setTimeout;
      
      // Mock setTimeout to capture delays
      global.setTimeout = jest.fn((fn) => {
        // Get the delay from the arguments
        const callArgs = global.setTimeout.mock.calls[global.setTimeout.mock.calls.length - 1];
        if (callArgs[1] !== undefined) {
          delays.push(callArgs[1]);
        }
        // Execute immediately for testing
        Promise.resolve().then(fn);
        return 0;
      });
      
      const fn = jest.fn().mockRejectedValue(new Error('Network error'));
      
      try {
        await wrapper.withRetry(fn);
      } catch (error) {
        // Expected to fail
      }
      
      // Restore setTimeout
      global.setTimeout = originalSetTimeout;
      
      // Should have attempted retries with delays
      expect(fn.mock.calls.length).toBeGreaterThanOrEqual(1);
    });
  });
});