import { NextRequest, NextResponse } from 'next/server';
import { securityManager } from '@/lib/security/security-manager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '100');

    switch (action) {
      case 'events':
        const events = securityManager.getSecurityEvents(limit);
        return NextResponse.json({
          success: true,
          data: {
            events,
            total: events.length,
          },
        });

      case 'stats':
        const stats = securityManager.getSecurityStats();
        return NextResponse.json({
          success: true,
          data: stats,
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "events" or "stats".',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'unblock_ip':
        if (!data?.ip) {
          return NextResponse.json({
            success: false,
            error: 'IP address is required',
          }, { status: 400 });
        }
        
        securityManager.unblockIP(data.ip);
        return NextResponse.json({
          success: true,
          message: `IP ${data.ip} has been unblocked`,
        });

      case 'clear_events':
        securityManager.clearSecurityEvents();
        return NextResponse.json({
          success: true,
          message: 'Security events cleared',
        });

      case 'test_encryption':
        if (!data?.text) {
          return NextResponse.json({
            success: false,
            error: 'Text is required for encryption test',
          }, { status: 400 });
        }

        const encrypted = securityManager.encrypt(data.text);
        const decrypted = securityManager.decrypt(encrypted);
        
        return NextResponse.json({
          success: true,
          data: {
            original: data.text,
            encrypted,
            decrypted,
            match: data.text === decrypted,
          },
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
} 