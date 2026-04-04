import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import {
  notifyProfileApproved, notifyProfileRejected,
  notifyProofApproved, notifyProofRejected,
} from '@/lib/notify';

/**
 * Universal n8n callback webhook.
 * Handles both profile verification and proof verification.
 *
 * Profile:  { profileId, status, secret }
 * Proof:    { assignmentId, status, secret }
 *
 * n8n workflow doesn't need an IF node — same URL, same AI action,
 * just return whichever ID was passed in.
 */
export async function POST(req: Request) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const { profileId, assignmentId, status, secret } = body;

    if (secret !== process.env.N8N_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // ── Case 1: Proof verification ──────────────────────────────────────────
    if (assignmentId) {
      const assignment = await prisma.assignment.findUnique({
        where: { id: assignmentId },
        include: { campaign: true, creator: { include: { user: true } } },
      });

      if (!assignment) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }

      if (assignment.status !== 'published') {
        return NextResponse.json({ message: 'Already processed', status: assignment.status });
      }

      const telegramId = assignment.creator?.user?.telegram_id;
      const username   = assignment.creator?.user?.username;
      const title      = assignment.campaign?.title || 'Кампания';
      const reward     = assignment.campaign?.rewardPerStory || 0;

      if (status === 'approved') {
        await prisma.$transaction([
          prisma.assignment.update({ where: { id: assignmentId }, data: { status: 'verified' } }),
          prisma.creatorProfile.update({
            where: { id: assignment.creatorId },
            data: { balance: { increment: reward } },
          }),
          // Decrement available spots on the campaign
          prisma.campaign.update({
            where: { id: assignment.campaignId },
            data: { creatorsNeeded: { decrement: 1 } },
          }),
        ]);
        if (telegramId) notifyProofApproved(telegramId, title, reward, username).catch(console.error);
      } else {
        await prisma.assignment.update({ where: { id: assignmentId }, data: { status: 'rejected' } });
        if (telegramId) notifyProofRejected(telegramId, title, username).catch(console.error);
      }

      return NextResponse.json({ success: true, type: 'proof', status });
    }

    // ── Case 2: Profile verification ───────────────────────────────────────
    if (profileId) {
      const profile = await prisma.creatorProfile.update({
        where: { id: profileId },
        data: { status },
        include: { user: true },
      });

      const telegramId = profile.user?.telegram_id;
      const username   = profile.user?.username;

      if (telegramId) {
        if (status === 'approved') notifyProfileApproved(telegramId, username).catch(console.error);
        else notifyProfileRejected(telegramId, username).catch(console.error);
      }

      return NextResponse.json({ success: true, type: 'profile', status });
    }

    return NextResponse.json({ error: 'Provide profileId or assignmentId' }, { status: 400 });
  } catch (error) {
    console.error('n8n webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
