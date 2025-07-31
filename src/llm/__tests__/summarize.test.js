import { summarizeChanges } from '../summarize.js';

// Mock block for testing
const mockBlock = {
  type: 'theorem',
  content: ['New theorem statement'],
  context: ['Previous version'],
  metadata: {
    title: 'Main Result',
    label: 'thm:main',
    hasMath: true,
    citations: ['paper1']
  },
  path: 'paper.tex',
  lineStart: 100,
  lineEnd: 105
};

// Mock LLM response
const mockLLMResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        new_claims: ['Added stronger condition to theorem'],
        changed_figures: [],
        equations: ['Modified theorem statement'],
        impact: ['Strengthens main result']
      })
    }
  }]
};

// Mock OpenAI client
jest.mock('openai', () => {
  return class MockOpenAI {
    constructor() {
      this.chat = {
        completions: {
          create: jest.fn().mockResolvedValue(mockLLMResponse)
        }
      };
    }
  };
});

describe('summarizeChanges', () => {
  test('summarizes single block', async () => {
    const summary = await summarizeChanges({
      changes: [mockBlock],
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key',
      showSources: false
    });

    expect(summary.new_claims).toHaveLength(1);
    expect(summary.new_claims[0]).toBe('Added stronger condition to theorem');
    expect(summary.impact).toHaveLength(1);
    expect(summary.impact[0]).toBe('Strengthens main result');
  });

  test('includes sources when requested', async () => {
    const summary = await summarizeChanges({
      changes: [mockBlock],
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key',
      showSources: true
    });

    expect(summary.sources).toBeDefined();
    const sourceKey = 'paper.tex:100-105';
    expect(summary.sources[sourceKey]).toBeDefined();
    expect(summary.sources[sourceKey]).toContain('Type: theorem');
  });

  test('handles local model', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLLMResponse)
    });

    const summary = await summarizeChanges({
      changes: [mockBlock],
      model: 'local-model',
      localModelEndpoint: 'http://localhost:11434/v1',
      showSources: false
    });

    expect(summary.new_claims).toHaveLength(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:11434/v1/chat/completions',
      expect.any(Object)
    );
  });

  test('handles multiple blocks', async () => {
    const blocks = [mockBlock, { ...mockBlock, type: 'section' }];
    
    const summary = await summarizeChanges({
      changes: blocks,
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key',
      showSources: false
    });

    expect(summary.new_claims).toBeDefined();
    expect(summary.changed_figures).toBeDefined();
    expect(summary.equations).toBeDefined();
    expect(summary.impact).toBeDefined();
  });

  test('handles LLM errors gracefully', async () => {
    const mockError = new Error('LLM API error');
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    global.fetch = jest.fn().mockRejectedValue(mockError);

    const summary = await summarizeChanges({
      changes: [mockBlock],
      model: 'local-model',
      localModelEndpoint: 'http://localhost:11434/v1',
      showSources: false
    });

    expect(summary.new_claims).toHaveLength(0);
    expect(console.error).toHaveBeenCalled();
  });
});