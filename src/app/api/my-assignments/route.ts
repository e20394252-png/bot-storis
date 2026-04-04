import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { validateInitData, parseUserFromInitData } from '@/lib/twa';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const initData = req.headers.get('x-telegram-init-data') || '';
    if (!initData) return NextResponse.json({ error: 'No initData' }, { status: 401 });

    const isValid = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN!);
    if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tgUser = parseUserFromInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'No user' }, { status: 400 });

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(tgUser.id) },
      include: { creatorProfile: true }
    });

    if (!user?.creatorProfile) {
      return NextResponse.json({ assignments: [] });
    }

    const assignments = await prisma.assignment.findMany({
      where: { creatorId: user.creatorProfile.id },
      include: { campaign: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ assignments });
  } catch (err) {
    console.error('GET /api/my-assignments error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
