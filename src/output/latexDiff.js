import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as artifact from '@actions/artifact';
import * as path from 'path';
import * as fs from 'fs/promises';
import { findMainTexFile } from '../diff/latexDiff.js';

/**
 * Generates PDF diff using latexdiff
 * @param {Object} params
 * @param {Array<{path: string, base: string, head: string}>} params.diffs - LaTeX file diffs
 * @param {string} params.workingDir - Directory for temporary files
 * @returns {Promise<string>} URL to generated PDF
 */
export async function generateLatexDiff({ diffs, workingDir }) {
  try {
    // Create working directory
    const baseDir = path.join(workingDir, 'base');
    const headDir = path.join(workingDir, 'head');
    const diffDir = path.join(workingDir, 'diff');
    
    await Promise.all([
      fs.mkdir(baseDir, { recursive: true }),
      fs.mkdir(headDir, { recursive: true }),
      fs.mkdir(diffDir, { recursive: true })
    ]);

    // Write files to respective directories
    await Promise.all(diffs.map(async (diff) => {
      const relativePath = diff.path;
      const basePath = path.join(baseDir, relativePath);
      const headPath = path.join(headDir, relativePath);
      
      await fs.mkdir(path.dirname(basePath), { recursive: true });
      await fs.mkdir(path.dirname(headPath), { recursive: true });
      
      await Promise.all([
        fs.writeFile(basePath, diff.base),
        fs.writeFile(headPath, diff.head)
      ]);
    }));

    // Find main TeX file
    const mainFile = findMainTexFile(diffs);
    if (!mainFile) {
      throw new Error('Could not identify main LaTeX file');
    }

    // Run latexdiff
    const baseMain = path.join(baseDir, mainFile);
    const headMain = path.join(headDir, mainFile);
    const diffMain = path.join(diffDir, \`diff_\${path.basename(mainFile)}\`);
    
    await runLatexDiff(baseMain, headMain, diffMain);

    // Compile PDF
    await compilePDF(diffMain, diffDir);

    // Upload as artifact
    const pdfPath = diffMain.replace('.tex', '.pdf');
    const artifactClient = artifact.create();
    const artifactName = 'latex-diff';
    
    await artifactClient.uploadArtifact(
      artifactName,
      [pdfPath],
      diffDir,
      { continueOnError: false }
    );

    return \`\${process.env.GITHUB_SERVER_URL}/\${process.env.GITHUB_REPOSITORY}/actions/runs/\${process.env.GITHUB_RUN_ID}/artifacts/\${artifactName}\`;
    
  } catch (error) {
    core.error('Failed to generate LaTeX diff:', error);
    throw error;
  }
}

/**
 * Runs latexdiff on two files
 * @private
 */
async function runLatexDiff(oldFile, newFile, outputFile) {
  try {
    // Check if latexdiff is installed
    await exec.exec('which', ['latexdiff']);
  } catch {
    throw new Error('latexdiff not found. Please install texlive-full package.');
  }

  const options = [
    '--math-markup=2',  // Highlight math changes
    '--graphics-markup=2',  // Track graphics
    '--flatten',  // Handle input/include
    '--append-context2cmd=abstract', // Handle abstract environment
    '--config="PICTUREENV=(?:picture|tikzpicture|figure|DIFnomarkup)"'
  ];

  await exec.exec('latexdiff', [
    ...options,
    oldFile,
    newFile,
    '-o',
    outputFile
  ]);
}

/**
 * Compiles LaTeX to PDF
 * @private
 */
async function compilePDF(texFile, workingDir) {
  try {
    // Check if pdflatex is installed
    await exec.exec('which', ['pdflatex']);
  } catch {
    throw new Error('pdflatex not found. Please install texlive-full package.');
  }

  const options = [
    '-interaction=nonstopmode',
    '-halt-on-error',
    \`-output-directory=\${workingDir}\`
  ];

  // Run pdflatex twice for references
  for (let i = 0; i < 2; i++) {
    await exec.exec('pdflatex', [...options, texFile], {
      cwd: workingDir
    });
  }

  // Check if PDF was generated
  const pdfPath = texFile.replace('.tex', '.pdf');
  try {
    await fs.access(pdfPath);
  } catch {
    throw new Error('PDF generation failed. Check LaTeX logs for details.');
  }
}