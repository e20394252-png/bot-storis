import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { notifyProofApproved, notifyProofRejected } from '@/lib/notify';

/**
 * POST /api/webhook/n8n/proof
 * Called by n8n after AI verification of story proof.
 * Body: { assignmentId, status: 'approved'|'rejected', secret }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assignmentId, status, secret } = body;

    if (secret !== process.env.N8N_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!assignmentId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const prisma = getPrisma();

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { campaign: true, creator: { include: { user: true } } },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Only process if still pending review
    if (assignment.status !== 'published') {
      return NextResponse.json({ message: 'Already processed', status: assignment.status });
    }

    const telegramId = assignment.creator?.user?.telegram_id;
    const username = assignment.creator?.user?.username;
    const campaignTitle = assignment.campaign?.title || 'Кампания';
    const reward = assignment.campaign?.rewardPerStory || 0;

    if (status === 'approved') {
      await prisma.$transaction([
        prisma.assignment.update({ where: { id: assignmentId }, data: { status: 'verified' } }),
        prisma.creatorProfile.update({
          where: { id: assignment.creatorId },
          data: { balance: { increment: reward } },
        }),
      ]);
      if (telegramId) {
        notifyProofApproved(telegramId, campaignTitle, reward, username).catch(console.error);
      }
    } else {
      await prisma.assignment.update({ where: { id: assignmentId }, data: { status: 'rejected' } });
      if (telegramId) {
        notifyProofRejected(telegramId, campaignTitle, username).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, action: status });
  } catch (err) {
    console.error('n8n proof webhook error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
