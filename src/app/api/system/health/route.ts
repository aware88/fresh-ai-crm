import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get background sync service status
    let syncServiceStatus = null;
    
    try {
      const backgroundSyncService = require('../../../../../lib/background-sync-service');
      syncServiceStatus = backgroundSyncService.getStatus();
    } catch (error) {
      syncServiceStatus = { error: 'Background sync service not available' };
    }
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        backgroundSync: syncServiceStatus?.running ? 'healthy' : 'unhealthy',
      },
      backgroundSync: syncServiceStatus
    };
    
    return NextResponse.json(health);
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}