import { generateLatexDiff } from '../latexDiff.js';
import * as exec from '@actions/exec';
import * as io from '@actions/io';
import * as artifact from '@actions/artifact';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock external modules
jest.mock('@actions/exec');
jest.mock('@actions/io');
jest.mock('@actions/artifact');
jest.mock('fs/promises');

// Mock environment variables
process.env.GITHUB_SERVER_URL = 'https://github.com';
process.env.GITHUB_REPOSITORY = 'test/repo';
process.env.GITHUB_RUN_ID = '12345';

describe('LaTeX Diff Generation', () => {
  // Sample LaTeX files
  const mockDiffs = [
    {
      path: 'main.tex',
      base: '\\documentclass{article}\\begin{document}Old\\end{document}',
      head: '\\documentclass{article}\\begin{document}New\\end{document}'
    },
    {
      path: 'sections/intro.tex',
      base: 'Old intro',
      head: 'New intro'
    }
  ];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock filesystem operations
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);
    fs.access.mockResolvedValue(undefined);
    
    // Mock successful command execution
    exec.exec.mockImplementation((cmd) => {
      if (cmd === 'which') return Promise.resolve(0);
      return Promise.resolve(0);
    });
    
    // Mock artifact upload
    artifact.create.mockReturnValue({
      uploadArtifact: jest.fn().mockResolvedValue({
        artifactName: 'latex-diff',
        size: 1024
      })
    });
  });

  test('generates PDF diff successfully', async () => {
    const workingDir = '/tmp/diff-test';
    const url = await generateLatexDiff({
      diffs: mockDiffs,
      workingDir
    });

    // Check directories were created
    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('base'),
      expect.any(Object)
    );
    expect(fs.mkdir).toHaveBeenCalledWith(
      expect.stringContaining('head'),
      expect.any(Object)
    );

    // Check files were written
    expect(fs.writeFile).toHaveBeenCalledTimes(4); // 2 files × 2 versions

    // Check latexdiff was run
    expect(exec.exec).toHaveBeenCalledWith(
      'latexdiff',
      expect.arrayContaining([
        '--math-markup=2',
        expect.stringContaining('main.tex')
      ])
    );

    // Check PDF was compiled
    expect(exec.exec).toHaveBeenCalledWith(
      'pdflatex',
      expect.arrayContaining([
        '-interaction=nonstopmode',
        expect.stringContaining('main.tex')
      ]),
      expect.any(Object)
    );

    // Check artifact was uploaded
    expect(artifact.create).toHaveBeenCalled();
    
    // Check returned URL
    expect(url).toContain('artifacts/latex-diff');
  });

  test('handles missing latexdiff', async () => {
    exec.exec.mockRejectedValueOnce(new Error('Command not found'));

    await expect(generateLatexDiff({
      diffs: mockDiffs,
      workingDir: '/tmp/test'
    })).rejects.toThrow('latexdiff not found');
  });

  test('handles missing pdflatex', async () => {
    exec.exec
      .mockResolvedValueOnce(0) // latexdiff check passes
      .mockResolvedValueOnce(0) // latexdiff runs
      .mockRejectedValueOnce(new Error('Command not found')); // pdflatex fails

    await expect(generateLatexDiff({
      diffs: mockDiffs,
      workingDir: '/tmp/test'
    })).rejects.toThrow('pdflatex not found');
  });

  test('handles PDF compilation failure', async () => {
    // Mock PDF file not being created
    fs.access.mockRejectedValue(new Error('File not found'));

    await expect(generateLatexDiff({
      diffs: mockDiffs,
      workingDir: '/tmp/test'
    })).rejects.toThrow('PDF generation failed');
  });

  test('handles missing main file', async () => {
    await expect(generateLatexDiff({
      diffs: [{ path: 'aux.tex', base: '', head: '' }],
      workingDir: '/tmp/test'
    })).rejects.toThrow('Could not identify main LaTeX file');
  });

  test('handles artifact upload failure', async () => {
    artifact.create.mockReturnValue({
      uploadArtifact: jest.fn().mockRejectedValue(new Error('Upload failed'))
    });

    await expect(generateLatexDiff({
      diffs: mockDiffs,
      workingDir: '/tmp/test'
    })).rejects.toThrow('Upload failed');
  });
});