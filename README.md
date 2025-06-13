# CRM Mind

A powerful AI-driven CRM platform that helps you understand and manage customer relationships with intelligent insights and automation.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-13+-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)](https://openai.com/)

## ✨ Features

- 🚀 **Modern Stack**: Built with Next.js 15, TypeScript, and Tailwind CSS
- 🤖 **AI-Powered Insights**: Leverage OpenAI's GPT models for email analysis and customer insights
- 🔒 **Secure & Protected**: Built-in rate limiting and API usage controls
- 🛠 **Developer Friendly**: Well-documented codebase with TypeScript support
- 📱 **Responsive Design**: Works seamlessly across all device sizes
- 🏢 **Custom Branding**: Easy theming and customization options
- 📊 **Data Management**: Integrated with Supabase for reliable data storage

## 🚀 Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm 9.0.0 or later
- A Supabase account (for database)
- An OpenAI API key (for AI features)
- A Netlify account (for deployment)

### Local Development

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/fresh-ai-crm.git
   cd fresh-ai-crm
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env.local
   ```
   Then update the values in `.env.local` with your actual API keys and configuration.

4. Run the development server
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment

### Netlify Deployment

1. **Prepare your repository**
   - Push your code to a GitHub, GitLab, or Bitbucket repository

2. **Deploy to Netlify**
   - Log in to your [Netlify](https://app.netlify.com/) account
   - Click "Add new site" > "Import an existing project"
   - Connect to your Git provider and select your repository
   - Configure the build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Click "Deploy site"

3. **Set up environment variables**
   - Go to "Site settings" > "Build & deploy" > "Environment"
   - Add all the environment variables from your `.env.local` file
   - Make sure to mark sensitive variables as "Sensitive Variable"

4. **Enable Server-Side Features**
   - The site should automatically detect and use the `@netlify/plugin-nextjs` plugin
   - For API routes, no additional configuration is needed as they'll be automatically handled

5. **Custom Domain (Optional)**
   - Go to "Domain settings" to set up a custom domain
   - Follow Netlify's instructions for DNS configuration

### Environment Variables

Make sure to set the following environment variables in your Netlify dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
NEXT_PUBLIC_SITE_URL=your_netlify_site_url
```

## 🛠 Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run netlify:login` - Log in to Netlify CLI
- `npm run netlify:deploy` - Deploy to Netlify (production)

### OpenAI, Supabase, and Other Services

- [OpenAI API key](https://platform.openai.com/account/api-keys)
- [Supabase](https://supabase.com/) project (for database and authentication)
- [Resend](https://resend.com/) account (for email functionality)
- [Stripe](https://stripe.com/) account (for payments)

### ⚙️ Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crm-mind.git
   cd crm-mind
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Supabase Configuration (Required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # OpenAI Configuration (Required for AI features)
   OPENAI_API_KEY=your_openai_api_key

   # Optional Configuration
   OPENAI_MAX_TOKENS=1000  # Default: 1000
   RATE_LIMIT_REQUESTS=5   # Max requests per time window (default: 5)
   RATE_LIMIT_WINDOW=10     # Time window in seconds (default: 10s)
   ```

## 🏃‍♂️ Running the Development Server

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

## 🔄 API Endpoints

### Email Analysis
- **Endpoint**: `POST /api/analyze-email`
- **Description**: Analyzes email content using OpenAI's GPT-4o model
- **Rate Limit**: 5 requests per 10 seconds per IP
- **Request Body**:
  ```json
  {
    "emailContent": "The full text content of the email to analyze"
  }
  ```
- **Response Headers**:
  - `X-RateLimit-Limit`: Maximum requests allowed in the time window
  - `X-RateLimit-Remaining`: Remaining requests in the current window
  - `X-RateLimit-Reset`: Seconds until the rate limit resets

### Custom AI Prompt
- **Endpoint**: `POST /api/custom-prompt`
- **Description**: Processes a custom prompt using OpenAI
- **Rate Limit**: 5 requests per 10 seconds per IP
- **Request Body**:
  ```json
  {
    "prompt": "Your custom prompt here"
  }
  ```

## ⚠️ Rate Limiting

The application implements in-memory rate limiting to prevent abuse and control API costs:

- **Default Limit**: 5 requests per 10 seconds per IP address
- **Response Headers**: Each response includes rate limit information
- **Exceeded Limit**: Returns HTTP 429 (Too Many Requests) with a `Retry-After` header

To customize rate limiting, set these environment variables:
- `RATE_LIMIT_REQUESTS`: Maximum requests per window (default: 5)
- `RATE_LIMIT_WINDOW`: Time window in seconds (default: 10)

## 🔒 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Your Supabase anon/public key |
| `OPENAI_API_KEY` | ✅ | Your OpenAI API key |
| `OPENAI_MAX_TOKENS` | ❌ | Max tokens for responses (default: 1000) |
| `RATE_LIMIT_REQUESTS` | ❌ | Max requests per time window (default: 5) |
| `RATE_LIMIT_WINDOW` | ❌ | Time window in seconds (default: 10) |

## 🛡️ Security Considerations

1. **API Keys**: Never commit your `.env.local` file to version control
2. **Rate Limiting**: Keep rate limits in place to prevent abuse
3. **Input Validation**: All API endpoints validate input to prevent injection attacks
4. **Error Handling**: Sensitive error details are not exposed to clients in production

## 📚 Development

### Code Style
- TypeScript for type safety
- ESLint and Prettier for code quality
- JSDoc comments for complex functions

### Testing
```bash
# Run tests
npm test

# Run in watch mode
npm test -- --watch
```

### Building for Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [OpenAI](https://openai.com/) - For their powerful AI models
- [Supabase](https://supabase.com/) - For the open source Firebase alternative
- [Tailwind CSS](https://tailwindcss.com/) - For utility-first CSS

## Deployment

This application can be deployed on Vercel or any other Next.js compatible hosting platform.

```bash
npm run build
```

For more deployment options, check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying).
