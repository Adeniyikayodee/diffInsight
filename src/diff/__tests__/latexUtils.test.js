import {
  getEnvironmentStart,
  isEnvironmentEnd,
  extractBlockMetadata,
  LATEX_ENVIRONMENTS
} from '../latexUtils.js';

describe('LaTeX Utils', () => {
  describe('getEnvironmentStart', () => {
    test('detects standard environments', () => {
      expect(getEnvironmentStart('\\begin{theorem}')).toBe('theorem');
      expect(getEnvironmentStart('\\begin{proof}')).toBe('proof');
      expect(getEnvironmentStart('\\begin{figure}')).toBe('figure');
    });

    test('detects section commands', () => {
      expect(getEnvironmentStart('\\section{Introduction}')).toBe('section');
      expect(getEnvironmentStart('\\subsection{Methods}')).toBe('section');
    });

    test('ignores non-tracked environments', () => {
      expect(getEnvironmentStart('\\begin{center}')).toBeNull();
      expect(getEnvironmentStart('Regular text')).toBeNull();
    });
  });

  describe('isEnvironmentEnd', () => {
    test('matches environment endings', () => {
      expect(isEnvironmentEnd('\\end{theorem}', 'theorem')).toBe(true);
      expect(isEnvironmentEnd('\\end{proof}', 'proof')).toBe(true);
    });

    test('handles section endings', () => {
      expect(isEnvironmentEnd('\\section{Next}', 'section')).toBe(true);
      expect(isEnvironmentEnd('\\begin{theorem}', 'section')).toBe(true);
      expect(isEnvironmentEnd('Regular text', 'section')).toBe(false);
    });
  });

  describe('extractBlockMetadata', () => {
    test('extracts label and citations', () => {
      const lines = [
        '\\begin{theorem}',
        '\\label{thm:main}',
        'Based on \\cite{smith2023,jones2022}',
        '\\end{theorem}'
      ];

      const metadata = extractBlockMetadata(lines);
      expect(metadata.label).toBe('thm:main');
      expect(metadata.citations).toContain('smith2023,jones2022');
    });

    test('detects math content', () => {
      const lines = [
        'Let $x \\in \\mathbb{R}$ be a real number.',
        'Then:',
        '\\[',
        'f(x) = x^2 + 1',
        '\\]'
      ];

      const metadata = extractBlockMetadata(lines);
      expect(metadata.hasMath).toBe(true);
    });

    test('extracts section titles', () => {
      const lines = [
        '\\section{Introduction}',
        'This is the introduction.'
      ];

      const metadata = extractBlockMetadata(lines);
      expect(metadata.title).toBe('Introduction');
    });
  });
});