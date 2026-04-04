import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { validateInitData, parseUserFromInitData } from '@/lib/twa';

// POST /api/withdrawals — request a withdrawal
export async function POST(req: Request) {
  try {
    const initData = req.headers.get('x-telegram-init-data') || '';
    if (!initData) return NextResponse.json({ error: 'No initData' }, { status: 401 });

    const isValid = validateInitData(initData, process.env.TELEGRAM_BOT_TOKEN!);
    if (!isValid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tgUser = parseUserFromInitData(initData);
    if (!tgUser) return NextResponse.json({ error: 'No user' }, { status: 400 });

    const { amount, details } = await req.json();
    if (!amount || amount < 1) {
      return NextResponse.json({ error: 'Укажите сумму' }, { status: 400 });
    }
    if (!details?.trim()) {
      return NextResponse.json({ error: 'Укажите реквизиты для перевода' }, { status: 400 });
    }

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { telegram_id: BigInt(tgUser.id) },
      include: { creatorProfile: true }
    });

    if (!user?.creatorProfile) {
      return NextResponse.json({ error: 'Профиль не найден' }, { status: 404 });
    }

    const balance = user.creatorProfile.balance;
    if (amount > balance) {
      return NextResponse.json({ error: `Недостаточно средств. Баланс: ${balance.toLocaleString()} ₽` }, { status: 400 });
    }

    // Check no pending withdrawal
    const pending = await prisma.withdrawal.findFirst({
      where: { userId: user.id, status: 'pending' }
    });
    if (pending) {
      return NextResponse.json({ error: 'У вас уже есть заявка на вывод в обработке' }, { status: 409 });
    }

    // Deduct balance and create withdrawal atomically
    await prisma.$transaction([
      prisma.creatorProfile.update({
        where: { id: user.creatorProfile.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.withdrawal.create({
        data: { userId: user.id, amount, details: details.trim(), status: 'pending' }
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/withdrawals error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// GET /api/withdrawals — get user's withdrawal history
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
      where: { telegram_id: BigInt(tgUser.id) }
    });
    if (!user) return NextResponse.json({ withdrawals: [] });

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({ withdrawals });
  } catch (err) {
    console.error('GET /api/withdrawals error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
