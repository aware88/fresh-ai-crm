# Developer Guide

Welcome to the CRM Mind project! This guide will help you set up your development environment and get started with the codebase.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Useful Commands](#useful-commands)

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 16.x or later
- npm 8.x or later (comes with Node.js)
- PostgreSQL 13 or later
- Git
- Docker (optional, for containerized development)

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/fresh-ai-crm.git
   cd fresh-ai-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your local configuration
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

6. **Open the application**
   ```
   http://localhost:3000
   ```

## Project Structure

```
├── .github/                 # GitHub workflows and templates
├── components/              # Reusable UI components
│   ├── alerts/              # Alert-related components
│   ├── common/              # Common UI components
│   └── layout/              # Layout components
├── config/                  # Application configuration
├── docs/                    # Project documentation
├── hooks/                   # Custom React hooks
├── lib/                     # Library code
│   ├── api/                 # API clients
│   ├── auth/                # Authentication logic
│   ├── db/                  # Database access layer
│   ├── services/            # Business logic services
│   └── utils/               # Utility functions
├── migrations/              # Database migrations
├── pages/                   # Next.js pages
│   ├── api/                 # API routes
│   └── ...                  # Other pages
├── public/                  # Static files
├── scripts/                 # Utility scripts
├── styles/                  # Global styles
├── test/                    # Test files
│   ├── e2e/                 # End-to-end tests
│   ├── integration/         # Integration tests
│   └── unit/                # Unit tests
├── types/                   # TypeScript type definitions
├── .env.example             # Example environment variables
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
├── jest.config.js           # Jest configuration
├── next.config.js           # Next.js configuration
├── package.json             # Project dependencies and scripts
└── tsconfig.json            # TypeScript configuration
```

## Development Workflow

### Branching Strategy

We use Git Flow for our branching strategy:

- `main` - Production code (protected)
- `develop` - Integration branch (protected)
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Critical production fixes

### Pull Requests

1. Create a feature branch from `develop`
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them
   ```bash
   git add .
   git commit -m "Add your commit message"
   ```

3. Push your branch and create a pull request
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. Request a code review from at least one team member

5. After approval, merge your PR into `develop`

## Code Style

We use the following tools to maintain code quality:

- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix
```

### Formatting

```bash
# Check formatting
npm run format:check

# Format code
npm run format
```

## Testing

See the [TESTING.md](./TESTING.md) file for detailed testing instructions.

## API Documentation

API documentation is available at `/api/docs` when running the development server.

## Deployment

### Staging

Merging to the `develop` branch automatically deploys to the staging environment.

### Production

Merging to the `main` branch triggers a production deployment.

## Troubleshooting

### Common Issues

#### Database Connection Issues
- Verify your `.env` file has the correct database connection string
- Ensure PostgreSQL is running
- Check if the database exists and is accessible

#### Migration Issues
```bash
# Reset the database and re-run migrations
npm run db:migrate:reset
npm run db:migrate
```

#### Dependency Issues
```bash
# Clear npm cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Useful Commands

### Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Check TypeScript types
tsc --noEmit
```

### Database
```bash
# Run migrations
npm run db:migrate

# Create a new migration
npm run db:migrate:create --name=your_migration_name

# Rollback the last migration
npm run db:migrate:rollback

# Seed the database
npm run db:seed:dev
```

### Linting and Formatting
```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Production
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Getting Help

If you need help or have questions:

1. Check the project documentation
2. Search existing issues
3. Ask in the team chat
4. Create a new issue if you've found a bug
