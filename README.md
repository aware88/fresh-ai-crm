# ARIS (Agentic Relationship Intelligence System)

A powerful agentic relationship intelligence system with integrated inventory management, AI-powered email assistance, and comprehensive CRM capabilities for modern businesses.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)](https://openai.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Test Status](https://github.com/yourusername/aris/actions/workflows/tests.yml/badge.svg)](https://github.com/yourusername/aris/actions)
[![Coverage Status](https://coveralls.io/repos/github/yourusername/aris/badge.svg?branch=main)](https://coveralls.io/github/yourusername/aris?branch=main)

## 🎨 Recent Major Enhancements (December 2024)

### Phase 3: Professional UI/UX + Advanced Automation (COMPLETE)
- **Linear-Inspired Design**: Clean, professional interface with subtle animations
- **Enhanced Dashboard**: Animated metrics, typing effects, and smooth charts
- **Professional Components**: Refined tables, modals, and typography system
- **MagicUI Integration**: Number tickers, animated beams, and interactive effects
- **Advanced Automation**: ML-powered follow-up system with 95% automation rate
- **Enterprise Ready**: Production-grade system with comprehensive analytics

### Complete UI Modernization with shadcn/ui
- **Professional Design System**: Complete migration to shadcn/ui components
- **Modern Dashboard**: Real-time charts and analytics with Recharts integration
- **Advanced Sidebar**: Floating sidebar with icon collapse and keyboard navigation
- **Enhanced AI Learning**: Tier-based learning with background processing
- **90% More Modern**: Professional SaaS-like appearance with smooth animations

## 🚀 Quick Start

Get started with ARIS in minutes:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/aris.git
cd aris

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 4. Start the development server
npm run dev

# 5. Open http://localhost:3000 in your browser
```

Or use the interactive setup script:

```bash
# Run the setup script
node scripts/setup.js
```

## 📋 Prerequisites

- Node.js 18 or higher
- npm 8 or higher
- PostgreSQL 13 or higher (or Supabase)
- A Supabase project (for authentication and database)
- OpenAI API key (for AI features)

For detailed setup instructions, see the [Setup Guide](./SETUP.md).

## ✨ Features

### 🤖 AI Email Assistant (NEW!)
- **Smart Draft Generation**: AI automatically generates contextual email replies
- **Interactive Editing**: Edit AI drafts in a dedicated sidebar/modal/inline panel
- **Machine Learning**: System learns from every edit to improve future suggestions
- **User Feedback**: Optional notes to explain changes for better AI understanding
- **Privacy Controls**: Granular settings for data retention and sharing preferences
- **Style Adaptation**: AI learns user's communication style (professional, friendly, formal, casual)
- **Performance Tracking**: Detailed metrics on AI accuracy and user satisfaction

### CRM Mind
- 🚀 **Modern Stack**: Built with Next.js 15, TypeScript, and Tailwind CSS
- 🎨 **shadcn/ui Integration**: Complete UI modernization with professional design system
- 📊 **Modern Dashboard**: Real-time charts and analytics with Recharts integration
- 🤖 **AI-Powered Insights**: Leverage OpenAI's GPT models for email analysis and customer insights
- 📧 **Email Queue System**: Robust system for processing, analyzing, and reviewing incoming emails
- 📱 **Responsive Design**: Works seamlessly across all device sizes
- 🏢 **Custom Branding**: Easy theming and customization options

### Metakocka Integration

- **Order Management**: Comprehensive order handling with Metakocka sync
  - View and filter orders by status
  - Bulk sync operations
  - Real-time sync status updates
  - Detailed order views
- **Inventory Sync**: Keep product inventory in sync with Metakocka
  - Automatic stock level updates
  - Low stock alerts
  - Multi-location inventory support
- **Sales Documents**: Full sales document lifecycle management
  - Create, view, and manage sales documents
  - Status tracking and updates
  - Bidirectional synchronization

### Inventory Management
- 🚨 **Real-time Alerts**: Get instant notifications when inventory levels are low
- 🔔 **Multi-channel Notifications**: Receive alerts via email, SMS, or in-app
- 📊 **Inventory Analytics**: Track stock levels and alert history
- ⚙️ **Custom Thresholds**: Set custom alert thresholds for each product

### Integrations
- 🔄 **Metakocka Integration**: Bidirectional sync of contacts, products, and sales documents
- 📧 **Email Integration**: Connect with Resend, SendGrid, or other email providers
- 📱 **SMS Notifications**: Twilio integration for SMS alerts

### Subscription System
- 💳 **3-Tier Pricing**: Clean Starter, Pro, and Premium plans
- 🔒 **Automatic Limit Enforcement**: User and contact limits enforced automatically
- 📊 **Real-time Usage Tracking**: Monitor usage and limits in real-time
- 🚀 **Beta Strategy**: Free tiers for user acquisition, Premium for revenue
- 👥 **Team Management**: Invite team members with subscription-aware limits

### Developer Experience
- 🛠 **Developer Friendly**: Well-documented codebase with TypeScript support
- 🧪 **Comprehensive Testing**: Unit, integration, and end-to-end tests
- 📚 **API Documentation**: Auto-generated API documentation
- 🔒 **Secure & Protected**: Built-in rate limiting and API usage controls

## 🤖 AI Email Assistant Deep Dive

### How It Works
1. **📧 Email Arrives** → System processes and analyzes content
2. **🤖 AI Generates Draft** → Creates contextual reply based on email content and user history
3. **📝 User Reviews & Edits** → Draft appears in sidebar/modal for review and modification
4. **📊 Changes Tracked** → Every edit is logged for machine learning improvement
5. **💡 AI Learns** → Future drafts become more accurate and personalized

### Enhanced Learning System (December 2024)
- **Smart Email Selection**: Tier-based learning limits with intelligent email selection
- **Background Processing**: True background learning with progress tracking
- **Subscription Integration**: Automatic respect for tier limits and cost optimization
- **Session Management**: Real-time status updates and error recovery

### Key Components
- **Settings Page** (`/settings/email-ai`) - Configure AI preferences and privacy settings
- **Draft Window** - Interactive editing interface with change tracking
- **Learning Pipeline** - ML system that analyzes user patterns and preferences
- **Analytics Dashboard** - Insights into AI performance and user satisfaction

### Database Schema
- `user_ai_email_settings` - User preferences and configuration
- `ai_email_drafts` - Generated drafts with metadata and confidence scores
- `ai_learning_data` - Learning sessions tracking user modifications
- `ai_learning_changes` - Individual edits and improvements
- `ai_learning_insights` - AI-generated insights from user behavior
- `user_ai_scores` - Performance metrics and improvement tracking

## 📚 Documentation

For detailed documentation on specific features, see:

- [AI Email Assistant](/docs/ai-email-assistant.md) - Complete guide to the AI email system
- [Metakocka Integration](/docs/integrations/metakocka/README.md)
- [Order Management](/docs/integrations/metakocka/OrderDashboard.md)
- [Email Queue System](/docs/email-queue-system.md)
- [API Reference](/docs/API.md)

## 🚀 Getting Started

### Quick Start on a New Machine

1. **Clone the repository**
2. **Run the setup script:**
   ```sh
   bash setup.sh
   ```
   - This will install dependencies (using lockfiles for exact versions) and build the project.
   - If you use nvm, it will auto-install the Node version from `.nvmrc` (if present).
3. **Copy environment variables:**
   ```sh
   cp .env.example .env
   # Edit .env and fill in secrets/keys as needed
   ```
4. **Start the development server:**
   ```sh
   npm run dev
   ```

#### Troubleshooting
- If you have issues, ensure you are using the correct Node version (`nvm use` if you have `.nvmrc`).
- If you see dependency errors, try deleting `node_modules` and rerunning `bash setup.sh`.
- All dependencies are locked using `package-lock.json` (or `yarn.lock` if you use Yarn) for reproducible builds.

See `docs/ENHANCEMENT_LOG.md` for the full changelog, enhancement plan, and how to resume work on any phase.

### Prerequisites

- Node.js 18.0.0 or later
- npm 9.0.0 or later
- PostgreSQL 13 or later (for local development)
- A Supabase account (for production database)
- An OpenAI API key (for AI features)
- A Netlify account (for deployment)
- Email service (Resend, SendGrid, etc.)
- Optional: SMS service (Twilio) for SMS alerts

### Local Development

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/crm-mind.git
   cd crm-mind
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

4. Run database migrations
   ```bash
   npm run db:migrate
   ```

5. Run the development server
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. Start the alert processor
   ```bash
   npm run alert-processor:dev
   ```

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
RESEND_API_KEY=your_resend_api_key
ALERT_EMAIL_FROM=alerts@yourdomain.com
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🛠 Development Scripts

### Core Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Database
- `npm run db:migrate` - Run database migrations
- `npm run db:migrate:create` - Create a new migration
- `npm run db:migrate:status` - Check migration status
- `npm run db:seed:dev` - Seed development database

### Alert System
- `npm run alert-processor` - Start the alert processor
- `npm run alert-processor:dev` - Start the alert processor in development mode
- `npm run test:alerts` - Run alert-related tests

### Testing
- `npm test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:coverage` - Generate test coverage report

### Deployment
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
   RESEND_API_KEY=your_resend_api_key
   ALERT_EMAIL_FROM=alerts@yourdomain.com
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   TWILIO_PHONE_NUMBER=+1234567890
   NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
   
   # WhatsApp Meta Cloud API (per organization stored via settings; access token can be stored transiently here if desired)
   # WHATSAPP_META_ACCESS_TOKEN=...
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
└── types/                   # TypeScript type definitions
```

## Key Features

### Inventory Alerts

Get real-time notifications when inventory levels are low:

- **Custom Thresholds**: Set different alert levels for each product
- **Multi-channel Notifications**: Receive alerts via email, SMS, or in-app
- **Alert History**: View past alerts and their status
- **Acknowledgment System**: Mark alerts as resolved when addressed

### Email Queue System

The email queue system provides a structured approach to handling incoming emails with AI-powered analysis:

- **Queue Management**: Add, process, and monitor emails in a priority queue
- **AI Analysis**: Extract insights from emails using OpenAI's GPT-4o model
- **Review Process**: Manual review workflow for emails requiring human attention
- **Metakocka Integration**: Enrich email context with Metakocka data
- **Priority Levels**: Process urgent emails first with customizable priority settings

### Email Analysis

The email analysis feature uses OpenAI's GPT-4o model to extract insights from customer emails, including:

- Key points and intentions
- Sentiment analysis
- Customer needs and pain points
- Recommended follow-up actions
- Urgency level

## AI Assistant

## 🔄 Metakocka Integration

CRM Mind includes comprehensive integration with Metakocka ERP system, featuring:

### Bidirectional Synchronization
- **Contacts**: Sync contacts between CRM and Metakocka with mapping and status tracking
- **Products**: Sync products with pricing, inventory, and metadata
- **Sales Documents**: Sync invoices, quotes, and other sales documents bidirectionally

### UI Components
- Sync buttons for individual and bulk operations
- Status indicators showing sync state
- Unsynced item counters
- Detailed sync history

### Error Management
- Structured error logging and tracking
- Retry logic with exponential backoff
- Error resolution workflow
- Comprehensive error statistics

### Testing
- Comprehensive test scripts for all sync operations
- End-to-end verification tests
- Environment-based test configuration

### Documentation
- [Metakocka Integration Guide](./docs/metakocka-integration.md)
- [Bidirectional Sales Document Sync](./docs/bidirectional-sales-document-sync.md)
- [Error Log Management](./docs/metakocka-error-log-management.md)

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
| `RESEND_API_KEY` | ✅ | Your Resend API key |
| `ALERT_EMAIL_FROM` | ✅ | Email address for sending alerts |
| `TWILIO_ACCOUNT_SID` | ❌ | Your Twilio account SID |
| `TWILIO_AUTH_TOKEN` | ❌ | Your Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ❌ | Your Twilio phone number |

## 🛡️ Security Considerations

1. **API Keys**: Never commit your `.env.local` file to version control
2. **Rate Limiting**: Keep rate limits in place to prevent abuse
3. **Input Validation**: All API endpoints validate input to prevent injection attacks
4. **Error Handling**: Sensitive error details are not exposed to clients in production

## 📚 Documentation

For detailed documentation, please refer to the following files:

- [SYSTEM_OVERVIEW.md](./docs/SYSTEM_OVERVIEW.md) - Complete system architecture and components
- [DEVELOPER_GUIDE.md](./docs/DEVELOPER_GUIDE.md) - Getting started guide for developers
- [TESTING.md](./docs/TESTING.md) - Testing guide and best practices
- [DATABASE.md](./docs/DATABASE.md) - Database schema and migration guide
- [API_REFERENCE.md](./docs/API_REFERENCE.md) - API documentation
- [ORGANIZATION_BRANDING.md](./docs/organization-branding.md) - White-label customization guide
- [FEATURE_FLAG_SYSTEM.md](./docs/feature-flag-system.md) - Feature flag management
- [METAKOCKA_INTEGRATION.md](./docs/metakocka-integration.md) - Metakocka ERP integration

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

We welcome contributions from the community! Here's how you can help:

1. **Report Bugs**: File an issue on our [issue tracker](https://github.com/yourusername/crm-mind/issues)
2. **Suggest Features**: Open a feature request issue
3. **Submit Code**: Open a pull request with your changes
4. **Improve Documentation**: Help us make our docs better

Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the development process.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database powered by [Supabase](https://supabase.com/)
- AI features powered by [OpenAI](https://openai.com/)
- Icons from [Lucide](https://lucide.dev/)

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
