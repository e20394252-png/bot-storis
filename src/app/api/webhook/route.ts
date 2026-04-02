import { bot } from '@/lib/bot';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return new Response('OK');
  } catch (error) {
    console.error('Error handling bot webhook:', error);
    return new Response('Error', { status: 500 });
  }
}
