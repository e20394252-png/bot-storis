import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { profileId, status, secret } = body;

    // Verify secret to ensure the request is from our n8n instance
    if (secret !== process.env.N8N_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!profileId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Update the creator profile
    const updatedProfile = await prisma.creatorProfile.update({
      where: { id: profileId },
      data: { status }
    });

    return NextResponse.json({ success: true, updatedProfile });
  } catch (error) {
    console.error('n8n webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
