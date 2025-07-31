import * as core from '@actions/core';
import * as github from '@actions/github';
import { extractLatexBlocks } from './diff/extractLatexBlocks.js';
import { summarizeChanges } from './llm/summarize.js';
import { generateQuiz } from './llm/quiz.js';
import { renderComment } from './output/renderComment.js';
import { generateLatexDiff } from './output/latexDiff.js';
import { loadConfig } from './config/settings.js';

async function run() {
  try {
    // Load and validate configuration
    const config = loadConfig();
    
    // Initialize octokit
    const octokit = github.getOctokit(config.githubToken);
    const context = github.context;

    // Extract LaTeX changes
    const changes = await extractLatexBlocks({
      octokit,
      context,
      maxDiffLines: config.maxDiffLines,
    });

    // Generate summaries using LLM
    const summaries = await summarizeChanges({
      changes,
      model: config.model,
      openaiKey: config.openaiKey,
      localModelEndpoint: config.localModelEndpoint,
      showSources: config.showSources,
    });

    // Generate quiz questions
    const quiz = await generateQuiz({
      summaries,
      model: config.model,
      openaiKey: config.openaiKey,
      localModelEndpoint: config.localModelEndpoint,
    });

    // Generate PDF diff if requested
    let pdfUrl;
    if (config.generateLatexDiff) {
      try {
        pdfUrl = await generateLatexDiff({
          diffs: changes,
          workingDir: process.env.GITHUB_WORKSPACE
        });
      } catch (error) {
        core.warning('PDF diff generation failed:', error);
        // Continue without PDF
      }
    }

    // Render and post comment
    await renderComment({
      octokit,
      context,
      summaries,
      quiz,
      pdfUrl,
    });

  } catch (error) {
    core.setFailed(error.message);
  }
}

run();