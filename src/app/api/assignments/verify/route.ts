import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const adminSecret = process.env.ADMIN_SECRET || '12345';
    const key = req.headers.get('x-admin-key');
    if (key !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId, action } = await req.json();
    // action: 'verify' | 'reject'
    if (!assignmentId || !['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const prisma = getPrisma();

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { campaign: true, creator: true },
    });

    if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'verify') {
      // Mark as verified and credit balance
      await prisma.$transaction([
        prisma.assignment.update({
          where: { id: assignmentId },
          data: { status: 'verified' },
        }),
        prisma.creatorProfile.update({
          where: { id: assignment.creatorId },
          data: { balance: { increment: assignment.campaign.rewardPerStory } },
        }),
      ]);
      return NextResponse.json({ success: true, action: 'verified' });
    } else {
      await prisma.assignment.update({
        where: { id: assignmentId },
        data: { status: 'rejected' },
      });
      return NextResponse.json({ success: true, action: 'rejected' });
    }
  } catch (err) {
    console.error('POST /api/assignments/verify error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
