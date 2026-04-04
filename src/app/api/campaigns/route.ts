import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const prisma = getPrisma();
    const campaigns = await prisma.campaign.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ campaigns });
  } catch (err) {
    console.error('GET /api/campaigns error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
