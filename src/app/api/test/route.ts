import { NextRequest, NextResponse } from 'next/server';
import { testSuite } from '@/lib/testing/test-suite';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const suite = searchParams.get('suite');

    console.log('🧪 Starting test execution...');
    
    // Run all tests
    const results = await testSuite.runAllTests();
    
    if (format === 'markdown') {
      const report = testSuite.generateReport();
      return new NextResponse(report, {
        headers: {
          'Content-Type': 'text/markdown',
          'Content-Disposition': 'attachment; filename="test-report.md"',
        },
      });
    }

    return NextResponse.json({
      success: true,
      results,
      summary: {
        totalTests: results.summary.totalTests,
        passed: results.summary.passed,
        failed: results.summary.failed,
        passRate: results.summary.totalTests > 0 
          ? (results.summary.passed / results.summary.totalTests * 100).toFixed(1) + '%'
          : '0%',
        duration: results.summary.duration,
        coverage: results.summary.coverage + '%',
      },
    });
  } catch (error) {
    console.error('Test execution error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test execution failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, suite: suiteName } = body;

    switch (action) {
      case 'run_suite':
        if (!suiteName) {
          return NextResponse.json({
            success: false,
            error: 'Suite name is required',
          }, { status: 400 });
        }

        // Run specific test suite
        const results = await testSuite.runAllTests();
        const targetSuite = results.suites.find(s => s.name.toLowerCase() === suiteName.toLowerCase());
        
        if (!targetSuite) {
          return NextResponse.json({
            success: false,
            error: `Test suite '${suiteName}' not found`,
            available: results.suites.map(s => s.name),
          }, { status: 404 });
        }

        return NextResponse.json({
          success: true,
          suite: targetSuite,
          summary: {
            tests: targetSuite.tests.length,
            passed: targetSuite.passed,
            failed: targetSuite.failed,
            duration: targetSuite.duration,
          },
        });

      case 'validate_system':
        // Run system validation tests
        const validationResults = await testSuite.runAllTests();
        const criticalFailures = validationResults.suites.filter(suite => 
          suite.name.includes('Security') || 
          suite.name.includes('Production') ||
          suite.name.includes('Integration')
        ).filter(suite => suite.failed > 0);

        return NextResponse.json({
          success: criticalFailures.length === 0,
          validation: {
            systemReady: criticalFailures.length === 0,
            criticalFailures: criticalFailures.length,
            totalTests: validationResults.summary.totalTests,
            passed: validationResults.summary.passed,
            failed: validationResults.summary.failed,
          },
          issues: criticalFailures.map(suite => ({
            suite: suite.name,
            failedTests: suite.tests.filter(t => !t.passed).map(t => ({
              name: t.name,
              error: t.error,
            })),
          })),
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          available: ['run_suite', 'validate_system'],
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test API failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
} 