import { fetchLatexDiffs, findMainTexFile, isFileIncluded } from '../latexDiff.js';
import * as core from '@actions/core';

// Mock PR context
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

// Mock file data
const mockFiles = [
  {
    filename: 'paper.tex',
    status: 'modified'
  },
  {
    filename: 'sections/intro.tex',
    status: 'modified'
  },
  {
    filename: 'figures/graph.pdf',
    status: 'added'
  },
  {
    filename: 'old.tex',
    status: 'removed'
  }
];

// Mock file content responses
const mockFileContent = {
  'paper.tex': {
    base: '\\documentclass{article}\n\\begin{document}\nOld content\n\\end{document}',
    head: '\\documentclass{article}\n\\begin{document}\nNew content\n\\end{document}'
  },
  'sections/intro.tex': {
    base: 'Old intro',
    head: 'New intro'
  },
  'figures/graph.pdf': {
    base: '',
    head: 'base64-content'
  }
};

describe('LaTeX Diff', () => {
  beforeEach(() => {
    jest.spyOn(core, 'error').mockImplementation(() => {});
  });

  describe('fetchLatexDiffs', () => {
    test('fetches changed LaTeX files', async () => {
      const mockOctokit = {
        rest: {
          pulls: {
            listFiles: jest.fn().mockResolvedValue({ data: mockFiles })
          },
          repos: {
            getContent: jest.fn().mockImplementation(({ path, ref }) => ({
              data: {
                type: 'file',
                content: Buffer.from(mockFileContent[path][ref === 'base-sha' ? 'base' : 'head']).toString('base64'),
                encoding: 'base64'
              }
            }))
          }
        }
      };

      const diffs = await fetchLatexDiffs({ octokit: mockOctokit, context: mockContext });
      
      expect(diffs).toHaveLength(3); // 2 tex files + 1 figure
      expect(diffs[0].path).toBe('paper.tex');
      expect(diffs[0].base).toContain('Old content');
      expect(diffs[0].head).toContain('New content');
    });

    test('handles missing files gracefully', async () => {
      const mockOctokit = {
        rest: {
          pulls: {
            listFiles: jest.fn().mockResolvedValue({ data: mockFiles })
          },
          repos: {
            getContent: jest.fn().mockRejectedValue({ status: 404 })
          }
        }
      };

      const diffs = await fetchLatexDiffs({ octokit: mockOctokit, context: mockContext });
      expect(diffs.every(d => d.base === '' || d.head === '')).toBe(true);
    });

    test('throws error for non-PR context', async () => {
      const invalidContext = { ...mockContext, payload: {} };
      
      await expect(fetchLatexDiffs({
        octokit: {},
        context: invalidContext
      })).rejects.toThrow('This action only works on pull requests');
    });
  });

  describe('findMainTexFile', () => {
    test('identifies main file by name', () => {
      const files = [
        { path: 'aux.tex', content: 'Some content' },
        { path: 'main.tex', content: 'Main content' }
      ];
      
      expect(findMainTexFile(files)).toBe('main.tex');
    });

    test('identifies main file by content', () => {
      const files = [
        {
          path: 'paper.tex',
          content: '\\documentclass{article}\n\\begin{document}'
        },
        {
          path: 'section.tex',
          content: 'Section content'
        }
      ];
      
      expect(findMainTexFile(files)).toBe('paper.tex');
    });

    test('falls back to largest file', () => {
      const files = [
        { path: 'small.tex', content: 'Small' },
        { path: 'large.tex', content: 'Much longer content here' }
      ];
      
      expect(findMainTexFile(files)).toBe('large.tex');
    });

    test('returns null for no tex files', () => {
      const files = [
        { path: 'file.bib', content: 'Bibliography' }
      ];
      
      expect(findMainTexFile(files)).toBeNull();
    });
  });

  describe('isFileIncluded', () => {
    test('detects \\input usage', () => {
      const content = '\\input{sections/intro}';
      expect(isFileIncluded('sections/intro.tex', content)).toBe(true);
    });

    test('detects \\include usage', () => {
      const content = '\\include{sections/methods.tex}';
      expect(isFileIncluded('sections/methods.tex', content)).toBe(true);
    });

    test('handles paths correctly', () => {
      const content = '\\input{intro}';
      expect(isFileIncluded('sections/intro.tex', content)).toBe(true);
    });

    test('returns false for non-included files', () => {
      const content = '\\input{other}';
      expect(isFileIncluded('intro.tex', content)).toBe(false);
    });
  });
});