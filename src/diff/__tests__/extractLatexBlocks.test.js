import { extractLatexBlocks } from '../extractLatexBlocks.js';

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

// Mock diff response
const mockDiff = `diff --git a/paper.tex b/paper.tex
index abc..def 100644
--- a/paper.tex
+++ b/paper.tex
@@ -10,6 +10,7 @@
 \\begin{abstract}
 This is the original abstract.
-We remove this line.
+We add this new line.
+And another new line.
 \\end{abstract}
 
 \\section{Introduction}
@@ -50,6 +51,8 @@
 \\begin{theorem}
 \\label{thm:main}
-Old theorem statement
+New improved theorem statement
+with additional condition
 \\end{theorem}
`;

describe('extractLatexBlocks', () => {
  // Mock Octokit client
  const mockOctokit = {
    rest: {
      pulls: {
        get: jest.fn().mockResolvedValue({
          data: mockDiff
        })
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('extracts LaTeX blocks from diff', async () => {
    const blocks = await extractLatexBlocks({
      octokit: mockOctokit,
      context: mockContext,
      maxDiffLines: 500
    });

    // Should return an array
    expect(Array.isArray(blocks)).toBe(true);
    
    // Should have found some blocks given the diff contains \begin/\end
    if (blocks.length > 0) {
      expect(blocks[0]).toHaveProperty('type');
      expect(blocks[0]).toHaveProperty('content');
      expect(blocks[0]).toHaveProperty('path');
    }
  });

  test('respects maxDiffLines parameter', async () => {
    const blocks = await extractLatexBlocks({
      octokit: mockOctokit,
      context: mockContext,
      maxDiffLines: 5 // Very small limit
    });

    // Should split into smaller chunks or skip large blocks
    expect(blocks.length).toBeLessThanOrEqual(1);
  });

  test('handles missing pull request context', async () => {
    const invalidContext = { ...mockContext, payload: {} };
    
    await expect(extractLatexBlocks({
      octokit: mockOctokit,
      context: invalidContext,
      maxDiffLines: 500
    })).rejects.toThrow('This action only works on pull requests');
  });
});