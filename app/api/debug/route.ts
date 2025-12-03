import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'https://youth-handbook.onrender.com',
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
}
