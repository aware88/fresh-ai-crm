import { NextResponse } from 'next/server';
import { createTransport } from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { host, port, secure, username, password } = await request.json();

    // Validate required fields
    if (!host || !port || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a test transporter
    const transporter = createTransport({
      host,
      port: Number(port),
      secure: secure === 'true' || secure === true,
      auth: {
        user: username,
        pass: password,
      },
      // Don't fail on invalid certs
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Test the connection
    await new Promise((resolve, reject) => {
      transporter.verify((error) => {
        if (error) {
          console.error('Connection test failed:', error);
          reject(error);
        } else {
          resolve(true);
        }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error testing email connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to test connection' 
      },
      { status: 500 }
    );
  }
}
