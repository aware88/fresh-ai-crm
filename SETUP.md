# ARIS - Setup Guide

This guide will help you set up the ARIS (Agentic Relationship Intelligence System) application on a new machine.

## Prerequisites

1. **Node.js** (v18 or higher)
   - Download and install from [Node.js official website](https://nodejs.org/)
   - Verify installation:
     ```bash
     node --version
     npm --version
     ```

2. **Git**
   - Install Git from [git-scm.com](https://git-scm.com/)
   - Verify installation:
     ```bash
     git --version
     ```

3. **Supabase CLI** (for local development)
   ```bash
   npm install -g supabase
   ```

4. **Environment Variables**
   - Create a `.env` file in the root directory
   - Copy the contents from `.env.example` (if exists)
   - Fill in the required environment variables

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/fresh-ai-crm.git
   cd fresh-ai-crm
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   For production:
   ```bash
   npm ci --only=production
   ```

3. **Set up the database**
   - Apply database migrations:
     ```bash
     npx supabase db push
     ```
   - Or run the migration script:
     ```bash
     node scripts/apply-memory-migrations.js
     ```

4. **Build the application**
   ```bash
   npm run build
   ```

## Development

1. **Start the development server**
   ```bash
   npm run dev
   ```

2. **Access the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser

## Production Deployment

### Using PM2 (recommended for Node.js servers)

1. Install PM2 globally:
   ```bash
   npm install -g pm2
   ```

2. Start the application:
   ```bash
   pm2 start npm --name "fresh-ai-crm" -- start
   ```

3. Save the PM2 process list:
   ```bash
   pm2 save
   pm2 startup
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# Email (for SMTP)
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@example.com

# Other environment variables as needed
```

## Troubleshooting

1. **Database connection issues**
   - Verify your Supabase credentials in `.env`
   - Check if Supabase is running (for local development)
   - Run database migrations if needed

2. **Dependency issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm cache clean --force`
   - Run `npm install`

3. **Environment variables**
   - Ensure all required variables are set in `.env`
   - Restart your development server after changing environment variables

## Updating Dependencies

To update all dependencies to their latest versions:

```bash
npx npm-check-updates -u
npm install
```

## License

[Your License Information]

---

For additional help, please refer to the [documentation](docs/) or open an issue on GitHub.
