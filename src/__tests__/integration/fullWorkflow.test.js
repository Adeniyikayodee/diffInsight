import { run } from '../../index.js';
import { loadConfig } from '../../config/settings.js';
import { fetchLatexDiffs } from '../../diff/latexDiff.js';
import { extractLatexBlocks } from '../../diff/extractLatexBlocks.js';
import { summarizeChanges } from '../../llm/summarize.js';
import { generateQuiz } from '../../llm/quiz.js';
import { renderComment } from '../../output/renderComment.js';

// Mock GitHub context
const mockContext = {
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
};

// Mock PR files
const mockPRFiles = [
  {
    filename: 'paper.tex',
    status: 'modified',
    additions: 10,
    deletions: 5,
    changes: 15
  }
];

// Mock file content
const mockTexContent = {
  base: \`\\documentclass{article}
\\begin{document}
\\section{Introduction}
This is the original text.
\\end{document}\`,
  head: \`\\documentclass{article}
\\begin{document}
\\section{Introduction}
This is the modified text with new claims.
\\subsection{New Section}
Adding more content here.
\\end{document}\`
};

// Mock LLM responses
const mockLLMResponses = {
  summary: {
    new_claims: ['Added discussion of new results'],
    changed_figures: [],
    equations: [],
    impact: ['Expands introduction section']
  },
  quiz: [{
    tf: {
      question: 'The changes add new results to the discussion',
      answer: true,
      explanation: 'A new subsection was added with additional content'
    },
    short: {
      question: 'What major change was made to the introduction?',
      answer: 'Added a new subsection with additional content',
      rubric: 'Should mention new subsection and content addition'
    }
  }]
};

describe('Full Workflow Integration', () => {
  // Mock all external dependencies
  beforeEach(() => {
    // Mock Octokit
    global.Octokit = jest.fn().mockImplementation(() => ({
      rest: {
        pulls: {
          listFiles: jest.fn().mockResolvedValue({ data: mockPRFiles }),
          get: jest.fn().mockResolvedValue({ data: mockTexContent })
        },
        repos: {
          getContent: jest.fn().mockImplementation(({ ref }) => ({
            data: {
              content: Buffer.from(
                ref === 'base-sha' ? mockTexContent.base : mockTexContent.head
              ).toString('base64'),
              encoding: 'base64'
            }
          }))
        },
        issues: {
          listComments: jest.fn().mockResolvedValue({ data: [] }),
          createComment: jest.fn().mockResolvedValue({})
        }
      }
    }));

    // Mock OpenAI
    global.OpenAI = jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockImplementation(({ messages }) => {
            // Return different responses based on prompt
            const content = messages[1].content;
            const response = content.includes('quiz') 
              ? mockLLMResponses.quiz
              : mockLLMResponses.summary;
            
            return Promise.resolve({
              choices: [{
                message: {
                  content: JSON.stringify(response)
                }
              }]
            });
          })
        }
      }
    }));
  });

  test('processes LaTeX changes end-to-end', async () => {
    // 1. Load config
    const config = loadConfig();
    expect(config).toBeDefined();

    // 2. Fetch LaTeX diffs
    const diffs = await fetchLatexDiffs({
      octokit: new Octokit(),
      context: mockContext
    });
    expect(diffs).toHaveLength(1);
    expect(diffs[0].path).toBe('paper.tex');

    // 3. Extract LaTeX blocks
    const blocks = await extractLatexBlocks({
      octokit: new Octokit(),
      context: mockContext,
      maxDiffLines: 500
    });
    expect(blocks).toBeDefined();
    expect(blocks.some(b => b.type === 'section')).toBe(true);

    // 4. Generate summaries
    const summaries = await summarizeChanges({
      changes: blocks,
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key'
    });
    expect(summaries.new_claims).toBeDefined();
    expect(summaries.impact).toBeDefined();

    // 5. Generate quiz
    const quiz = await generateQuiz({
      summaries,
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key'
    });
    expect(quiz).toHaveLength(1);
    expect(quiz[0].tf).toBeDefined();
    expect(quiz[0].short).toBeDefined();

    // 6. Render comment
    await renderComment({
      octokit: new Octokit(),
      context: mockContext,
      summaries,
      quiz,
      generateLatexDiff: false
    });

    // Verify comment was created
    const octokit = new Octokit();
    expect(octokit.rest.issues.createComment).toHaveBeenCalled();
    
    const comment = octokit.rest.issues.createComment.mock.calls[0][0].body;
    expect(comment).toContain('LaTeX Changes Review');
    expect(comment).toContain('New Claims');
    expect(comment).toContain('Comprehension Check');
  });

  test('handles missing PR gracefully', async () => {
    const invalidContext = { ...mockContext, payload: {} };
    
    await expect(run(invalidContext))
      .rejects
      .toThrow('This action only works on pull requests');
  });

  test('handles LLM errors gracefully', async () => {
    // Mock LLM error
    global.OpenAI = jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockRejectedValue(new Error('API Error'))
        }
      }
    }));

    const summaries = await summarizeChanges({
      changes: [],
      model: 'gpt-4-turbo-preview',
      openaiKey: 'test-key'
    });

    // Should return empty summaries
    expect(summaries.new_claims).toHaveLength(0);
    expect(summaries.impact).toHaveLength(0);
  });
});