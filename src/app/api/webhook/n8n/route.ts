import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { notifyProfileApproved, notifyProfileRejected } from '@/lib/notify';

export async function POST(req: Request) {
  try {
    const prisma = getPrisma();
    const body = await req.json();
    const { profileId, status, secret } = body;

    if (secret !== process.env.N8N_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!profileId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Update the creator profile
    const updatedProfile = await prisma.creatorProfile.update({
      where: { id: profileId },
      data: { status },
      include: { user: true },
    });

    // Send Telegram notification (fire-and-forget, don't block response)
    const telegramId = updatedProfile.user?.telegram_id;
    if (telegramId) {
      const username = updatedProfile.user?.username;
      if (status === 'approved') {
        notifyProfileApproved(telegramId, username).catch(console.error);
      } else {
        notifyProfileRejected(telegramId, username).catch(console.error);
      }
    }

    return NextResponse.json({ success: true, updatedProfile });
  } catch (error) {
    console.error('n8n webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
