# Diff-Insight

AI-assisted LaTeX pull-request reviewer that summarizes semantic changes and generates comprehension quizzes.

[![Test Status](https://img.shields.io/badge/tests-81%2F81%20passing-brightgreen)](package.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](package.json)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Features | Quick Start | Configuration | Examples | Contributing

## Features

- ✨ **Smart LaTeX Diff Analysis** - Intelligently extracts and analyzes LaTeX environments, equations, theorems, and figures
- 🤖 **AI-Powered Summaries** - Generates semantic summaries of changes including new claims, modified equations, and impact analysis
- 📝 **Comprehension Quizzes** - Auto-generates true/false and short-answer questions to verify understanding of changes
- 🔒 **Privacy-First** - Supports both OpenAI and local LLM endpoints (Ollama, LocalAI, etc.)
- ⚡ **High Performance** - Processes most PRs in under 30 seconds
- 📊 **Code Coverage** - 85% test coverage with 81/81 tests passing across 13 test suites
- 🛡️ **Production Ready** - Fully tested and bundled (5.2MB) for reliable GitHub Actions deployment

## Quick Start

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
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
```

2. Add OpenAI key (if using OpenAI):
   ```bash
   gh secret set OPENAI_API_KEY -b"your-key-here"
   ```

3. Open a PR with LaTeX changes to see it in action.

## Configuration

| Input | Description | Required | Default |
|-------|-------------|:--------:|---------|
| `github-token` | GitHub token | Yes | `${{ github.token }}` |
| `openai-api-key` | OpenAI API key | No | - |
| `model` | LLM model | No | gpt-4-turbo-preview |
| `latex-diff` | Generate PDF diff | No | false |
| `max-diff-lines` | Lines per chunk | No | 500 |
| `local-model-endpoint` | Local LLM URL | No | - |
| `show-sources` | Show snippets | No | false |

## Examples

### Example 1: Theorem Updates

<details>
<summary>LaTeX Changes</summary>

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

Summary:
- Strengthened hypothesis from continuous to continuously differentiable
- Changed conclusion from zero-finding to Mean Value Theorem
- Added explicit equation for the conclusion

Impact:
- Fundamentally changes the theorem from Intermediate Value to Mean Value
- Requires stronger assumptions on the function
- Provides more specific analytical information

</details>

### Example 2: Results Section

<details>
<summary>LaTeX Changes</summary>

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

Summary:
- Updated accuracy plot to include confidence intervals
- Enhanced figure caption with statistical details
- Improved accuracy: 94.5% ± 0.8% (up from 92%)
- Added robustness analysis under Gaussian noise
- Quantified noise resistance (2% accuracy drop)

Impact:
- Stronger statistical validation of results
- New evidence for model robustness
- More comprehensive performance analysis

</details>

### Example 3: Mathematical Derivation

<details>
<summary>LaTeX Changes</summary>

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

Summary:
- Added relativistic correction factor γ
- Expanded equation to show velocity dependence
- Included Lorentz factor definition
- Added proof section explaining derivation
- Introduced relativistic mass concept
- Connected to Lorentz factor

Impact:
- Makes relativistic effects explicit
- Provides mathematical justification
- Improves pedagogical value

</details>

### Example 4: Bibliography Updates

<details>
<summary>LaTeX Changes</summary>

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

Summary:
- Added new reference (Smith et al., 2024)
- Updated Jones (2023) with publication details
- Removed "in press" status

Impact:
- Incorporates recent research findings
- Updates reference to final published version
- Strengthens literature support

</details>

## Local LLM Setup

Use Ollama or LocalAI instead of OpenAI:

```yaml
- uses: diff-insight/diff-insight@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    model: local-model
    local-model-endpoint: 'http://localhost:11434/v1'
```

## Performance & Quality Metrics

| Metric | Value |
|--------|-------|
| **Test Coverage** | 85.56% |
| **Tests Passing** | 81/81 (100%) |
| **Test Suites** | 13/13 (100%) |
| **Build Size** | 5.2 MB (bundled) |
| **Avg Processing Time** | < 30s per PR |
| **Node Version** | ≥ 20 |
| **Framework** | Jest with Babel |

## Architecture

**Core Modules:**
- `config/` - Settings, rate limiting, input validation
- `diff/` - LaTeX block extraction, diff generation
- `llm/` - AI-powered summarization and quiz generation
- `output/` - Comment rendering, markdown formatting

**Key Technologies:**
- ES6 modules with Babel transformation
- @actions/core & @actions/github for GitHub integration
- OpenAI API + local LLM endpoint support
- Jest testing framework (100% test pass rate)
- @vercel/ncc for production bundling

## Development

Requirements:
- Node.js >= 20
- npm >= 9

```bash
# Setup
git clone https://github.com/diff-insight/diff-insight.git
cd diff-insight
npm install

# Test (81/81 tests, 13/13 suites passing)
npm test
npm test -- --watch
npm test -- --coverage

# Build (produces 5.2MB bundled action)
npm run build

# Development watch mode
npm run dev
```

### Test Coverage

```
Test Results:  81/81 tests passing (100%)
Test Suites:   13/13 passing (100%)
Code Coverage: 85.56% statements, 78.5% branches
Core Modules:  95%+ coverage on config, diff, output
```

**Test Breakdown:**
- ✅ LaTeX utilities (latexUtils): 100% coverage
- ✅ Markdown generation (markdownUtils): 100% coverage
- ✅ LaTeX diff extraction: 97.43% coverage
- ✅ Configuration (settings, rateLimiter): 95%+ coverage
- ✅ Output rendering (renderComment): 93.47% coverage
- ✅ LLM integration (llmUtils, summarize, quiz): 72-86% coverage
- ✅ Performance tests: All rate limiting tests passing

## Contributing

Contributions welcome! See our [Contributing Guide](CONTRIBUTING.md) for details.

Before submitting PRs, ensure:
- All tests pass: `npm test`
- Code builds successfully: `npm run build`
- Coverage meets 85% threshold

## Troubleshooting

**Tests Failing?**
```bash
npm install          # Ensure dependencies are up-to-date
npm test            # Run full test suite
npm test -- --verbose  # See detailed output
```

**Build Issues?**
```bash
rm -rf dist node_modules
npm install
npm run build
```

**LLM Integration Problems?**
- Verify API key is set in GitHub secrets
- Check local endpoint URL if using self-hosted LLM
- Review action logs for API error messages

## License

MIT © Diff-Insight Team