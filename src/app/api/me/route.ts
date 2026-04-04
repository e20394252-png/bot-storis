import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { validateInitData, parseUserFromInitData } from '@/lib/twa';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const initData = req.headers.get('x-telegram-init-data') || '';
    
    if (!initData) {
      return NextResponse.json({ error: 'No initData' }, { status: 401 });
    }

    const isValid = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN!);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tgUser = parseUserFromInitData(initData);
    if (!tgUser) {
      return NextResponse.json({ error: 'No user' }, { status: 400 });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(tgUser.id) },
      include: { creatorProfile: true }
    });

    if (!user) {
      return NextResponse.json({ user: null, profile: null });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        telegram_id: user.telegram_id.toString(),
        username: user.username,
        first_name: user.first_name,
        role: user.role,
      },
      profile: user.creatorProfile ? {
        id: user.creatorProfile.id,
        status: user.creatorProfile.status,
        socialUsername: user.creatorProfile.socialUsername,
        geo: user.creatorProfile.geo,
        niche: user.creatorProfile.niche,
        avgStoryViews: user.creatorProfile.avgStoryViews,
        pricePerStory: user.creatorProfile.pricePerStory,
        balance: user.creatorProfile.balance,
      } : null
    });
  } catch (err) {
    console.error('GET /api/me error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
