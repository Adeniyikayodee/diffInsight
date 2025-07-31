import * as core from '@actions/core';
import {
  createCollapsible,
  createTable,
  formatQuizQuestion,
  createBadge,
  formatChangeList,
  createFileLink,
  escapeMarkdown
} from './markdownUtils.js';

/**
 * Renders and posts PR comment with analysis results
 * @param {Object} params
 * @param {Object} params.octokit - Initialized Octokit client
 * @param {Object} params.context - GitHub Actions context
 * @param {Object} params.summaries - Change summaries
 * @param {Array} params.quiz - Generated quiz questions
 * @param {boolean} params.generateLatexDiff - Whether to generate latexdiff PDF
 * @returns {Promise<void>}
 */
export async function renderComment({
  octokit,
  context,
  summaries,
  quiz,
  generateLatexDiff
}) {
  try {
    // Generate comment sections
    const header = renderHeader(summaries);
    const changes = renderChangeSummary(summaries);
    const quizSection = renderQuiz(quiz);
    const sources = renderSources(summaries.sources);
    const latexDiff = generateLatexDiff ? await generateAndLinkDiff(octokit, context) : '';
    
    // Combine all sections
    const comment = [
      header,
      changes,
      quizSection,
      sources,
      latexDiff
    ].filter(Boolean).join('\n\n');
    
    // Post comment
    await createOrUpdateComment(octokit, context, comment);
    
  } catch (error) {
    core.error('Failed to render or post comment:', error);
    throw error;
  }
}

/**
 * Renders the comment header with status badges
 * @private
 */
function renderHeader(summaries) {
  const totalChanges = Object.values(summaries)
    .filter(Array.isArray)
    .reduce((sum, arr) => sum + arr.length, 0);
  
  const hasMathChanges = summaries.equations.length > 0;
  const hasVisualChanges = summaries.changed_figures.length > 0;
  
  const badges = [
    createBadge('changes', \`\${totalChanges} updates\`, 'blue'),
    hasMathChanges ? createBadge('math', 'modified', 'yellow') : null,
    hasVisualChanges ? createBadge('visuals', 'updated', 'yellow') : null
  ].filter(Boolean);
  
  return `# 📝 LaTeX Changes Review

${badges.join(' ')}

Diff-Insight analyzed the changes in this PR and generated a summary with comprehension questions.`;
}

/**
 * Renders the change summary section
 * @private
 */
function renderChangeSummary(summaries) {
  const sections = [
    {
      title: '🔍 New Claims & Arguments',
      content: formatChangeList(summaries.new_claims, '📌')
    },
    {
      title: '📊 Figure & Table Updates',
      content: formatChangeList(summaries.changed_figures, '📈')
    },
    {
      title: '📐 Mathematical Changes',
      content: formatChangeList(summaries.equations, '∆')
    },
    {
      title: '💡 Impact Analysis',
      content: formatChangeList(summaries.impact, '🎯')
    }
  ];
  
  return sections
    .map(({ title, content }) => createCollapsible(title, content, true))
    .join('\n\n');
}

/**
 * Renders the quiz section
 * @private
 */
function renderQuiz(quiz) {
  if (!quiz || quiz.length === 0) {
    return '';
  }
  
  const quizContent = quiz
    .map((question, index) => formatQuizQuestion(question, index))
    .join('\n\n');
  
  return createCollapsible('❓ Comprehension Check', quizContent);
}

/**
 * Renders the sources section if available
 * @private
 */
function renderSources(sources) {
  if (!sources) {
    return '';
  }
  
  const content = Object.entries(sources)
    .map(([location, text]) => {
      const [path, range] = location.split(':');
      const [start, end] = range.split('-').map(Number);
      return `### ${createFileLink(path, start, end)}\n\`\`\`latex\n${text}\n\`\`\``;
    })
    .join('\n\n');
  
  return createCollapsible('📄 Source Changes', content);
}

/**
 * Generates latexdiff PDF and returns link
 * @private
 */
async function generateAndLinkDiff(octokit, context) {
  try {
    // TODO: Implement latexdiff generation
    // 1. Get base and head versions of tex files
    // 2. Run latexdiff
    // 3. Compile PDF
    // 4. Upload as artifact
    // 5. Return link
    
    return createCollapsible(
      '📑 LaTeX Diff PDF',
      '*PDF diff generation will be implemented in a future update*'
    );
  } catch (error) {
    core.warning('Failed to generate latexdiff PDF:', error);
    return '';
  }
}

/**
 * Creates or updates PR comment
 * @private
 */
async function createOrUpdateComment(octokit, context, comment) {
  const { owner, repo } = context.repo;
  const pr_number = context.payload.pull_request.number;
  
  try {
    // Find existing comment
    const comments = await octokit.rest.issues.listComments({
      owner,
      repo,
      issue_number: pr_number
    });
    
    const existingComment = comments.data.find(c => 
      c.body.includes('# 📝 LaTeX Changes Review')
    );
    
    if (existingComment) {
      // Update existing comment
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body: comment
      });
    } else {
      // Create new comment
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pr_number,
        body: comment
      });
    }
  } catch (error) {
    core.error('Failed to post comment:', error);
    throw error;
  }
}