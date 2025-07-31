import {
  createCollapsible,
  createTable,
  formatQuizQuestion,
  createBadge,
  formatChangeList,
  createFileLink,
  escapeMarkdown
} from '../markdownUtils.js';

describe('Markdown Utils', () => {
  describe('createCollapsible', () => {
    test('creates collapsed section by default', () => {
      const result = createCollapsible('Title', 'Content');
      expect(result).toContain('<details>');
      expect(result).toContain('<summary>Title</summary>');
      expect(result).toContain('Content');
    });

    test('creates expanded section when specified', () => {
      const result = createCollapsible('Title', 'Content', true);
      expect(result).toContain('<details open>');
    });
  });

  describe('createTable', () => {
    test('creates markdown table', () => {
      const headers = ['Col1', 'Col2'];
      const rows = [['A', 'B'], ['C', 'D']];
      const result = createTable(headers, rows);
      
      expect(result).toContain('| Col1 | Col2 |');
      expect(result).toContain('| --- | --- |');
      expect(result).toContain('| A | B |');
      expect(result).toContain('| C | D |');
    });
  });

  describe('formatQuizQuestion', () => {
    test('formats quiz question set', () => {
      const question = {
        tf: {
          question: 'Is this true?',
          answer: true,
          explanation: 'Because it is'
        },
        short: {
          question: 'Explain why',
          answer: 'The reason is...',
          rubric: 'Look for key points'
        }
      };

      const result = formatQuizQuestion(question, 0);
      expect(result).toContain('Question Set 1');
      expect(result).toContain('True/False');
      expect(result).toContain('Short Answer');
      expect(result).toContain('Show Answer');
      expect(result).toContain('Show Answer Guide');
    });
  });

  describe('createBadge', () => {
    test('creates shield.io badge', () => {
      const result = createBadge('test', 'passing', 'green');
      expect(result).toContain('![test]');
      expect(result).toContain('img.shields.io');
      expect(result).toContain('2ea44f'); // green color
    });
  });

  describe('formatChangeList', () => {
    test('formats list with custom emoji', () => {
      const changes = ['Change 1', 'Change 2'];
      const result = formatChangeList(changes, '✨');
      expect(result).toBe('✨ Change 1\n✨ Change 2');
    });

    test('handles empty list', () => {
      const result = formatChangeList([]);
      expect(result).toBe('*No changes in this category*');
    });
  });

  describe('createFileLink', () => {
    test('creates GitHub file link', () => {
      const result = createFileLink('src/file.tex', 10, 20);
      expect(result).toContain('src/file.tex:10-20');
      expect(result).toContain('#L10-L20');
    });
  });

  describe('escapeMarkdown', () => {
    test('escapes special characters', () => {
      const result = escapeMarkdown('*bold* _italic_ `code`');
      expect(result).toBe('\\*bold\\* \\_italic\\_ \\`code\\`');
    });
  });
});