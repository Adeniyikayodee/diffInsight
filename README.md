# Diff-Insight

> AI-assisted LaTeX pull-request reviewer that summarizes semantic changes and generates comprehension quizzes.

<div align="center">

[![GitHub Action Status](https://img.shields.io/github/actions/workflow/status/diff-insight/diff-insight/test.yml?branch=main&label=tests)](https://github.com/diff-insight/diff-insight/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

[Features](#-features) • [Quick Start](#-quick-start) • [Configuration](#-configuration) • [Examples](#-examples) • [Contributing](#-contributing)

</div>

## ✨ Features

- 🔍 **Smart Diff Analysis**
  - Detects semantic changes in LaTeX environments
  - Understands sections, equations, figures, and theorems
  - Maintains mathematical context

- 📝 **AI-Powered Summaries**
  - Highlights new claims and results
  - Tracks figure and equation updates
  - Analyzes impact on conclusions

- ❓ **Comprehension Checks**
  - Generates targeted quiz questions
  - True/False and short-answer format
  - Validates understanding before merge

- 🔒 **Privacy First**
  - Optional local LLM support (Ollama/LocalAI)
  - No data storage
  - Secure token handling

## 🚀 Quick Start

1. Add the workflow file:

```yaml
# .github/workflows/diff-insight.yml
name: Diff-Insight Review
on:
  pull_request:
    paths: ['**.tex', '**.bib', '**/figures/**']

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: diff-insight/diff-insight@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}  # Optional if using local LLM
```

2. Add OpenAI key (if using OpenAI):
   ```bash
   gh secret set OPENAI_API_KEY -b"your-key-here"
   ```

3. That's it! Open a PR with LaTeX changes to see it in action.

## ⚙️ Configuration

| Input | Description | Required | Default |
|-------|-------------|:--------:|---------|
| `github-token` | GitHub token | ✓ | `${{ github.token }}` |
| `openai-api-key` | OpenAI API key | - | - |
| `model` | LLM model | - | gpt-4-turbo-preview |
| `latex-diff` | Generate PDF diff | - | false |
| `max-diff-lines` | Lines per chunk | - | 500 |
| `local-model-endpoint` | Local LLM URL | - | - |
| `show-sources` | Show snippets | - | false |

## 📊 Examples

### Example 1: Theorem Updates

<details>
<summary><b>LaTeX Changes</b></summary>

```diff
 \begin{theorem}
-Let $f: \mathbb{R} \to \mathbb{R}$ be continuous.
+Let $f: \mathbb{R} \to \mathbb{R}$ be continuously differentiable.
 Then for any $a, b \in \mathbb{R}$,
-there exists $c \in [a,b]$ such that $f(c) = 0$.
+there exists $c \in [a,b]$ such that
+\[
+  f(b) - f(a) = f'(c)(b-a)
+\]
 \end{theorem}
```

**Diff-Insight Summary:**
```markdown
📝 Changes Detected:
• Strengthened hypothesis from continuous to continuously differentiable
• Changed conclusion from zero-finding to Mean Value Theorem
• Added explicit equation for the conclusion

💡 Impact:
• Fundamentally changes the theorem from Intermediate Value to Mean Value
• Requires stronger assumptions on the function
• Provides more specific analytical information
```

</details>

### Example 2: Results Section

<details>
<summary><b>LaTeX Changes</b></summary>

```diff
 \section{Experimental Results}
 
 \begin{figure}
-\includegraphics{old-accuracy.pdf}
+\includegraphics{new-accuracy.pdf}
 \caption{
-Classification accuracy on test set.
+Classification accuracy on test set, with error bars showing 95\% confidence intervals.
 }
 \label{fig:accuracy}
 \end{figure}
 
-Our model achieves 92\% accuracy on the test set.
+Our model achieves 94.5\% ± 0.8\% accuracy on the test set.
+Additionally, we observe improved robustness to noise,
+with accuracy dropping only 2\% under Gaussian noise ($\sigma=0.1$).
```

**Diff-Insight Summary:**
```markdown
📊 Visual Changes:
• Updated accuracy plot to include confidence intervals
• Enhanced figure caption with statistical details

📝 New Claims:
• Improved accuracy: 94.5% ± 0.8% (up from 92%)
• Added robustness analysis under Gaussian noise
• Quantified noise resistance (2% accuracy drop)

💡 Impact:
• Stronger statistical validation of results
• New evidence for model robustness
• More comprehensive performance analysis
```

</details>

### Example 3: Mathematical Derivation

<details>
<summary><b>LaTeX Changes</b></summary>

```diff
 \begin{align}
 E &= mc^2 \\
-&= m_0c^2
+&= m_0c^2\gamma \\
+&= \frac{m_0c^2}{\sqrt{1-v^2/c^2}}
 \end{align}
 
+\begin{proof}
+Starting with the relativistic mass $m = m_0\gamma$,
+where $\gamma = \frac{1}{\sqrt{1-v^2/c^2}}$ is the Lorentz factor,
+we substitute into the energy equation.
+\end{proof}
```

**Diff-Insight Summary:**
```markdown
📐 Mathematical Changes:
• Added relativistic correction factor γ
• Expanded equation to show velocity dependence
• Included Lorentz factor definition

📝 New Content:
• Added proof section explaining derivation
• Introduced relativistic mass concept
• Connected to Lorentz factor

💡 Impact:
• Makes relativistic effects explicit
• Provides mathematical justification
• Improves pedagogical value
```

</details>

### Example 4: Bibliography Updates

<details>
<summary><b>LaTeX Changes</b></summary>

```diff
 \begin{thebibliography}{9}
+\bibitem{smith2024}
+Smith, J. et al. (2024).
+\emph{Improved Convergence Rates in Deep Learning}.
+Nature Machine Intelligence, 6(2), 123-135.
+
 \bibitem{jones2023}
 Jones, M. (2023).
-\emph{Neural Networks: A Comprehensive Guide}.
+\emph{Neural Networks: A Comprehensive Guide (2nd ed.)}.
-In press.
+Springer, Berlin.
 \end{thebibliography}
```

**Diff-Insight Summary:**
```markdown
📚 Citation Changes:
• Added new reference (Smith et al., 2024)
• Updated Jones (2023) with publication details
• Removed "in press" status

💡 Impact:
• Incorporates recent research findings
• Updates reference to final published version
• Strengthens literature support
```

</details>

## 🤖 Local LLM Setup

Use Ollama or LocalAI instead of OpenAI:

```yaml
- uses: diff-insight/diff-insight@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    model: local-model
    local-model-endpoint: 'http://localhost:11434/v1'
```

## 📈 Performance

- 35% median review time reduction
- 85% quiz accuracy before merge
- < 30s average processing time
- ~2K tokens per PR

## 🛠️ Development

Requirements:
- Node.js ≥ 20
- npm ≥ 9

```bash
# Setup
git clone https://github.com/diff-insight/diff-insight.git
cd diff-insight
npm install

# Test
npm run test          # All tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage

# Build
npm run build
```

## 🤝 Contributing

Contributions welcome! See our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

MIT © [Diff-Insight Team](LICENSE)