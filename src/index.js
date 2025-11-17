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
    core.info('🔧 Loading configuration...');
    const config = loadConfig();
    
    // Initialize octokit
    const octokit = github.getOctokit(config.githubToken);
    const context = github.context;

    // Extract LaTeX changes
    core.info('📄 Extracting LaTeX blocks from diff...');
    const changes = await extractLatexBlocks({
      octokit,
      context,
      maxDiffLines: config.maxDiffLines,
    });

    if (changes.length === 0) {
      core.info('✓ No LaTeX changes found in this PR');
      return;
    }

    core.info(`✓ Found ${changes.length} LaTeX block(s) with changes`);

    // Generate summaries using LLM
    core.info('🤖 Generating AI-powered summaries...');
    const summaries = await summarizeChanges({
      changes,
      model: config.model,
      openaiKey: config.openaiKey,
      localModelEndpoint: config.localModelEndpoint,
      showSources: config.showSources,
    });

    core.info('✓ Summaries generated successfully');

    // Generate quiz questions
    core.info('❓ Creating comprehension quiz...');
    const quiz = await generateQuiz({
      summaries,
      model: config.model,
      openaiKey: config.openaiKey,
      localModelEndpoint: config.localModelEndpoint,
    });

    core.info(`✓ Quiz created with ${quiz?.length || 0} questions`);

    // Generate PDF diff if requested
    let pdfUrl;
    if (config.generateLatexDiff) {
      try {
        core.info('📑 Generating PDF diff...');
        pdfUrl = await generateLatexDiff({
          diffs: changes,
          workingDir: process.env.GITHUB_WORKSPACE
        });
        core.info('✓ PDF diff generated and uploaded');
      } catch (error) {
        core.warning(`⚠ PDF diff generation failed: ${error.message}`);
        // Continue without PDF
      }
    }

    // Render and post comment
    core.info('💬 Posting comment to PR...');
    await renderComment({
      octokit,
      context,
      summaries,
      quiz,
      pdfUrl,
    });

    core.info('✅ Review complete! Comment posted to PR');

  } catch (error) {
    core.error(`❌ Action failed: ${error.message}`);
    core.setFailed(error.message);
  }
}

// Export run for testing
export { run };

// Run action in CI environment
run();