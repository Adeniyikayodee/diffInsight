import OpenAI from 'openai';

/**
 * Creates an LLM client based on configuration
 * @param {Object} config
 * @param {string} config.model - Model identifier
 * @param {string} [config.openaiKey] - OpenAI API key
 * @param {string} [config.localModelEndpoint] - Local model endpoint URL
 * @returns {Object} LLM client instance
 */
export function createLLMClient({ model, openaiKey, localModelEndpoint }) {
  if (model === 'local-model') {
    if (!localModelEndpoint) {
      throw new Error('Local model endpoint URL required when using local-model');
    }
    return createLocalClient(localModelEndpoint);
  } else {
    if (!openaiKey) {
      throw new Error('OpenAI API key required when using OpenAI models');
    }
    return new OpenAI({ apiKey: openaiKey });
  }
}

/**
 * Creates a client for local LLM endpoint
 * @private
 */
function createLocalClient(endpoint) {
  return {
    async chat({ messages }) {
      const response = await fetch(endpoint + '/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          stream: false,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error(\`Local LLM request failed: \${response.statusText}\`);
      }

      const data = await response.json();
      return {
        choices: [{
          message: {
            content: data.choices[0].message.content,
          },
        }],
      };
    },
  };
}

/**
 * Formats LaTeX block for LLM prompt
 * @param {Object} block - LaTeX block from extractor
 * @returns {string} Formatted block description
 */
export function formatBlockForPrompt(block) {
  const { type, content, context, metadata } = block;
  
  let description = \`Type: \${type}\n\`;
  
  if (metadata.title) {
    description += \`Title: \${metadata.title}\n\`;
  }
  
  if (metadata.label) {
    description += \`Label: \${metadata.label}\n\`;
  }
  
  if (metadata.hasMath) {
    description += 'Contains mathematical content\n';
  }
  
  if (metadata.citations.length > 0) {
    description += \`Citations: \${metadata.citations.join(', ')}\n\`;
  }
  
  description += '\nContext:\n' + context.join('\n');
  description += '\n\nChanges:\n' + content.join('\n');
  
  return description;
}

/**
 * Validates LLM response structure
 * @param {Object} response - Parsed LLM response
 * @returns {boolean} True if valid
 */
export function validateResponse(response) {
  const required = ['new_claims', 'changed_figures', 'equations', 'impact'];
  return required.every(key => Array.isArray(response[key]));
}

/**
 * System prompt for LaTeX diff summarization
 */
export const SYSTEM_PROMPT = \`You are an expert LaTeX document analyzer. Your task is to analyze changes in LaTeX documents and provide structured summaries focusing on:

1. New or modified claims and arguments
2. Changes to figures, tables, and visual elements
3. Mathematical changes (equations, theorems, proofs)
4. Impact on the document's conclusions or key points

Provide output in the following JSON format:
{
  "new_claims": ["List of new or modified claims"],
  "changed_figures": ["Description of figure/table changes"],
  "equations": ["Description of mathematical changes"],
  "impact": ["How these changes affect the document's conclusions"]
}

Keep descriptions clear and concise. For mathematical content, use LaTeX notation when relevant.\`;

/**
 * System prompt for quiz generation
 */
export const QUIZ_PROMPT = \`Generate comprehension quiz questions based on LaTeX document changes. For each significant change, create:

1. A True/False question testing understanding
2. A short-answer question requiring synthesis

Format response as JSON:
{
  "questions": [{
    "tf": {
      "question": "True/False question text",
      "answer": true/false,
      "explanation": "Why this is correct"
    },
    "short": {
      "question": "Short answer question",
      "answer": "Expected response (1-2 sentences)",
      "rubric": "Key points to look for"
    }
  }]
}\`;