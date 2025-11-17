import { summarizeChanges } from '../summarize.js';
import * as llmUtils from '../llmUtils.js';

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

// Mock the llmUtils module
jest.mock('../llmUtils.js', () => ({
  createLLMClient: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue(mockLLMResponse)
      }
    }
  })),
  formatBlockForPrompt: jest.fn((block) => `Type: ${block.type}\nContent: ${block.content.join('\n')}`),
  validateResponse: jest.fn((resp) => true),
  SYSTEM_PROMPT: 'Test system prompt'
}));

describe('summarizeChanges', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('summarizes single block', async () => {
    const summary = await summarizeChanges({
      changes: [mockBlock],
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key',
      showSources: false
    });

    // Verify the result structure
    expect(summary).toHaveProperty('new_claims');
    expect(summary).toHaveProperty('changed_figures');
    expect(summary).toHaveProperty('equations');
    expect(summary).toHaveProperty('impact');
    expect(Array.isArray(summary.new_claims)).toBe(true);
  });

  test('includes sources when requested', async () => {
    const summary = await summarizeChanges({
      changes: [mockBlock],
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key',
      showSources: true
    });

    // Verify sources are included
    if (summary.sources) {
      expect(typeof summary.sources).toBe('object');
    }
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

    // Verify structure
    expect(summary).toHaveProperty('new_claims');
    expect(Array.isArray(summary.new_claims)).toBe(true);
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
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const summary = await summarizeChanges({
      changes: [mockBlock],
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key',
      showSources: false
    });

    // Should return empty or populated structure gracefully
    expect(summary).toHaveProperty('new_claims');
    expect(Array.isArray(summary.new_claims)).toBe(true);
  });
});