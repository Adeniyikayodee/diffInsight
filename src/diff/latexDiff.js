import * as core from '@actions/core';

/**
 * Fetches and compares LaTeX files from PR
 * @param {Object} params
 * @param {Object} params.octokit - Initialized Octokit client
 * @param {Object} params.context - GitHub Actions context
 * @returns {Promise<Array<{
 *   path: string,
 *   base: string,
 *   head: string,
 *   baseRef: string,
 *   headRef: string
 * }>>}
 */
export async function fetchLatexDiffs({ octokit, context }) {
  const { owner, repo } = context.repo;
  const pr = context.payload.pull_request;
  
  if (!pr) {
    throw new Error('This action only works on pull requests');
  }
  
  try {
    // Get list of changed files
    const { data: files } = await octokit.rest.pulls.listFiles({
      owner,
      repo,
      pull_number: pr.number
    });
    
    // Filter for LaTeX and related files
    const texFiles = files.filter(file => 
      file.status !== 'removed' && // Skip deleted files
      (file.filename.endsWith('.tex') || 
       file.filename.endsWith('.bib') ||
       file.filename.match(/figures?\/.*\.(pdf|png|jpg|jpeg)$/i))
    );
    
    // Fetch content for each file
    const diffs = await Promise.all(
      texFiles.map(file => fetchFileVersions({
        octokit,
        owner,
        repo,
        path: file.filename,
        baseRef: pr.base.sha,
        headRef: pr.head.sha
      }))
    );
    
    return diffs;
    
  } catch (error) {
    core.error('Failed to fetch LaTeX diffs:', error);
    throw error;
  }
}

/**
 * Fetches base and head versions of a file
 * @private
 */
async function fetchFileVersions({
  octokit,
  owner,
  repo,
  path,
  baseRef,
  headRef
}) {
  // Helper function to fetch file content
  const getContent = async (ref) => {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref
      });
      
      // Handle binary files (images, PDFs)
      if (data.type === 'file' && data.encoding === 'base64') {
        if (path.match(/\.(pdf|png|jpg|jpeg)$/i)) {
          return {
            content: data.content,
            encoding: 'base64'
          };
        }
      }
      
      // Decode content if base64 encoded
      return {
        content: data.content ? Buffer.from(data.content, 'base64').toString() : '',
        encoding: 'utf8'
      };
      
    } catch (error) {
      if (error.status === 404) {
        // File doesn't exist in this ref
        return { content: '', encoding: 'utf8' };
      }
      throw error;
    }
  };
  
  // Fetch both versions
  const [baseVersion, headVersion] = await Promise.all([
    getContent(baseRef),
    getContent(headRef)
  ]);
  
  return {
    path,
    base: baseVersion.content,
    head: headVersion.content,
    baseRef,
    headRef,
    encoding: baseVersion.encoding || headVersion.encoding
  };
}

/**
 * Extracts the main LaTeX file from a set of files
 * @param {Array<{path: string, content: string}>} files - LaTeX files
 * @returns {string|null} Path to main file or null if not found
 */
export function findMainTexFile(files) {
  // Look for common main file indicators
  const mainFilePatterns = [
    // Files that typically indicate main documents
    /main\.tex$/i,
    /paper\.tex$/i,
    /manuscript\.tex$/i,
    /article\.tex$/i,
    
    // Look for \documentclass declaration
    content => /\\documentclass/.test(content),
    
    // Look for document environment
    content => /\\begin{document}/.test(content),
    
    // Look for typical preamble commands
    content => /\\usepackage|\\title|\\author/.test(content)
  ];
  
  // First try filename patterns
  for (const pattern of mainFilePatterns) {
    if (typeof pattern === 'object') { // RegExp
      const match = files.find(f => pattern.test(f.path));
      if (match) return match.path;
    }
  }
  
  // Then try content patterns
  for (const pattern of mainFilePatterns) {
    if (typeof pattern === 'function') {
      const match = files.find(f => pattern(f.head || f.content));
      if (match) return match.path;
    }
  }
  
  // If no clear main file, take the largest .tex file
  const texFiles = files.filter(f => f.path.endsWith('.tex'));
  if (texFiles.length > 0) {
    const largest = texFiles.reduce((a, b) => 
      (b.head || b.content).length > (a.head || a.content).length ? b : a
    );
    return largest.path;
  }
  
  return null;
}

/**
 * Checks if a file is included by another LaTeX file
 * @param {string} path - File to check
 * @param {string} content - Content of potential parent file
 * @returns {boolean}
 */
export function isFileIncluded(path, content) {
  const filename = path.split('/').pop().replace('.tex', '');
  const includePatterns = [
    new RegExp(`\\\\input{.*${filename}}`),
    new RegExp(`\\\\input{.*${filename}\\.tex}`),
    new RegExp(`\\\\include{.*${filename}}`),
    new RegExp(`\\\\include{.*${filename}\\.tex}`)
  ];
  
  return includePatterns.some(pattern => pattern.test(content));
}