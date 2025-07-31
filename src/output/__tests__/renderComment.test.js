import { renderComment } from '../renderComment.js';
import * as core from '@actions/core';

// Mock summaries
const mockSummaries = {
  new_claims: ['New claim 1', 'New claim 2'],
  changed_figures: ['Updated Figure 1'],
  equations: ['Modified equation in Theorem 2'],
  impact: ['Improves result X'],
  sources: {
    'paper.tex:10-20': 'Some LaTeX content'
  }
};

// Mock quiz
const mockQuiz = [{
  tf: {
    question: 'Is this true?',
    answer: true,
    explanation: 'Yes because...'
  },
  short: {
    question: 'Explain why',
    answer: 'Because...',
    rubric: 'Key points...'
  }
}];

// Mock GitHub context
const mockContext = {
  repo: {
    owner: 'test-owner',
    repo: 'test-repo'
  },
  payload: {
    pull_request: {
      number: 123
    }
  }
};

describe('Comment Renderer', () => {
  // Mock core.error and core.warning
  beforeEach(() => {
    jest.spyOn(core, 'error').mockImplementation(() => {});
    jest.spyOn(core, 'warning').mockImplementation(() => {});
  });

  test('renders full comment with all sections', async () => {
    const mockOctokit = {
      rest: {
        issues: {
          listComments: jest.fn().mockResolvedValue({ data: [] }),
          createComment: jest.fn().mockResolvedValue({})
        }
      }
    };

    await renderComment({
      octokit: mockOctokit,
      context: mockContext,
      summaries: mockSummaries,
      quiz: mockQuiz,
      generateLatexDiff: true
    });

    // Verify comment creation
    expect(mockOctokit.rest.issues.createComment).toHaveBeenCalled();
    const comment = mockOctokit.rest.issues.createComment.mock.calls[0][0].body;

    // Check all sections are present
    expect(comment).toContain('# 📝 LaTeX Changes Review');
    expect(comment).toContain('New Claims & Arguments');
    expect(comment).toContain('Figure & Table Updates');
    expect(comment).toContain('Mathematical Changes');
    expect(comment).toContain('Impact Analysis');
    expect(comment).toContain('Comprehension Check');
    expect(comment).toContain('Source Changes');
    expect(comment).toContain('LaTeX Diff PDF');
  });

  test('updates existing comment if found', async () => {
    const existingComment = {
      id: 456,
      body: '# 📝 LaTeX Changes Review\nOld content'
    };

    const mockOctokit = {
      rest: {
        issues: {
          listComments: jest.fn().mockResolvedValue({ 
            data: [existingComment] 
          }),
          updateComment: jest.fn().mockResolvedValue({}),
          createComment: jest.fn().mockResolvedValue({})
        }
      }
    };

    await renderComment({
      octokit: mockOctokit,
      context: mockContext,
      summaries: mockSummaries,
      quiz: mockQuiz,
      generateLatexDiff: false
    });

    // Verify comment update
    expect(mockOctokit.rest.issues.updateComment).toHaveBeenCalled();
    expect(mockOctokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  test('handles missing quiz gracefully', async () => {
    const mockOctokit = {
      rest: {
        issues: {
          listComments: jest.fn().mockResolvedValue({ data: [] }),
          createComment: jest.fn().mockResolvedValue({})
        }
      }
    };

    await renderComment({
      octokit: mockOctokit,
      context: mockContext,
      summaries: mockSummaries,
      quiz: [],
      generateLatexDiff: false
    });

    const comment = mockOctokit.rest.issues.createComment.mock.calls[0][0].body;
    expect(comment).not.toContain('Comprehension Check');
  });

  test('handles API errors', async () => {
    const mockOctokit = {
      rest: {
        issues: {
          listComments: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    };

    await expect(renderComment({
      octokit: mockOctokit,
      context: mockContext,
      summaries: mockSummaries,
      quiz: mockQuiz,
      generateLatexDiff: false
    })).rejects.toThrow();

    expect(core.error).toHaveBeenCalled();
  });
});