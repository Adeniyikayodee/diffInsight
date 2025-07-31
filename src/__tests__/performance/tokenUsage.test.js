import { TokenUsageTracker } from '../../config/settings.js';
import { RateLimiter } from '../../config/rateLimiter.js';

describe('Performance Tests', () => {
  describe('Token Usage', () => {
    test('handles high volume of requests', async () => {
      const tracker = new TokenUsageTracker(10000);
      const startTime = Date.now();
      
      // Simulate 100 small requests
      for (let i = 0; i < 100; i++) {
        tracker.recordUsage(50);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should process quickly
      expect(duration).toBeLessThan(1000);
      
      const stats = tracker.getStats();
      expect(stats.used).toBe(5000);
      expect(stats.remaining).toBe(5000);
    });

    test('maintains rate limit under load', async () => {
      const limiter = new RateLimiter(10, 1000); // 10 requests per second
      const startTime = Date.now();
      
      // Try to make 20 requests in parallel
      const promises = Array(20).fill().map(() => limiter.acquire());
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should take at least 1 second due to rate limiting
      expect(duration).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Memory Usage', () => {
    test('maintains stable memory usage', async () => {
      const tracker = new TokenUsageTracker(1000000);
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate many requests
      for (let i = 0; i < 1000; i++) {
        tracker.recordUsage(100);
        
        // Clear old requests periodically
        if (i % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryDiff = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryDiff).toBeLessThan(5 * 1024 * 1024); // 5MB
    });
  });

  describe('Concurrent Operations', () => {
    test('handles parallel requests efficiently', async () => {
      const limiter = new RateLimiter(5, 1000);
      const startTime = Date.now();
      
      // Make 3 batches of 5 requests each
      const batches = Array(3).fill().map(() => 
        Promise.all(Array(5).fill().map(() => limiter.acquire()))
      );
      
      await Promise.all(batches);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should take about 2 seconds (3 batches at 5 req/sec)
      expect(duration).toBeGreaterThanOrEqual(2000);
      expect(duration).toBeLessThan(3000);
    });
  });
});