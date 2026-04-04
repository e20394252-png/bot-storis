import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { validateInitData, parseUserFromInitData } from '@/lib/twa';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const ADMIN_TG_ID = process.env.ADMIN_TELEGRAM_ID; // Admin's personal Telegram chat ID

/** Send proof photo to admin with approve/reject inline buttons */
async function notifyAdminProof(
  assignmentId: string,
  base64Image: string,
  creatorUsername: string | null,
  campaignTitle: string,
  reward: number
) {
  if (!ADMIN_TG_ID || !BOT_TOKEN) return;

  try {
    // Extract base64 data (strip "data:image/...;base64," prefix)
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Send photo via Telegram Bot API (multipart/form-data)
    const formData = new FormData();
    formData.append('chat_id', ADMIN_TG_ID);
    formData.append('caption',
      `📸 <b>Новый пруф на проверку</b>\n\n` +
      `Кампания: <b>${campaignTitle}</b>\n` +
      `Креатор: ${creatorUsername ? `@${creatorUsername}` : '(без username)'}\n` +
      `Награда: <b>${reward.toLocaleString()} ₽</b>`
    );
    formData.append('parse_mode', 'HTML');
    formData.append('reply_markup', JSON.stringify({
      inline_keyboard: [[
        { text: `✅ Одобрить +${reward.toLocaleString()}₽`, callback_data: `proof:ok:${assignmentId}` },
        { text: '❌ Отклонить', callback_data: `proof:no:${assignmentId}` },
      ]]
    }));

    const blob = new Blob([buffer], { type: 'image/jpeg' });
    formData.append('photo', blob, 'proof.jpg');

    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[proof notify] Telegram photo send error:', err);
    }
  } catch (err) {
    console.error('[proof notify] Failed:', err);
  }
}

/** Forward proof to n8n for AI auto-verification */
async function sendProofToN8n(
  assignmentId: string,
  base64Image: string,
  creatorUsername: string | null,
  campaignTitle: string
) {
  const n8nUrl = process.env.N8N_WEBHOOK_URL; // same URL, different type
  if (!n8nUrl) return;

  try {
    const res = await fetch(n8nUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'proof',          // <-- n8n IF-node routes on this
        assignmentId,
        base64Image,
        creatorUsername,
        campaignTitle,
        secret: process.env.N8N_SECRET,
      }),
    });
    const text = await res.text();
    console.log(`[n8n proof] Response: ${res.status} ${text}`);
  } catch (err) {
    console.error('[n8n proof] Failed:', err);
  }
}

export async function POST(req: Request) {
  try {
    const initData = req.headers.get('x-telegram-init-data') || '';
    if (!initData) return NextResponse.json({ error: 'No initData' }, { status: 401 });

    const isValid = validateInitData(initData, BOT_TOKEN);
    if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tgUser = parseUserFromInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'No user' }, { status: 400 });

    const { assignmentId, base64Image } = await req.json();
    if (!assignmentId || !base64Image) {
      return NextResponse.json({ error: 'assignmentId and base64Image required' }, { status: 400 });
    }

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(tgUser.id) },
      include: { creatorProfile: true }
    });

    if (!user?.creatorProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { campaign: true },
    });

    if (!assignment || assignment.creatorId !== user.creatorProfile.id) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.status !== 'accepted') {
      return NextResponse.json({ error: 'Пруф уже был загружен' }, { status: 409 });
    }

    // Save proof and update status
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { proofUrl: base64Image, status: 'published' },
    });

    const campaignTitle = assignment.campaign?.title || 'Кампания';
    const reward = assignment.campaign?.rewardPerStory || 0;
    const username = tgUser.username || null;

    // Fire-and-forget: notify admin via Telegram (inline buttons) AND n8n AI
    notifyAdminProof(assignmentId, base64Image, username, campaignTitle, reward).catch(console.error);
    sendProofToN8n(assignmentId, base64Image, username, campaignTitle).catch(console.error);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/assignments/proof error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
