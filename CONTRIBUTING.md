# Contributing to Diff-Insight

First off, thank you for considering contributing to Diff-Insight! It's people like you that make Diff-Insight such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the issue list as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if relevant

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

* Fill in the required template
* Do not include issue numbers in the PR title
* Include screenshots and animated GIFs in your pull request whenever possible
* Follow the JavaScript styleguide
* Include thoughtfully-worded, well-structured tests
* Document new code
* End all files with a newline

## Development Process

1. Fork the repo
2. Create a new branch (\`git checkout -b feature/amazing-feature\`)
3. Make your changes
4. Run the tests (\`npm run test\`)
5. Commit your changes (\`git commit -m 'Add amazing feature'\`)
6. Push to the branch (\`git push origin feature/amazing-feature\`)
7. Create a Pull Request

### Setup Development Environment

\`\`\`bash
# Clone your fork
git clone git@github.com:Adeniyikayodee/diffInsight.git
cd diff-insight

# Install dependencies
npm install

# Run tests
npm run test

# Build
npm run build
\`\`\`

### Testing

We use Jest for testing. Please ensure all tests pass before submitting a PR:

\`\`\`bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance
\`\`\`

### Code Style

We use ESLint and Prettier to maintain code quality. Before committing, run:

\`\`\`bash
# Format code
npm run format

# Check linting
npm run lint
\`\`\`

## Project Structure

The repository is organized as follows:

```
diff-insight/
├── src/
│   ├── config/         Configuration and settings
│   ├── diff/           LaTeX diff extraction and helpers
│   ├── llm/            LLM integration and quiz generation
│   ├── output/         Comment rendering and PDF diff
│   ├── __mocks__/      Jest mocks for testing
│   ├── __tests__/      Integration and performance tests
│   └── index.js        Main entry point
├── docs/               Documentation and example outputs
│   ├── images/         Screenshots and diagrams
│   └── examples/       Example LaTeX files and PRs
├── .github/            GitHub Actions workflows
├── action.yml          Action definition
├── package.json        Project metadata and dependencies
├── jest.config.js      Jest configuration
├── jest.setup.js       Jest setup file
├── .gitignore          Git ignore rules
├── LICENSE             License file
└── README.md           Main documentation
```

## Creating Examples

When adding new features, please include examples in the \`examples/\` directory:

1. Create a new LaTeX file with relevant content
2. Create a branch and make changes
3. Create a PR
4. Add screenshots of the Diff-Insight output
5. Update documentation if needed

## Documentation

* Use JSDoc comments for all functions
* Update README.md for new features
* Add examples for new functionality
* Include screenshots where helpful

## Questions?

Feel free to open an issue with the "question" label if you need help.
