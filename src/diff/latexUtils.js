/**
 * Common LaTeX environments we want to track
 */
export const LATEX_ENVIRONMENTS = [
  'abstract',
  'theorem',
  'lemma',
  'proposition',
  'definition',
  'proof',
  'equation',
  'align',
  'figure',
  'table',
  'section',
  'subsection',
  'subsubsection',
];

/**
 * Regex patterns for LaTeX parsing
 */
export const PATTERNS = {
  // Matches environment begin/end: \begin{name} or \end{name}
  ENV_MARKER: /\\(?:begin|end)\{([^}]+)\}/,
  
  // Matches section commands: \section{title}, \subsection{title}, etc.
  SECTION_CMD: /\\(?:sub)*section\{([^}]+)\}/,
  
  // Matches inline math: $...$ or \(...\)
  INLINE_MATH: /\$([^$]+)\$|\\[\(\)]([^\\]+)\\[\(\)]/,
  
  // Matches display math: $$...$$ or \[...\]
  DISPLAY_MATH: /\$\$([^$]+)\$\$|\\[\[\]]([^\\]+)\\[\[\]]/,
  
  // Matches citations: \cite{key} or \citep{key} etc.
  CITATION: /\\cite[pt]?\{([^}]+)\}/,
  
  // Matches labels: \label{name}
  LABEL: /\\label\{([^}]+)\}/,
};

/**
 * Determines if a line starts a new LaTeX block
 * @param {string} line The line to check
 * @returns {string|null} Environment name if block start, null otherwise
 */
export function getEnvironmentStart(line) {
  const match = line.match(PATTERNS.ENV_MARKER);
  if (match && match[0].startsWith('\\begin') && LATEX_ENVIRONMENTS.includes(match[1])) {
    return match[1];
  }
  
  // Check for section commands
  const sectionMatch = line.match(PATTERNS.SECTION_CMD);
  if (sectionMatch) {
    return 'section';
  }
  
  return null;
}

/**
 * Checks if a line ends a LaTeX block
 * @param {string} line The line to check
 * @param {string} environment The current environment name
 * @returns {boolean}
 */
export function isEnvironmentEnd(line, environment) {
  if (environment === 'section') {
    // Sections end at the next section or environment
    return line.match(PATTERNS.SECTION_CMD) || line.match(/\\begin\{/);
  }
  
  const match = line.match(PATTERNS.ENV_MARKER);
  return match && match[0].startsWith('\\end') && match[1] === environment;
}

/**
 * Extracts metadata from a LaTeX block
 * @param {string[]} lines The block content
 * @returns {{
 *   title: string|null,
 *   label: string|null,
 *   citations: string[],
 *   hasMath: boolean
 * }}
 */
export function extractBlockMetadata(lines) {
  const metadata = {
    title: null,
    label: null,
    citations: [],
    hasMath: false
  };
  
  const content = lines.join('\n');
  
  // Find label if present
  const labelMatch = content.match(PATTERNS.LABEL);
  if (labelMatch) {
    metadata.label = labelMatch[1];
  }
  
  // Check for math content
  metadata.hasMath = PATTERNS.INLINE_MATH.test(content) || 
                     PATTERNS.DISPLAY_MATH.test(content);
  
  // Extract citations
  const citations = content.match(new RegExp(PATTERNS.CITATION, 'g')) || [];
  metadata.citations = citations.map(cite => {
    const match = cite.match(PATTERNS.CITATION);
    return match[1];
  });
  
  // Try to find a title from section command or label
  const sectionMatch = content.match(PATTERNS.SECTION_CMD);
  if (sectionMatch) {
    metadata.title = sectionMatch[1];
  }
  
  return metadata;
}