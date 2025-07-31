import {
  createLLMClient,
  formatBlockForPrompt,
  validateResponse
} from '../llmUtils.js';

describe('LLM Utils', () => {
  describe('createLLMClient', () => {
    test('creates OpenAI client when using OpenAI model', () => {
      const client = createLLMClient({
        model: 'gpt-4-turbo-preview',
        openaiKey: 'test-key'
      });
      expect(client).toBeTruthy();
      expect(client.apiKey).toBe('test-key');
    });

    test('creates local client when using local model', () => {
      const client = createLLMClient({
        model: 'local-model',
        localModelEndpoint: 'http://localhost:11434/v1'
      });
      expect(client).toBeTruthy();
      expect(client.chat).toBeDefined();
    });

    test('throws error when missing required config', () => {
      expect(() => createLLMClient({
        model: 'gpt-4-turbo-preview'
      })).toThrow('OpenAI API key required');

      expect(() => createLLMClient({
        model: 'local-model'
      })).toThrow('Local model endpoint URL required');
    });
  });

  describe('formatBlockForPrompt', () => {
    test('formats block with all metadata', () => {
      const block = {
        type: 'theorem',
        content: ['New theorem statement'],
        context: ['Previous version'],
        metadata: {
          title: 'Main Result',
          label: 'thm:main',
          hasMath: true,
          citations: ['paper1', 'paper2']
        }
      };

      const formatted = formatBlockForPrompt(block);
      expect(formatted).toContain('Type: theorem');
      expect(formatted).toContain('Title: Main Result');
      expect(formatted).toContain('Label: thm:main');
      expect(formatted).toContain('Contains mathematical content');
      expect(formatted).toContain('Citations: paper1, paper2');
      expect(formatted).toContain('New theorem statement');
    });

    test('handles minimal block', () => {
      const block = {
        type: 'section',
        content: ['New content'],
        context: [],
        metadata: {
          title: null,
          label: null,
          hasMath: false,
          citations: []
        }
      };

      const formatted = formatBlockForPrompt(block);
      expect(formatted).toContain('Type: section');
      expect(formatted).toContain('New content');
      expect(formatted).not.toContain('Title:');
      expect(formatted).not.toContain('Label:');
    });
  });

  describe('validateResponse', () => {
    test('validates correct response structure', () => {
      const response = {
        new_claims: [],
        changed_figures: [],
        equations: [],
        impact: []
      };
      expect(validateResponse(response)).toBe(true);
    });

    test('rejects invalid response structure', () => {
      expect(validateResponse({})).toBe(false);
      expect(validateResponse({
        new_claims: 'not an array'
      })).toBe(false);
    });
  });
});