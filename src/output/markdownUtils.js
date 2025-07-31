/**
 * Creates a collapsible section in GitHub Markdown
 * @param {string} title - Section title
 * @param {string} content - Section content
 * @param {boolean} [expanded=false] - Whether section is expanded by default
 * @returns {string} Formatted markdown
 */
export function createCollapsible(title, content, expanded = false) {
  return `<details${expanded ? ' open' : ''}>
<summary>${title}</summary>

${content}
</details>`;
}

/**
 * Creates a table in GitHub Markdown
 * @param {string[]} headers - Table headers
 * @param {string[][]} rows - Table rows
 * @returns {string} Formatted markdown
 */
export function createTable(headers, rows) {
  const headerRow = `| ${headers.join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const dataRows = rows.map(row => `| ${row.join(' | ')} |`);
  
  return [headerRow, separator, ...dataRows].join('\n');
}

/**
 * Formats a quiz question as markdown
 * @param {Object} question - Quiz question object
 * @param {number} index - Question number
 * @returns {string} Formatted markdown
 */
export function formatQuizQuestion(question, index) {
  const { tf, short } = question;
  
  return `### Question Set ${index + 1}

#### True/False
${tf.question}

<details>
<summary>Show Answer</summary>

**Answer:** ${tf.answer ? 'True' : 'False'}  
**Explanation:** ${tf.explanation}
</details>

#### Short Answer
${short.question}

<details>
<summary>Show Answer Guide</summary>

**Expected Answer:** ${short.answer}  
**Grading Rubric:**  
${short.rubric}
</details>

---`;
}

/**
 * Creates a status badge
 * @param {string} label - Badge label
 * @param {string} status - Badge status
 * @param {string} color - Badge color (green, yellow, red)
 * @returns {string} Formatted markdown
 */
export function createBadge(label, status, color) {
  const colors = {
    green: '2ea44f',
    yellow: 'daa520',
    red: 'd73a4a'
  };
  
  return `![${label}](https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(status)}-${colors[color]})`;
}

/**
 * Formats a list of changes as bullet points
 * @param {string[]} changes - List of changes
 * @param {string} [emoji='•'] - Bullet point emoji
 * @returns {string} Formatted markdown
 */
export function formatChangeList(changes, emoji = '•') {
  if (!changes || changes.length === 0) {
    return '*No changes in this category*';
  }
  
  return changes.map(change => `${emoji} ${change}`).join('\n');
}

/**
 * Creates a file link in GitHub Markdown
 * @param {string} path - File path
 * @param {number} startLine - Start line number
 * @param {number} endLine - End line number
 * @returns {string} Formatted markdown link
 */
export function createFileLink(path, startLine, endLine) {
  return `[\`${path}:${startLine}-${endLine}\`](../../blob/HEAD/${path}#L${startLine}-L${endLine})`;
}

/**
 * Escapes special characters in markdown
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeMarkdown(text) {
  return text.replace(/([*_`~])/g, '\\$1');
}