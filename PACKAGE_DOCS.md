# Project Dependencies Documentation

This document provides an overview of the project's dependencies, organized by category and purpose.

## Core Framework & Runtime

- **next**: 15.3.3 - The React framework for production
- **react**: ^19.0.0 - React core library
- **react-dom**: ^19.0.0 - React DOM for web rendering
- **typescript**: ^5 - TypeScript compiler

## UI Components & Styling

### Chakra UI
- **@chakra-ui/react**: ^3.20.0 - Component library for building accessible React applications
- **@emotion/react**: ^11.14.0 - CSS-in-JS library required by Chakra UI
- **@emotion/styled**: ^11.14.0 - Styled components for Chakra UI
- **framer-motion**: ^12.17.0 - Animation library for React components

### Radix UI Primitives
- **@radix-ui/react-avatar**: ^1.1.10 - Accessible avatar component
- **@radix-ui/react-checkbox**: ^1.3.2 - Accessible checkbox component
- **@radix-ui/react-dialog**: ^1.1.14 - Accessible dialog/modal component
- **@radix-ui/react-dropdown-menu**: ^2.1.15 - Accessible dropdown menu component
- **@radix-ui/react-label**: ^2.1.7 - Accessible form label component
- **@radix-ui/react-progress**: ^1.1.7 - Progress indicator component
- **@radix-ui/react-select**: ^2.2.5 - Accessible select component
- **@radix-ui/react-separator**: ^1.1.7 - Separator/horizontal rule component
- **@radix-ui/react-slot**: ^1.2.3 - Slot component for composition
- **@radix-ui/react-tabs**: ^1.1.12 - Accessible tabs component
- **@radix-ui/react-toast**: ^1.2.14 - Toast notification component

### Icons
- **lucide-react**: ^0.513.0 - Beautiful & consistent icon toolkit

### Styling Utilities
- **tailwind-merge**: ^3.3.1 - Utility for merging Tailwind CSS classes
- **clsx**: ^2.1.1 - Utility for constructing className strings conditionally
- **class-variance-authority**: ^0.7.1 - Type-safe utility for creating variants

## Data Management & API

- **@supabase/supabase-js**: ^2.50.0 - Client library for Supabase
- **axios**: ^1.9.0 - Promise based HTTP client
- **uuid**: ^11.1.0 - Generate RFC-compliant UUIDs

## Content Processing

- **cheerio**: ^1.1.0 - HTML/XML parsing (jQuery for server)
- **date-fns**: ^4.1.0 - Modern date utility library
- **formidable**: ^3.5.4 - File upload handling
- **marked**: ^15.0.12 - Markdown parser and compiler
- **react-markdown**: ^10.1.0 - React component for rendering markdown
- **xlsx**: ^0.18.5 - Excel file parsing and generation

## AI & Machine Learning

- **openai**: ^5.1.1 - Official OpenAI API client

## Development Dependencies

- **@eslint/eslintrc**: ^3 - ESLint configuration utilities
- **@tailwindcss/postcss**: ^4 - PostCSS plugin for Tailwind CSS
- **@types/marked**: ^5.0.2 - TypeScript definitions for marked
- **@types/node**: ^20 - TypeScript definitions for Node.js
- **@types/react**: ^19 - TypeScript definitions for React
- **@types/react-dom**: ^19 - TypeScript definitions for React DOM
- **eslint**: ^9 - JavaScript/TypeScript linter
- **eslint-config-next**: 15.3.3 - ESLint configuration for Next.js
- **tailwindcss**: ^4 - Utility-first CSS framework

## Environment Requirements

- **Node.js**: >=18.0.0
- **npm**: >=8.0.0

## Browser Support

### Production
- ">0.2%" market share
- Not dead browsers
- Not Opera Mini

### Development
- Last version of Chrome
- Last version of Firefox
- Last version of Safari

## Scripts

- `dev`: Start development server with Turbopack
- `build`: Create an optimized production build
- `start`: Start the production server
- `lint`: Run ESLint
- `db:seed`: Seed the database with initial data
- `db:seed:contacts`: Seed contacts data
- `db:seed:interactions`: Seed interactions data
- `db:seed:files`: Seed files data
