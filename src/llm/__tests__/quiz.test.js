import { generateQuiz, generateSingleQuestion } from '../quiz.js';

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

// Mock LLM response for full quiz
const mockQuizResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        questions: [{
          tf: {
            question: 'The algorithm modification improves performance on sparse matrices',
            answer: true,
            explanation: 'The changes explicitly add support for sparse matrices'
          },
          short: {
            question: 'How does the algorithm improvement affect its applicability?',
            answer: 'It extends to sparse problems while maintaining O(n log n) complexity',
            rubric: 'Should mention: 1) Sparse matrix support 2) Complexity improvement'
          }
        }]
      })
    }
  }]
};

// Mock LLM response for single question
const mockSingleQuestionResponse = {
  choices: [{
    message: {
      content: JSON.stringify({
        questions: [{
          tf: {
            question: 'The new benchmark results show improved performance',
            answer: true,
            explanation: 'Figure 2 demonstrates better performance'
          },
          short: {
            question: 'What specific improvements are shown in the new benchmarks?',
            answer: 'The updated results show better performance metrics',
            rubric: 'Look for specific performance metrics and improvements'
          }
        }]
      })
    }
  }]
};

describe('Quiz Generator', () => {
  beforeEach(() => {
    // Reset console.error mock
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('generateQuiz', () => {
    test('generates quiz from summaries', async () => {
      // Mock OpenAI client
      const mockLLM = {
        chat: jest.fn().mockResolvedValue(mockQuizResponse)
      };

      const quiz = await generateQuiz({
        summaries: mockSummaries,
        model: 'gpt-4-turbo-preview',
        openaiKey: 'test-key'
      });

      expect(quiz).toHaveLength(1);
      expect(quiz[0].tf.question).toBeDefined();
      expect(quiz[0].short.question).toBeDefined();
      expect(typeof quiz[0].tf.answer).toBe('boolean');
    });

    test('handles invalid response structure', async () => {
      const invalidResponse = {
        choices: [{
          message: {
            content: JSON.stringify({ questions: [{ invalid: 'structure' }] })
          }
        }]
      };

      const mockLLM = {
        chat: jest.fn().mockResolvedValue(invalidResponse)
      };

      const quiz = await generateQuiz({
        summaries: mockSummaries,
        model: 'gpt-4-turbo-preview',
        openaiKey: 'test-key'
      });

      expect(quiz).toHaveLength(0);
      expect(console.error).toHaveBeenCalled();
    });

    test('handles LLM errors gracefully', async () => {
      const mockLLM = {
        chat: jest.fn().mockRejectedValue(new Error('API Error'))
      };

      const quiz = await generateQuiz({
        summaries: mockSummaries,
        model: 'gpt-4-turbo-preview',
        openaiKey: 'test-key'
      });

      expect(quiz).toHaveLength(0);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('generateSingleQuestion', () => {
    test('generates single question pair', async () => {
      const mockLLM = {
        chat: jest.fn().mockResolvedValue(mockSingleQuestionResponse)
      };

      const question = await generateSingleQuestion(
        'Updated benchmark results in Figure 2',
        mockLLM
      );

      expect(question).toBeTruthy();
      expect(question.tf.question).toBeDefined();
      expect(question.short.question).toBeDefined();
    });

    test('handles errors gracefully', async () => {
      const mockLLM = {
        chat: jest.fn().mockRejectedValue(new Error('API Error'))
      };

      const question = await generateSingleQuestion(
        'Some topic',
        mockLLM
      );

      expect(question).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });
  });
});