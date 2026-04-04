import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';

/**
 * GET /api/admin-migrate?key=12345
 * Runs safe "ADD COLUMN IF NOT EXISTS" migrations that can't break existing data.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const key = searchParams.get('key');
  const adminSecret = process.env.ADMIN_SECRET || '12345';

  if (key !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const prisma = getPrisma();
  const results: string[] = [];

  const migrations = [
    {
      name: 'add Campaign.requirements',
      sql: `ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "requirements" TEXT`,
    },
  ];

  for (const m of migrations) {
    try {
      await prisma.$executeRawUnsafe(m.sql);
      results.push(`✅ ${m.name}`);
    } catch (err: any) {
      results.push(`❌ ${m.name}: ${err.message}`);
    }
  }

  return NextResponse.json({ done: true, results });
}
