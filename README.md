# Diff-Insight

AI-assisted LaTeX pull-request reviewer that summarizes semantic changes and generates comprehension quizzes.

## Features

- 🔍 Detects changed semantic blocks (sections, equations, figures, theorems)
- 📝 Summarizes changes with domain-aware AI analysis
- ❓ Generates comprehension quiz questions
- 📊 Posts formatted PR comments with collapsible sections
- 📄 Optional latexdiff PDF generation
- 🔒 Privacy-first: supports local LLM deployment

## Quick Start

1. Add this workflow to your LaTeX repository (`.github/workflows/diff-insight.yml`):

\`\`\`yaml
name: Diff-Insight LaTeX Review
on:
  pull_request:
    paths:
      - '**.tex'
      - '**.bib'
      - '**/figures/**'
      - '**/images/**'

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
      
      - name: Run Diff-Insight Analysis
        uses: diff-insight/diff-insight@v1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}  # Optional if using local LLM
\`\`\`

2. For OpenAI integration, add your API key as a repository secret named \`OPENAI_API_KEY\`.

3. That's it! Diff-Insight will now analyze your LaTeX PRs automatically.

## Configuration

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| \`github-token\` | GitHub token for PR access | Yes | \`${{ github.token }}\` |
| \`openai-api-key\` | OpenAI API key | No | - |
| \`model\` | LLM model to use | No | gpt-4-turbo-preview |
| \`latex-diff\` | Generate latexdiff PDF | No | false |
| \`max-diff-lines\` | Max lines per diff chunk | No | 500 |
| \`local-model-endpoint\` | Local LLM endpoint URL | No | - |
| \`show-sources\` | Include diff snippets | No | false |

## Using Local LLM

To use a local LLM instead of OpenAI:

1. Set up [Ollama](https://ollama.ai/) or [LocalAI](https://localai.io/)
2. Configure the workflow:

\`\`\`yaml
- uses: diff-insight/diff-insight@v1
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    model: local-model
    local-model-endpoint: 'http://localhost:11434/v1'
\`\`\`

## License

MIT