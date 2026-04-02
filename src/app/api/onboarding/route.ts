import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { validateInitData, parseUserFromInitData } from '@/lib/twa';

const prisma = new PrismaClient();
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { initData, socialUsername, geo, niche, avgStoryViews, pricePerStory, base64Image } = body;

    // 1. Verify User from Telegram Mini App
    const isValid = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN!);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized. Invalid initData.' }, { status: 401 });
    }

    const tgUser = parseUserFromInitData(initData);
    if (!tgUser) {
      return NextResponse.json({ error: 'User data missing in initData.' }, { status: 400 });
    }

    // 2. Ensure basic user model exists in db
    let user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(tgUser.id) }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegram_id: BigInt(tgUser.id),
          username: tgUser.username || null,
          first_name: tgUser.first_name || '',
          role: 'CREATOR',
        }
      });
    }

    // 3. Create or update profile as "pending"
    const profile = await prisma.creatorProfile.upsert({
      where: { userId: user.id },
      update: {
        socialUsername,
        geo,
        niche,
        avgStoryViews: parseInt(avgStoryViews) || 0,
        pricePerStory: parseInt(pricePerStory) || 0,
        status: 'pending',
      },
      create: {
        userId: user.id,
        socialUsername,
        geo,
        niche,
        avgStoryViews: parseInt(avgStoryViews) || 0,
        pricePerStory: parseInt(pricePerStory) || 0,
        status: 'pending',
      }
    });

    // 4. Send background asynchronous request to n8n AI webhook
    if (N8N_WEBHOOK_URL) {
      // We don't await this so the user gets immediate response
      fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId: profile.id,
          socialUsername,
          base64Image,
        })
      }).catch(err => console.error("Failed to ping n8n:", err));
    } else {
        console.log("No N8N_WEBHOOK_URL provided, skipping AI validation.");
    }

    return NextResponse.json({ success: true, profileId: profile.id });
  } catch (error) {
    console.error('Onboarding POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
