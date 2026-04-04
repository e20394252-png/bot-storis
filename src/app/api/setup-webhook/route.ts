import { NextResponse } from 'next/server';

/**
 * GET /api/setup-webhook?key=ADMIN_SECRET
 * Registers the Telegram bot webhook with Telegram servers.
 * Run once after deploy.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');

  const adminSecret = process.env.ADMIN_SECRET || '12345';
  if (key !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_MINI_APP_URL || 'https://bot-storis-kassandr.amvera.io';
  const webhookUrl = `${appUrl}/api/webhook`;

  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN not set' }, { status: 500 });
  }

  // Set webhook
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query'],
      drop_pending_updates: true,
    }),
  });

  const data = await res.json();

  // Also get current webhook info
  const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
  const info = await infoRes.json();

  return NextResponse.json({
    setWebhook: data,
    current: info.result,
  });
}
