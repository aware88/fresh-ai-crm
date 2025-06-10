# AI CRM Application

A minimal Next.js 15 CRM application with AI-powered email analysis using OpenAI and Supabase integration.

## Features

- 🚀 Built with Next.js 15 and TypeScript
- 🎨 Modern UI with Tailwind CSS
- 🤖 AI-powered email analysis using OpenAI API
- 🧠 Custom AI Assistant for dispute resolution and more
- 🗄️ Supabase integration for data storage
- 📱 Responsive design for all devices
- 🏢 Custom company branding options

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- OpenAI API key
- Supabase project and credentials

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (Required for Email Analysis and AI Assistant)
OPENAI_API_KEY=your_openai_api_key

# Optional: Set a higher token limit for complex AI Assistant prompts
# OPENAI_MAX_TOKENS=2000
```

### Installation

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

- `/src/app` - Next.js App Router pages
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and API clients
  - `/lib/supabase` - Supabase client configuration
  - `/lib/openai` - OpenAI client and analysis functions

## Email Analysis

The email analysis feature uses OpenAI's GPT-4o model to extract insights from customer emails, including:

- Key points and intentions
- Sentiment analysis
- Customer needs and pain points
- Recommended follow-up actions
- Urgency level

## AI Assistant

The AI Assistant feature provides a flexible interface for getting AI-powered help with various business tasks:

- **Multiple Templates**: Choose from general assistance, dispute resolution, email drafting, or data analysis templates
- **Customer Data Integration**: For dispute resolution, include relevant customer context from your CRM
- **Markdown Formatting**: Responses are formatted with proper headings, lists, and code blocks for readability
- **Copy to Clipboard**: Easily copy AI responses for use in emails, documents, or other applications
- **Custom Prompts**: Enter any prompt to get tailored assistance for your specific business needs

## Deployment

This application can be deployed on Vercel or any other Next.js compatible hosting platform.

```bash
npm run build
```

For more deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
