# Contributing to CRM Mind

Thank you for your interest in contributing to CRM Mind! We welcome all contributions, whether they're bug reports, feature requests, documentation improvements, or code contributions.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Development Environment Setup](#development-environment-setup)
- [Coding Guidelines](#coding-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Review Process](#code-review-process)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [your-email@example.com].

## How Can I Contribute?

### Reporting Bugs

Bugs are tracked as [GitHub issues](https://github.com/yourusername/fresh-ai-crm/issues). Before creating a new issue:

1. **Check if the issue has already been reported** by searching under [Issues](https://github.com/yourusername/fresh-ai-crm/issues).
2. If you're unable to find an open issue addressing the problem, [open a new one](https://github.com/yourusername/fresh-ai-crm/issues/new/choose).

When creating a bug report, please include the following information:

- A clear and descriptive title
- A description of the expected behavior
- A description of the actual behavior
- Steps to reproduce the problem
- Any relevant error messages or logs
- Your environment (OS, browser, Node.js version, etc.)

### Suggesting Enhancements

We welcome suggestions for new features and improvements. Before submitting an enhancement suggestion:

1. Check if a similar suggestion already exists in the [issues](https://github.com/yourusername/fresh-ai-crm/issues).
2. If not, [open a new issue](https://github.com/yourusername/fresh-ai-crm/issues/new/choose) and select the "Feature request" template.

### Your First Code Contribution

1. **Fork the repository** on GitHub.
2. **Clone the forked repository** to your local machine:
   ```bash
   git clone https://github.com/yourusername/fresh-ai-crm.git
   cd fresh-ai-crm
   ```
3. **Set up the development environment** (see [Development Environment Setup](#development-environment-setup)).
4. **Create a new branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/issue-number-description
   ```
5. **Make your changes** following the [Coding Guidelines](#coding-guidelines).
6. **Write tests** for your changes.
7. **Run the test suite** to ensure all tests pass.
8. **Commit your changes** following the [Commit Message Guidelines](#commit-message-guidelines).
9. **Push your changes** to your fork:
   ```bash
   git push origin your-branch-name
   ```
10. **Open a pull request** to the main repository's `develop` branch.

### Pull Requests

When submitting a pull request:

1. Ensure the PR description clearly describes the problem and solution.
2. Include the relevant issue number if applicable.
3. Make sure all tests pass and add new tests as needed.
4. Update the documentation if necessary.
5. Ensure your code follows the project's coding style.

## Development Environment Setup

### Prerequisites

- Node.js 18.x or later
- npm 9.x or later
- PostgreSQL 13 or later
- Git

### Setup Steps

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/fresh-ai-crm.git
   cd fresh-ai-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   # Create a new PostgreSQL database
   createdb fresh_ai_crm_dev
   
   # Run migrations
   npm run db:migrate
   
   # Seed the database with test data (optional)
   npm run db:seed:dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Run tests**
   ```bash
   npm test
   ```

## Coding Guidelines

### TypeScript

- Use TypeScript for all new code.
- Enable strict type checking.
- Use interfaces for object shapes and types for unions/aliases.
- Avoid using `any` type; use `unknown` when the type is truly unknown.

### React Components

- Use functional components with hooks.
- Use TypeScript interfaces for component props.
- Keep components small and focused on a single responsibility.
- Use meaningful component and prop names.

### Styling

- Use Tailwind CSS for styling.
- Follow the design system and existing patterns.
- Use CSS modules for component-specific styles.

### Testing

- Write unit tests for utility functions and React components.
- Write integration tests for critical user flows.
- Use `@testing-library/react` for React component testing.
- Aim for at least 80% code coverage.

### Documentation

- Document complex logic with comments.
- Keep the README and other documentation up to date.
- Add JSDoc comments for public APIs.

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files

### Examples

```
feat(alert): add low stock notification system

Adds a new notification system that sends alerts when inventory levels are low.

Closes #123
```

```
fix(auth): handle expired refresh tokens

Adds proper error handling for expired refresh tokens during authentication.

Fixes #456
```

## Code Review Process

1. A maintainer will review your pull request.
2. The reviewer may request changes or ask questions.
3. Once all feedback has been addressed, the PR will be merged.

## Community

- Join our [Discord server](https://discord.gg/your-discord-invite) to chat with the community.
- Follow us on [Twitter](https://twitter.com/your-twitter-handle) for updates.
- Read our [blog](https://your-blog-url.com) for tutorials and announcements.

## License

By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
