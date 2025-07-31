import * as core from '@actions/core';
import * as github from '@actions/github';
import { extractLatexBlocks } from './diff/extractLatexBlocks.js';
import { summarizeChanges } from './llm/summarize.js';
import { generateQuiz } from './llm/quiz.js';
import { renderComment } from './output/renderComment.js';

async function run() {
  try {
    // Get inputs
    const token = core.getInput('github-token', { required: true });
    const openaiKey = core.getInput('openai-api-key');
    const model = core.getInput('model');
    const generateLatexDiff = core.getInput('latex-diff') === 'true';
    const maxDiffLines = parseInt(core.getInput('max-diff-lines')) || 500;
    const localModelEndpoint = core.getInput('local-model-endpoint');
    const showSources = core.getInput('show-sources') === 'true';

    // Initialize octokit
    const octokit = github.getOctokit(token);
    const context = github.context;

    // Extract LaTeX changes
    const changes = await extractLatexBlocks({
      octokit,
      context,
      maxDiffLines,
    });

    // Generate summaries using LLM
    const summaries = await summarizeChanges({
      changes,
      model,
      openaiKey,
      localModelEndpoint,
      showSources,
    });

    // Generate quiz questions
    const quiz = await generateQuiz({
      summaries,
      model,
      openaiKey,
      localModelEndpoint,
    });

    // Render and post comment
    await renderComment({
      octokit,
      context,
      summaries,
      quiz,
      generateLatexDiff,
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();