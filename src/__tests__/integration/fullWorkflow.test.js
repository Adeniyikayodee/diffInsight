import { loadConfig } from '../../config/settings.js';
import { extractLatexBlocks } from '../../diff/extractLatexBlocks.js';
import { summarizeChanges } from '../../llm/summarize.js';
import { generateQuiz } from '../../llm/quiz.js';
import { renderComment } from '../../output/renderComment.js';

// Mock @actions/core before any imports that use it
jest.mock('@actions/core', () => ({
  getInput: jest.fn((name) => {
    const inputs = {
      'github-token': 'test-token',
      'openai-api-key': 'test-key',
      'model': 'gpt-4-turbo-preview',
      'max-diff-lines': '500',
      'generate-latex-diff': 'false',
      'show-sources': 'true'
    };
    return inputs[name] || '';
  }),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  setFailed: jest.fn()
}));

// Mock @actions/github
jest.mock('@actions/github', () => ({
  getOctokit: jest.fn(() => ({
    rest: {
      pulls: {
        listFiles: jest.fn().mockResolvedValue({ data: [] }),
      },
      repos: {
        getContent: jest.fn().mockResolvedValue({
          data: {
            content: Buffer.from('test content').toString('base64'),
            encoding: 'base64'
          }
        })
      },
      issues: {
        listComments: jest.fn().mockResolvedValue({ data: [] }),
        createComment: jest.fn().mockResolvedValue({})
      }
    }
  })),
  context: {
    repo: {
      owner: 'test-owner',
      repo: 'test-repo'
    },
    payload: {
      pull_request: {
        number: 123,
        base: { sha: 'base-sha' },
        head: { sha: 'head-sha' }
      }
    }
  }
}));

// Mock LLM modules
jest.mock('../../diff/extractLatexBlocks.js', () => ({
  extractLatexBlocks: jest.fn().mockResolvedValue([
    {
      type: 'section',
      title: 'Introduction',
      diff: 'This is the modified text with new claims.',
      context: 'document'
    }
  ])
}));

jest.mock('../../llm/summarize.js', () => ({
  summarizeChanges: jest.fn().mockResolvedValue({
    new_claims: ['Added discussion of new results'],
    changed_figures: [],
    equations: [],
    impact: ['Expands introduction section']
  })
}));

jest.mock('../../llm/quiz.js', () => ({
  generateQuiz: jest.fn().mockResolvedValue([{
    tf: {
      question: 'The changes add new results to the discussion',
      answer: true,
      explanation: 'A new subsection was added with additional content'
    }
  }])
}));

jest.mock('../../output/renderComment.js', () => ({
  renderComment: jest.fn().mockResolvedValue({})
}));

jest.mock('../../output/latexDiff.js', () => ({
  generateLatexDiff: jest.fn().mockResolvedValue(undefined)
}));

describe('Full Workflow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads config successfully', () => {
    const config = loadConfig();
    expect(config).toBeDefined();
    expect(config.githubToken).toBe('test-token');
    expect(config.model).toBe('gpt-4-turbo-preview');
  });

  test('extracts LaTeX blocks', async () => {
    const blocks = await extractLatexBlocks({
      octokit: {},
      context: {},
      maxDiffLines: 500
    });
    
    expect(Array.isArray(blocks)).toBe(true);
    if (blocks.length > 0) {
      expect(blocks[0].type).toBe('section');
    }
  });

  test('generates summaries from blocks', async () => {
    const summaries = await summarizeChanges({
      changes: [],
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key'
    });

    expect(summaries).toBeDefined();
    expect(Array.isArray(summaries.new_claims)).toBe(true);
    expect(Array.isArray(summaries.impact)).toBe(true);
  });

  test('generates quiz from summaries', async () => {
    const quiz = await generateQuiz({
      summaries: {
        new_claims: [],
        changed_figures: [],
        equations: [],
        impact: []
      },
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key'
    });

    expect(Array.isArray(quiz)).toBe(true);
  });

  test('renders comment with results', async () => {
    await renderComment({
      octokit: {},
      context: {},
      summaries: {
        new_claims: [],
        changed_figures: [],
        equations: [],
        impact: []
      },
      quiz: []
    });

    expect(renderComment).toHaveBeenCalled();
  });
});