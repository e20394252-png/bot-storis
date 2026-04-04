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

    const { assignmentId, base64Image } = await req.json();
    if (!assignmentId || !base64Image) {
      return NextResponse.json({ error: 'assignmentId and base64Image required' }, { status: 400 });
    }

    const prisma = getPrisma();

    // Verify this assignment belongs to current user
    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(tgUser.id) },
      include: { creatorProfile: true }
    });

    if (!user?.creatorProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment || assignment.creatorId !== user.creatorProfile.id) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (assignment.status !== 'accepted') {
      return NextResponse.json({ error: 'Пруф уже был загружен' }, { status: 409 });
    }

    // Store proof and update status to published
    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        proofUrl: base64Image,
        status: 'published',
      }
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (err) {
    console.error('POST /api/assignments/proof error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
