import { loadConfig, TokenUsageTracker, sanitizeOutput } from '../settings.js';
import * as core from '@actions/core';

// Mock @actions/core
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  error: jest.fn()
}));

describe('Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    core.getInput.mockImplementation((name) => {
      switch (name) {
        case 'github-token':
          return 'mock-token';
        case 'openai-api-key':
          return 'mock-key';
        default:
          return '';
      }
    });
  });

  describe('loadConfig', () => {
    test('loads valid configuration', () => {
      const config = loadConfig();
      expect(config.githubToken).toBe('mock-token');
      expect(config.openaiKey).toBe('mock-key');
      expect(config.model).toBeDefined();
      expect(config.limits).toBeDefined();
    });

    test('requires OpenAI key for non-local model', () => {
      core.getInput.mockImplementation(name => 
        name === 'github-token' ? 'token' : ''
      );
      
      expect(() => loadConfig()).toThrow('OpenAI API key required');
    });

    test('requires endpoint for local model', () => {
      core.getInput.mockImplementation(name => {
        if (name === 'github-token') return 'token';
        if (name === 'model') return 'local-model';
        return '';
      });
      
      expect(() => loadConfig()).toThrow('Local model endpoint required');
    });
  });

  describe('TokenUsageTracker', () => {
    test('tracks token usage', () => {
      const tracker = new TokenUsageTracker(1000);
      tracker.recordUsage(500);
      
      const stats = tracker.getStats();
      expect(stats.used).toBe(500);
      expect(stats.remaining).toBe(500);
    });

    test('enforces token limit', () => {
      const tracker = new TokenUsageTracker(1000);
      tracker.recordUsage(600);
      
      expect(() => tracker.recordUsage(500))
        .toThrow('Token limit exceeded');
    });

    test('enforces rate limit', () => {
      const tracker = new TokenUsageTracker(10000);
      
      // Simulate rapid requests
      for (let i = 0; i < 10; i++) {
        tracker.recordUsage(100);
      }
      
      expect(() => tracker.recordUsage(100))
        .toThrow('Rate limit exceeded');
    });
  });

  describe('sanitizeOutput', () => {
    test('redacts API keys', () => {
      const text = 'Key: sk-1234567890abcdef1234567890abcdef';
      expect(sanitizeOutput(text)).toContain('[REDACTED]');
      expect(sanitizeOutput(text)).not.toContain('sk-12345');
    });

    test('redacts GitHub tokens', () => {
      const text = 'Token: ghp_123456789012345678901234567890123456';
      expect(sanitizeOutput(text)).toContain('[REDACTED]');
      expect(sanitizeOutput(text)).not.toContain('ghp_12345');
    });

    test('redacts URLs with credentials', () => {
      const text = 'https://user:pass@example.com';
      expect(sanitizeOutput(text)).toBe('https://[REDACTED]@example.com');
    });

    test('redacts environment variables', () => {
      const text = 'API_KEY="secret123" PASSWORD=\'pass456\'';
      const sanitized = sanitizeOutput(text);
      expect(sanitized).not.toContain('secret123');
      expect(sanitized).not.toContain('pass456');
    });
  });
});