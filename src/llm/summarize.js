import {
  createLLMClient,
  formatBlockForPrompt,
  validateResponse,
  SYSTEM_PROMPT
} from './llmUtils.js';

/**
 * Summarizes LaTeX changes using LLM
 * @param {Object} params
 * @param {Array<{type: string, content: string[], context: string[], metadata: Object}>} params.changes
 * @param {string} params.model - LLM model to use
 * @param {string} [params.openaiKey] - OpenAI API key
 * @param {string} [params.localModelEndpoint] - Local LLM endpoint
 * @param {boolean} params.showSources - Include source snippets in summary
 * @returns {Promise<{
 *   new_claims: string[],
 *   changed_figures: string[],
 *   equations: string[],
 *   impact: string[],
 *   sources?: {[key: string]: string}
 * }>}
 */
export async function summarizeChanges({
  changes,
  model,
  openaiKey,
  localModelEndpoint,
  showSources
}) {
  // Create LLM client
  const llm = createLLMClient({ model, openaiKey, localModelEndpoint });
  
  // Process each block and merge results
  const summaries = await Promise.all(
    changes.map(block => summarizeBlock(block, llm))
  );
  
  // Merge all summaries
  const merged = {
    new_claims: [],
    changed_figures: [],
    equations: [],
    impact: []
  };
  
  const sources = showSources ? {} : undefined;
  
  for (let i = 0; i < summaries.length; i++) {
    const summary = summaries[i];
    const block = changes[i];
    
    // Add each summary component
    merged.new_claims.push(...summary.new_claims);
    merged.changed_figures.push(...summary.changed_figures);
    merged.equations.push(...summary.equations);
    merged.impact.push(...summary.impact);
    
    // Add sources if requested
    if (showSources) {
      const key = \`\${block.path}:\${block.lineStart}-\${block.lineEnd}\`;
      sources[key] = formatBlockForPrompt(block);
    }
  }
  
  // Remove duplicates and empty items
  for (const key of Object.keys(merged)) {
    merged[key] = [...new Set(merged[key])].filter(Boolean);
  }
  
  return showSources ? { ...merged, sources } : merged;
}

/**
 * Summarizes a single LaTeX block
 * @private
 */
async function summarizeBlock(block, llm) {
  const formattedBlock = formatBlockForPrompt(block);
  
  try {
    const response = await llm.chat({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: formattedBlock }
      ]
    });
    
    const result = JSON.parse(response.choices[0].message.content);
    
    if (!validateResponse(result)) {
      throw new Error('Invalid LLM response structure');
    }
    
    return result;
    
  } catch (error) {
    console.error(\`Failed to summarize block \${block.type}:\`, error);
    // Return empty summary on error
    return {
      new_claims: [],
      changed_figures: [],
      equations: [],
      impact: []
    };
  }
}