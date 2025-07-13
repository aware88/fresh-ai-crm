#!/usr/bin/env node

/**
 * Script to systematically fix all Supabase services to use lazy-loading clients
 * This prevents build-time Supabase client instantiation that causes Northflank build failures
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Services that need to be updated to use lazy-loading
const servicesToUpdate = [
  'src/lib/services/subscription-service-admin.ts',
  'src/lib/services/subscription-service-extension.ts',
  'src/lib/services/notification-preferences-service.ts',
  'src/lib/services/webhook-security-service.ts',
  'src/lib/services/webhook-management-service.ts',
  'src/lib/services/webhook-delivery-service.ts',
  'src/lib/services/email-service.ts',
  'src/lib/services/two-factor-auth-service.ts',
  'src/lib/services/enhanced-notification-service.ts',
  'src/lib/jobs/notification-jobs.ts',
  'src/lib/email/emailQueueWorker.ts',
  'src/services/metakocka/MetakockaLogService.ts',
  'src/lib/services/inventory-alert-service.ts',
  'src/lib/integrations/metakocka/inventory-service.ts',
  'src/lib/integrations/metakocka/order-service.ts',
  'src/lib/integrations/metakocka/contact-sync.ts',
  'src/lib/integrations/metakocka/sales-document-sync.ts',
];

// Import patterns to replace
const importReplacements = [
  {
    from: "import { createClient } from '@/lib/supabase/server';",
    to: "import { createLazyServerClient } from '@/lib/supabase/lazy-client';"
  },
  {
    from: "import { createClient } from '@/lib/supabase/client';",
    to: "import { createLazyClientClient } from '@/lib/supabase/lazy-client';"
  },
  {
    from: "import { createServerClient } from '@/lib/supabase/server';",
    to: "import { createLazyServerClient } from '@/lib/supabase/lazy-client';"
  }
];

// Client instantiation patterns to replace
const clientReplacements = [
  {
    from: /const supabase = createClient\(\);/g,
    to: 'const supabase = await createLazyServerClient();'
  },
  {
    from: /const supabase = createServerClient\(\);/g,
    to: 'const supabase = await createLazyServerClient();'
  },
  {
    from: /private supabase = createClient\(\);/g,
    to: 'private async getSupabase() { return await createLazyServerClient(); }'
  },
  {
    from: /this\.supabase\./g,
    to: '(await this.getSupabase()).'
  }
];

function updateFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;

  // Replace import statements
  importReplacements.forEach(replacement => {
    if (content.includes(replacement.from)) {
      content = content.replace(replacement.from, replacement.to);
      modified = true;
      console.log(`✅ Updated import in ${filePath}`);
    }
  });

  // Replace client instantiation patterns
  clientReplacements.forEach(replacement => {
    if (replacement.from.test && replacement.from.test(content)) {
      content = content.replace(replacement.from, replacement.to);
      modified = true;
      console.log(`✅ Updated client instantiation in ${filePath}`);
    }
  });

  // Handle async function conversion for methods that now use await
  if (modified && content.includes('await createLazyServerClient()')) {
    // Find functions that need to be made async
    const functionPatterns = [
      /(\w+)\s*\([^)]*\)\s*:\s*Promise<[^>]+>\s*\{/g,
      /(\w+)\s*\([^)]*\)\s*\{[^}]*await createLazyServerClient/g
    ];

    functionPatterns.forEach(pattern => {
      content = content.replace(pattern, (match) => {
        if (!match.includes('async ')) {
          return match.replace(/(\w+)\s*\(/, 'async $1(');
        }
        return match;
      });
    });
  }

  if (modified) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Successfully updated ${filePath}`);
    return true;
  }

  return false;
}

function main() {
  console.log('🔧 Starting Supabase services lazy-loading migration...\n');

  let updatedCount = 0;
  let errorCount = 0;

  servicesToUpdate.forEach(filePath => {
    try {
      if (updateFile(filePath)) {
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error updating ${filePath}:`, error.message);
      errorCount++;
    }
  });

  console.log(`\n📊 Migration Summary:`);
  console.log(`✅ Files updated: ${updatedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📁 Total files processed: ${servicesToUpdate.length}`);

  if (errorCount === 0) {
    console.log('\n🎉 All services successfully migrated to lazy-loading!');
    console.log('🔨 Running build test...');
    
    try {
      execSync('npm run build', { stdio: 'inherit' });
      console.log('✅ Build test passed!');
    } catch (error) {
      console.error('❌ Build test failed. Manual review required.');
      process.exit(1);
    }
  } else {
    console.log('\n⚠️  Some files had errors. Please review manually.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, servicesToUpdate };
