import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const prisma = getPrisma();
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ campaign });
  } catch (err) {
    console.error('GET /api/campaigns/[id] error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
