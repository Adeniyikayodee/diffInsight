import {
  createLLMClient,
  QUIZ_PROMPT
} from './llmUtils.js';

/**
 * Generates quiz questions based on changes
 * @param {Object} params
 * @param {Object} params.summaries - Change summaries from summarizeChanges
 * @param {string} params.model - LLM model to use
 * @param {string} [params.openaiKey] - OpenAI API key
 * @param {string} [params.localModelEndpoint] - Local LLM endpoint
 * @returns {Promise<Array<{
 *   tf: {
 *     question: string,
 *     answer: boolean,
 *     explanation: string
 *   },
 *   short: {
 *     question: string,
 *     answer: string,
 *     rubric: string
 *   }
 * }>>}
 */
export async function generateQuiz({
  summaries,
  model,
  openaiKey,
  localModelEndpoint
}) {
  // Create LLM client
  const llm = createLLMClient({ model, openaiKey, localModelEndpoint });
  
  // Format summaries for quiz generation
  const prompt = formatSummariesForQuiz(summaries);
  
  try {
    const response = await llm.chat({
      messages: [
        { role: 'system', content: QUIZ_PROMPT },
        { role: 'user', content: prompt }
      ]
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    if (!validateQuizResponse(result)) {
      throw new Error('Invalid quiz response structure');
    }
    
    return result.questions;
    
  } catch (error) {
    console.error('Failed to generate quiz:', error);
    return [];
  }
}

/**
 * Formats summaries for quiz generation prompt
 * @private
 */
function formatSummariesForQuiz(summaries) {
  const sections = [
    { title: 'New Claims', items: summaries.new_claims },
    { title: 'Changed Figures', items: summaries.changed_figures },
    { title: 'Mathematical Changes', items: summaries.equations },
    { title: 'Impact', items: summaries.impact }
  ];
  
  let prompt = 'Generate quiz questions based on these changes:\n\n';
  
  for (const section of sections) {
    if (section.items.length > 0) {
      prompt += `${section.title}:\n`;
      section.items.forEach(item => {
        prompt += `- ${item}\n`;
      });
      prompt += '\n';
    }
  }
  
  prompt += '\nCreate questions that:\n';
  prompt += '1. Test understanding of key changes\n';
  prompt += '2. Require synthesis across multiple changes\n';
  prompt += '3. Focus on impact and implications\n';
  prompt += '4. Include mathematical concepts where relevant\n';
  
  return prompt;
}

/**
 * Validates quiz response structure
 * @private
 */
function validateQuizResponse(response) {
  if (!response || !Array.isArray(response.questions)) {
    return false;
  }
  
  return response.questions.every(q => {
    const hasTF = q.tf && 
                  typeof q.tf.question === 'string' &&
                  typeof q.tf.answer === 'boolean' &&
                  typeof q.tf.explanation === 'string';
                  
    const hasShort = q.short &&
                    typeof q.short.question === 'string' &&
                    typeof q.short.answer === 'string' &&
                    typeof q.short.rubric === 'string';
                    
    return hasTF && hasShort;
  });
}

/**
 * Generates a single quiz question pair
 * @private
 */
export async function generateSingleQuestion(topic, llm) {
  const prompt = `Generate one quiz question pair about: ${topic}\nFocus on testing deep understanding rather than simple recall.`;

  try {
    const response = await llm.chat({
      messages: [
        { role: 'system', content: QUIZ_PROMPT },
        { role: 'user', content: prompt }
      ]
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result.questions[0];
  } catch (error) {
    console.error(`Failed to generate question for "${topic}":`, error);
    return null;
  }
}