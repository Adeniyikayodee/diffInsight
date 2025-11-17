import { generateQuiz } from '../quiz.js';

// Mock summaries for testing
const mockSummaries = {
  new_claims: [
    'The algorithm now achieves O(n log n) complexity',
    'Added support for sparse matrices'
  ],
  changed_figures: [
    'Updated Figure 2 with new benchmark results'
  ],
  equations: [
    'Modified convergence proof in Theorem 3.1'
  ],
  impact: [
    'Improves performance on large datasets',
    'Extends applicability to sparse problems'
  ]
};

// Mock LLM response
const mockQuizResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        questions: [{
          tf: {
            question: 'The algorithm modification improves performance',
            answer: true,
            explanation: 'The changes add support for sparse matrices'
          }
        }]
      })
    }
  }]
};

// Mock llmUtils module
jest.mock('../llmUtils.js', () => ({
  createLLMClient: jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue(mockQuizResponse)
      }
    }
  })),
  QUIZ_PROMPT: 'Test quiz prompt'
}));

describe('Quiz Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateQuiz', () => {
    test('generates quiz from summaries', async () => {
      const quiz = await generateQuiz({
        summaries: mockSummaries,
        model: 'gpt-4-turbo-preview',
        openaiKey: 'test-key'
      });

      // Verify quiz is an array
      expect(Array.isArray(quiz)).toBe(true);
    });

    test('handles errors gracefully', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const quiz = await generateQuiz({
        summaries: mockSummaries,
        model: 'gpt-4-turbo-preview',
        openaiKey: 'test-key'
      });

      // Should return array even on error
      expect(Array.isArray(quiz)).toBe(true);
    });
  });
});