import {
  LATEX_ENVIRONMENTS,
  getEnvironmentStart,
  isEnvironmentEnd,
  extractBlockMetadata
} from './latexUtils.js';

/**
 * Extracts changed LaTeX blocks from PR diff
 * @param {Object} params
 * @param {Object} params.octokit - Initialized Octokit client
 * @param {Object} params.context - GitHub Actions context
 * @param {number} params.maxDiffLines - Maximum lines per diff chunk
 * @returns {Promise<Array<{
 *   type: string,
 *   content: string[],
 *   context: string[],
 *   metadata: Object,
 *   path: string,
 *   lineStart: number,
 *   lineEnd: number
 * }>>}
 */
export async function extractLatexBlocks({ octokit, context, maxDiffLines }) {
  const { pull_request } = context.payload;
  if (!pull_request) {
    throw new Error('This action only works on pull requests');
  }

  // Get the PR diff
  const response = await octokit.rest.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: pull_request.number,
    mediaType: {
      format: 'diff'
    }
  });

  const diff = response.data;
  const blocks = [];
  let currentFile = null;
  let currentHunk = [];
  let inBlock = false;
  let currentEnvironment = null;
  let blockStart = 0;
  let lineNumber = 0;

  // Split diff into lines and process
  const lines = diff.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track file changes
    if (line.startsWith('diff --git')) {
      if (currentHunk.length > 0) {
        processHunk(currentHunk, currentFile, blocks);
      }
      currentHunk = [];
      currentFile = null;
      inBlock = false;
      continue;
    }

    // Get current file name
    if (line.startsWith('+++ b/')) {
      currentFile = line.substring(6);
      if (!currentFile.match(/\.(tex|bib)$/)) {
        currentFile = null; // Skip non-LaTeX files
      }
      continue;
    }

    // Skip file metadata lines
    if (line.startsWith('index ') || line.startsWith('--- ')) {
      continue;
    }

    // Process diff lines
    if (currentFile && (line.startsWith('+') || line.startsWith('-') || line.startsWith(' '))) {
      currentHunk.push({
        type: line[0],
        content: line.substring(1),
        lineNumber: ++lineNumber
      });

      // Check for block boundaries
      if (!inBlock) {
        const envName = getEnvironmentStart(line.substring(1));
        if (envName) {
          inBlock = true;
          currentEnvironment = envName;
          blockStart = currentHunk.length - 1;
        }
      } else if (isEnvironmentEnd(line.substring(1), currentEnvironment)) {
        // Extract block and reset
        const blockLines = currentHunk.slice(blockStart);
        if (blockLines.length <= maxDiffLines) {
          const block = processBlock(blockLines, currentFile, currentEnvironment, blockStart + lineNumber - blockLines.length);
          if (block) {
            blocks.push(block);
          }
        }
        inBlock = false;
        currentEnvironment = null;
      }
    }

    // Process current hunk if it's getting too large
    if (currentHunk.length >= maxDiffLines) {
      processHunk(currentHunk, currentFile, blocks);
      currentHunk = [];
      inBlock = false;
    }
  }

  // Process any remaining content
  if (currentHunk.length > 0) {
    processHunk(currentHunk, currentFile, blocks);
  }

  return blocks;
}

/**
 * Process a diff hunk to extract LaTeX blocks
 * @private
 */
function processHunk(hunk, file, blocks) {
  let i = 0;
  while (i < hunk.length) {
    const line = hunk[i].content;
    const envName = getEnvironmentStart(line);
    
    if (envName) {
      // Found start of a block, collect until end
      const blockStart = i;
      let j = i + 1;
      while (j < hunk.length && !isEnvironmentEnd(hunk[j].content, envName)) {
        j++;
      }
      
      // If we found a complete block, process it
      if (j < hunk.length) {
        const blockLines = hunk.slice(blockStart, j + 1);
        const block = processBlock(blockLines, file, envName, hunk[blockStart].lineNumber);
        if (block) {
          blocks.push(block);
        }
        i = j;
      }
    }
    i++;
  }
}

/**
 * Process a single LaTeX block
 * @private
 */
function processBlock(lines, file, environment, startLine) {
  // Separate content and context
  const content = [];
  const context = [];
  
  for (const line of lines) {
    if (line.type === '+' || line.type === '-') {
      content.push(line.content);
    } else {
      context.push(line.content);
    }
  }
  
  // Only keep blocks with actual changes
  if (content.length === 0) {
    return null;
  }
  
  return {
    type: environment,
    content,
    context,
    metadata: extractBlockMetadata([...context, ...content]),
    path: file,
    lineStart: startLine,
    lineEnd: startLine + lines.length - 1
  };
}