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

  test('extracts LaTeX blocks from diff', async () => {
    const blocks = await extractLatexBlocks({
      octokit: mockOctokit,
      context: mockContext,
      maxDiffLines: 500
    });

    expect(blocks).toHaveLength(2); // abstract and theorem

    // Check abstract block
    const abstract = blocks.find(b => b.type === 'abstract');
    expect(abstract).toBeTruthy();
    expect(abstract.content).toContain('We add this new line.');
    expect(abstract.path).toBe('paper.tex');

    // Check theorem block
    const theorem = blocks.find(b => b.type === 'theorem');
    expect(theorem).toBeTruthy();
    expect(theorem.content).toContain('New improved theorem statement');
    expect(theorem.metadata.label).toBe('thm:main');
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