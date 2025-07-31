# Diff-Insight Examples

This directory contains example LaTeX files and pull requests demonstrating Diff-Insight's features.

## Basic Example

[PR #1: Basic LaTeX Changes](examples/basic/README.md)
- Simple text changes
- Section additions
- Figure updates

## Mathematical Content

[PR #2: Theorem Changes](examples/math/README.md)
- Equation modifications
- Theorem updates
- Proof changes

## Complex Documents

[PR #3: Multi-File Changes](examples/complex/README.md)
- Changes across multiple files
- Bibliography updates
- Figure replacements

## Using Local LLM

[PR #4: Local Model Example](examples/local-llm/README.md)
- Setup with Ollama
- Custom model configuration
- Performance comparison

## Common Use Cases

### 1. Adding New Results

\`\`\`latex
% Before
\\section{Results}
Our experiments show X.

% After
\\section{Results}
Our experiments show X.
\\subsection{New Findings}
Further analysis reveals Y, which suggests Z.
\`\`\`

Diff-Insight Output:
![New Results](../images/new-results.png)

### 2. Updating Equations

\`\`\`latex
% Before
\\begin{equation}
E = mc^2
\\end{equation}

% After
\\begin{equation}
E = mc^2 + \\Delta E
\\end{equation}
\`\`\`

Diff-Insight Output:
![Equation Update](../images/equation-update.png)

### 3. Modifying Figures

\`\`\`latex
% Before
\\begin{figure}
\\includegraphics{old-graph.pdf}
\\caption{Previous results}
\\end{figure}

% After
\\begin{figure}
\\includegraphics{new-graph.pdf}
\\caption{Updated results with improved accuracy}
\\end{figure}
\`\`\`

Diff-Insight Output:
![Figure Update](../images/figure-update.png)

## Quiz Examples

### True/False Questions

Good examples:
- "The updated equation adds a correction term ∆E"
- "The new results contradict the previous findings"
- "Figure 2 shows improved accuracy in the experimental data"

Bad examples:
- "The paper was modified" (too vague)
- "There are new equations" (not specific enough)
- "Changes were made to the results" (lacks detail)

### Short Answer Questions

Good examples:
- "Explain how the addition of ∆E affects the energy calculation"
- "What key improvement is shown in the updated Figure 2?"
- "How do the new findings in section 4.2 relate to the previous results?"

Bad examples:
- "What changed?" (too broad)
- "Describe the new equation" (too simple)
- "Why was this updated?" (lacks context)

## Best Practices

1. **Atomic Changes**
   - Keep changes focused and related
   - Group similar modifications together
   - Use clear commit messages

2. **Clear Documentation**
   - Update figure captions meaningfully
   - Add explanatory text for major changes
   - Cross-reference related sections

3. **Quality Checks**
   - Run latexdiff before committing
   - Review Diff-Insight summaries
   - Complete comprehension quizzes

## Common Issues

1. **Large Diffs**
   - Split into smaller PRs
   - Use subfiles or chapters
   - Focus on related changes

2. **Missing Context**
   - Include surrounding text
   - Reference related equations
   - Link to relevant sections

3. **Complex Math**
   - Break into smaller steps
   - Add explanatory text
   - Use consistent notation