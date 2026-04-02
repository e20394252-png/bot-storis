import { getPrisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { key?: string };
}) {
  const adminSecret = process.env.ADMIN_SECRET || '12345';
  
  if (searchParams.key !== adminSecret) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-3">Доступ запрещен</h1>
        <p className="text-gray-400">Введите правильный ключ в URL, например: /admin?key=12345</p>
      </div>
    );
  }

  const prisma = getPrisma();
  const profiles = await prisma.creatorProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-[#1c1c1e] text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Панель управления (Админка)</h1>
      
      <div className="overflow-x-auto bg-[#0f0f0f] rounded-2xl border border-white/10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-gray-400 text-sm">
              <th className="p-4 font-medium">Юзернейм</th>
              <th className="p-4 font-medium">Откуда</th>
              <th className="p-4 font-medium">Ниша</th>
              <th className="p-4 font-medium">Просмотры</th>
              <th className="p-4 font-medium">Цена (₽)</th>
              <th className="p-4 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-gray-500">Нет регистраций</td>
              </tr>
            ) : profiles.map((p: any) => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4 font-medium">{p.socialUsername || p.user.username || 'Нет'}</td>
                <td className="p-4 text-gray-400">{p.geo || '-'}</td>
                <td className="p-4 text-gray-400">{p.niche || '-'}</td>
                <td className="p-4">{p.avgStoryViews}</td>
                <td className="p-4 text-green-400">{p.pricePerStory}</td>
                <td className="p-4">
                  {p.status === 'pending' && <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">Ожидает валидации</span>}
                  {p.status === 'approved' && <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-md text-xs">Одобрен</span>}
                  {p.status === 'rejected' && <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-md text-xs">Отклонён</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
