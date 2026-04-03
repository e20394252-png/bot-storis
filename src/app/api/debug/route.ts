import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    time: new Date().toISOString(),
    env_keys: Object.keys(process.env).join(', '),
    hasN8N: !!process.env.N8N_WEBHOOK_URL,
    n8nUrl: process.env.N8N_WEBHOOK_URL || "NOT SET",
    dbUrl: !!process.env.DATABASE_URL
  });
}
