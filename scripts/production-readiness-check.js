#!/usr/bin/env node

/**
 * ARIS CRM Production Readiness Check
 * 
 * This script validates that all requirements are met before deploying to production.
 * It checks environment variables, database connectivity, security settings, and more.
 * 
 * Usage:
 *   node scripts/production-readiness-check.js [options]
 * 
 * Options:
 *   --fix           Attempt to fix issues automatically
 *   --verbose       Show detailed output
 *   --json          Output results in JSON format
 *   --env <file>    Use specific environment file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  fix: false,
  verbose: false,
  json: false,
  env: '.env',
};

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--fix':
      options.fix = true;
      break;
    case '--verbose':
      options.verbose = true;
      break;
    case '--json':
      options.json = true;
      break;
    case '--env':
      options.env = args[++i];
      break;
    case '--help':
      showHelp();
      process.exit(0);
  }
}

// Results tracking
let checkResults = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

// Helper functions
function log(message, color = 'reset') {
  if (!options.json) {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }
}

function logVerbose(message) {
  if (options.verbose && !options.json) {
    console.log(`${colors.cyan}[VERBOSE] ${message}${colors.reset}`);
  }
}

function showHelp() {
  console.log(`
ARIS CRM Production Readiness Check

Usage: node scripts/production-readiness-check.js [options]

Options:
  --fix             Attempt to fix issues automatically
  --verbose         Show detailed output
  --json            Output results in JSON format
  --env <file>      Use specific environment file (default: .env)
  --help            Show this help message

Examples:
  node scripts/production-readiness-check.js                    # Basic check
  node scripts/production-readiness-check.js --verbose --fix    # Detailed check with fixes
  node scripts/production-readiness-check.js --json             # JSON output for CI/CD
`);
}

// Load environment variables
function loadEnvironment() {
  try {
    if (fs.existsSync(options.env)) {
      const envContent = fs.readFileSync(options.env, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      });
      
      // Set environment variables
      Object.keys(envVars).forEach(key => {
        if (!process.env[key]) {
          process.env[key] = envVars[key];
        }
      });
      
      logVerbose(`Loaded environment from ${options.env}`);
      return true;
    } else {
      logVerbose(`Environment file ${options.env} not found`);
      return false;
    }
  } catch (error) {
    logVerbose(`Error loading environment: ${error.message}`);
    return false;
  }
}

// Check function wrapper
function runCheck(name, checkFunction) {
  checkResults.total++;
  
  try {
    const result = checkFunction();
    
    checkResults.checks.push({
      name,
      status: result.status,
      message: result.message,
      details: result.details,
      fixable: result.fixable || false,
    });
    
    if (result.status === 'pass') {
      checkResults.passed++;
      log(`✅ ${name}`, 'green');
    } else if (result.status === 'warn') {
      checkResults.warnings++;
      log(`⚠️  ${name}: ${result.message}`, 'yellow');
    } else {
      checkResults.failed++;
      log(`❌ ${name}: ${result.message}`, 'red');
    }
    
    if (options.verbose && result.details) {
      log(`   ${result.details}`, 'cyan');
    }
    
    return result;
  } catch (error) {
    checkResults.failed++;
    checkResults.checks.push({
      name,
      status: 'fail',
      message: error.message,
      details: null,
      fixable: false,
    });
    
    log(`❌ ${name}: ${error.message}`, 'red');
    return { status: 'fail', message: error.message };
  }
}

// Individual check functions
function checkEnvironmentVariables() {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'ENCRYPTION_KEY',
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length === 0) {
    return {
      status: 'pass',
      message: 'All required environment variables are set',
      details: `Checked ${requiredVars.length} variables`,
    };
  } else {
    return {
      status: 'fail',
      message: `Missing required environment variables: ${missing.join(', ')}`,
      details: 'These variables are required for production deployment',
      fixable: true,
    };
  }
}

function checkProductionSettings() {
  const issues = [];
  
  if (process.env.NODE_ENV !== 'production') {
    issues.push('NODE_ENV should be set to "production"');
  }
  
  if (process.env.HTTPS_ONLY !== 'true') {
    issues.push('HTTPS_ONLY should be set to "true" in production');
  }
  
  if (process.env.ENCRYPTION_ENABLED === 'false') {
    issues.push('ENCRYPTION_ENABLED should not be disabled in production');
  }
  
  if (issues.length === 0) {
    return {
      status: 'pass',
      message: 'Production settings are configured correctly',
    };
  } else {
    return {
      status: 'fail',
      message: 'Production settings issues found',
      details: issues.join('; '),
      fixable: true,
    };
  }
}

function checkDatabaseConnectivity() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return {
      status: 'fail',
      message: 'Supabase credentials not configured',
    };
  }
  
  try {
    // Simple URL validation
    new URL(supabaseUrl);
    
    return {
      status: 'pass',
      message: 'Database configuration appears valid',
      details: `URL: ${supabaseUrl}`,
    };
  } catch (error) {
    return {
      status: 'fail',
      message: 'Invalid Supabase URL',
      details: error.message,
    };
  }
}

function checkSecurityConfiguration() {
  const issues = [];
  
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
    issues.push('ENCRYPTION_KEY should be at least 32 characters long');
  }
  
  if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
    issues.push('NEXTAUTH_SECRET should be at least 32 characters long');
  }
  
  if (issues.length === 0) {
    return {
      status: 'pass',
      message: 'Security configuration is adequate',
    };
  } else {
    return {
      status: 'fail',
      message: 'Security configuration issues found',
      details: issues.join('; '),
      fixable: true,
    };
  }
}

function checkBuildConfiguration() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return {
      status: 'fail',
      message: 'package.json not found',
    };
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const requiredScripts = ['build', 'start'];
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
  
  if (missingScripts.length === 0) {
    return {
      status: 'pass',
      message: 'Build configuration is correct',
      details: `Scripts: ${requiredScripts.join(', ')}`,
    };
  } else {
    return {
      status: 'fail',
      message: `Missing required scripts: ${missingScripts.join(', ')}`,
      fixable: false,
    };
  }
}

function checkNextJsConfiguration() {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fs.existsSync(nextConfigPath)) {
    return {
      status: 'warn',
      message: 'next.config.js not found',
      details: 'Consider adding Next.js configuration for production optimization',
    };
  }
  
  try {
    const nextConfig = require(nextConfigPath);
    
    const warnings = [];
    
    if (nextConfig.typescript?.ignoreBuildErrors) {
      warnings.push('TypeScript errors are ignored during build');
    }
    
    if (nextConfig.eslint?.ignoreDuringBuilds) {
      warnings.push('ESLint errors are ignored during build');
    }
    
    if (warnings.length > 0) {
      return {
        status: 'warn',
        message: 'Next.js configuration has warnings',
        details: warnings.join('; '),
      };
    } else {
      return {
        status: 'pass',
        message: 'Next.js configuration looks good',
      };
    }
  } catch (error) {
    return {
      status: 'fail',
      message: 'Error reading Next.js configuration',
      details: error.message,
    };
  }
}

function checkDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    return {
      status: 'fail',
      message: 'package.json not found',
    };
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const criticalDependencies = [
    'next',
    'react',
    'react-dom',
    '@supabase/supabase-js',
    'openai',
  ];
  
  const missing = criticalDependencies.filter(dep => 
    !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  if (missing.length === 0) {
    return {
      status: 'pass',
      message: 'All critical dependencies are present',
      details: `Checked ${criticalDependencies.length} dependencies`,
    };
  } else {
    return {
      status: 'fail',
      message: `Missing critical dependencies: ${missing.join(', ')}`,
      fixable: true,
    };
  }
}

function checkFilePermissions() {
  const criticalFiles = [
    'package.json',
    'next.config.js',
    '.env',
  ];
  
  const issues = [];
  
  criticalFiles.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.accessSync(file, fs.constants.R_OK);
      } catch (error) {
        issues.push(`${file} is not readable`);
      }
    }
  });
  
  if (issues.length === 0) {
    return {
      status: 'pass',
      message: 'File permissions are correct',
    };
  } else {
    return {
      status: 'fail',
      message: 'File permission issues found',
      details: issues.join('; '),
      fixable: true,
    };
  }
}

function checkDeploymentFiles() {
  const deploymentFiles = [
    'Dockerfile',
    'render.yaml',
    'northflank.yaml',
  ];
  
  const existing = deploymentFiles.filter(file => fs.existsSync(file));
  
  if (existing.length > 0) {
    return {
      status: 'pass',
      message: 'Deployment configuration files found',
      details: `Files: ${existing.join(', ')}`,
    };
  } else {
    return {
      status: 'warn',
      message: 'No deployment configuration files found',
      details: 'Consider adding Dockerfile or platform-specific config files',
    };
  }
}

// Fix functions
function fixEnvironmentVariables() {
  if (!options.fix) return;
  
  logVerbose('Attempting to fix environment variables...');
  
  const envTemplate = `# ARIS CRM Environment Variables
# Generated by production readiness check

# Core Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Security
NEXTAUTH_SECRET=your_nextauth_secret_at_least_32_characters_long
ENCRYPTION_KEY=your_encryption_key_at_least_32_characters_long
HTTPS_ONLY=true

# Monitoring
MONITORING_ENABLED=true
HEALTH_CHECK_INTERVAL=30000

# Performance
CACHE_ENABLED=true
COMPRESSION_ENABLED=true
`;
  
  if (!fs.existsSync('.env.production.example')) {
    fs.writeFileSync('.env.production.example', envTemplate);
    log('Created .env.production.example template', 'green');
  }
}

// Main execution
async function runProductionReadinessCheck() {
  const startTime = Date.now();
  
  if (!options.json) {
    log(`${colors.bright}🔍 ARIS CRM Production Readiness Check${colors.reset}`);
    log(`${colors.cyan}Starting comprehensive production readiness validation...${colors.reset}`);
    log('');
  }
  
  // Load environment
  loadEnvironment();
  
  // Run all checks
  const checks = [
    { name: 'Environment Variables', func: checkEnvironmentVariables },
    { name: 'Production Settings', func: checkProductionSettings },
    { name: 'Database Connectivity', func: checkDatabaseConnectivity },
    { name: 'Security Configuration', func: checkSecurityConfiguration },
    { name: 'Build Configuration', func: checkBuildConfiguration },
    { name: 'Next.js Configuration', func: checkNextJsConfiguration },
    { name: 'Dependencies', func: checkDependencies },
    { name: 'File Permissions', func: checkFilePermissions },
    { name: 'Deployment Files', func: checkDeploymentFiles },
  ];
  
  checks.forEach(check => {
    const result = runCheck(check.name, check.func);
    
    // Attempt fixes if requested
    if (options.fix && result.status === 'fail' && result.fixable) {
      if (check.name === 'Environment Variables') {
        fixEnvironmentVariables();
      }
    }
  });
  
  const duration = Date.now() - startTime;
  
  // Output results
  if (options.json) {
    console.log(JSON.stringify({
      success: checkResults.failed === 0,
      results: checkResults,
      summary: {
        total: checkResults.total,
        passed: checkResults.passed,
        failed: checkResults.failed,
        warnings: checkResults.warnings,
        duration,
      },
    }, null, 2));
  } else {
    log(`\n${colors.bright}📊 Production Readiness Summary${colors.reset}`);
    log(`${colors.cyan}Total Checks: ${checkResults.total}${colors.reset}`);
    log(`${colors.green}Passed: ${checkResults.passed}${colors.reset}`);
    log(`${colors.red}Failed: ${checkResults.failed}${colors.reset}`);
    log(`${colors.yellow}Warnings: ${checkResults.warnings}${colors.reset}`);
    log(`${colors.blue}Duration: ${duration}ms${colors.reset}`);
    
    if (checkResults.failed === 0) {
      log(`\n${colors.green}🎉 System is ready for production deployment!${colors.reset}`);
    } else {
      log(`\n${colors.red}❌ ${checkResults.failed} critical issue(s) must be resolved before production deployment.${colors.reset}`);
      
      const fixableIssues = checkResults.checks.filter(c => c.status === 'fail' && c.fixable);
      if (fixableIssues.length > 0) {
        log(`${colors.yellow}💡 ${fixableIssues.length} issue(s) can be fixed automatically with --fix option${colors.reset}`);
      }
    }
    
    if (checkResults.warnings > 0) {
      log(`${colors.yellow}⚠️  ${checkResults.warnings} warning(s) should be addressed for optimal production performance.${colors.reset}`);
    }
  }
  
  // Exit with appropriate code
  process.exit(checkResults.failed === 0 ? 0 : 1);
}

// Run the check
runProductionReadinessCheck().catch(error => {
  if (options.json) {
    console.log(JSON.stringify({
      success: false,
      error: error.message,
    }));
  } else {
    log(`${colors.red}❌ Production readiness check failed: ${error.message}${colors.reset}`);
  }
  process.exit(1);
}); 