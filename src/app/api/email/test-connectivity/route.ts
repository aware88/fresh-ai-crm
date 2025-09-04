import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing network connectivity to bulknutrition.eu...');
    
    const tests = [
      { name: 'DNS Resolution', command: 'nslookup bulknutrition.eu' },
      { name: 'Ping Test', command: 'ping -c 3 bulknutrition.eu' },
      { name: 'Port 465 Test', command: 'nc -z -v bulknutrition.eu 465' },
      { name: 'Port 587 Test', command: 'nc -z -v bulknutrition.eu 587' },
      { name: 'Port 25 Test', command: 'nc -z -v bulknutrition.eu 25' }
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`🔍 Running: ${test.name}`);
        const { stdout, stderr } = await execAsync(test.command);
        results.push({
          test: test.name,
          command: test.command,
          success: true,
          output: stdout || stderr,
          error: null
        });
        console.log(`✅ ${test.name} - Success`);
      } catch (error: any) {
        results.push({
          test: test.name,
          command: test.command,
          success: false,
          output: error.stdout || '',
          error: error.message || error.stderr || 'Unknown error'
        });
        console.log(`❌ ${test.name} - Failed:`, error.message);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Network connectivity tests completed',
      results: results
    });

  } catch (error) {
    console.error('Network test error:', error);
    return NextResponse.json({ error: 'Failed to run network tests' }, { status: 500 });
  }
}














