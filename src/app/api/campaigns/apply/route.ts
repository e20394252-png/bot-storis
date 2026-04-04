import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { validateInitData, parseUserFromInitData } from '@/lib/twa';

export async function POST(req: Request) {
  try {
    const initData = req.headers.get('x-telegram-init-data') || '';
    if (!initData) return NextResponse.json({ error: 'No initData' }, { status: 401 });

    const isValid = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN!);
    if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tgUser = parseUserFromInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'No user' }, { status: 400 });

    const { campaignId } = await req.json();
    if (!campaignId) return NextResponse.json({ error: 'campaignId required' }, { status: 400 });

    const prisma = getPrisma();

    // Find creator profile
    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(tgUser.id) },
      include: { creatorProfile: true }
    });

    if (!user?.creatorProfile) {
      return NextResponse.json({ error: 'Сначала заполните анкету' }, { status: 400 });
    }
    if (user.creatorProfile.status !== 'approved') {
      return NextResponse.json({ error: 'Профиль ещё не верифицирован' }, { status: 403 });
    }

    // Check if already applied
    const existing = await prisma.assignment.findFirst({
      where: { campaignId, creatorId: user.creatorProfile.id }
    });
    if (existing) {
      return NextResponse.json({ error: 'Вы уже откликнулись на эту кампанию' }, { status: 409 });
    }

    // Check campaign exists and is active
    const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status !== 'active') {
      return NextResponse.json({ error: 'Кампания недоступна' }, { status: 404 });
    }

    const assignment = await prisma.assignment.create({
      data: {
        campaignId,
        creatorId: user.creatorProfile.id,
        status: 'accepted',
      }
    });

    return NextResponse.json({ success: true, assignment });
  } catch (err) {
    console.error('POST /api/campaigns/apply error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
