import { Telegraf } from 'telegraf';
import { getPrisma } from '@/lib/prisma';
import { notifyProofApproved, notifyProofRejected } from '@/lib/notify';

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'dummy_token');

const APP_URL = process.env.NEXT_PUBLIC_MINI_APP_URL || 'https://bot-storis-kassandr.amvera.io';

bot.start((ctx) => {
  return ctx.reply(
    '👋 Привет! Добро пожаловать на Биржу Сторис.\n\nЗдесь ты можешь монетизировать свои просмотры. Нажми кнопку ниже, чтобы начать!',
    {
      reply_markup: {
        inline_keyboard: [[{ text: '📱 Открыть приложение', web_app: { url: APP_URL } }]],
      },
    }
  );
});

// ── Callback query handler for proof review ────────────────────────────────
bot.on('callback_query', async (ctx) => {
  try {
    const data = (ctx.callbackQuery as any).data as string;
    if (!data?.startsWith('proof:')) return;

    const [, action, assignmentId] = data.split(':');
    // action: 'ok' | 'no'

    const prisma = getPrisma();
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { campaign: true, creator: { include: { user: true } } },
    });

    if (!assignment) {
      await ctx.answerCbQuery('❌ Задание не найдено');
      return;
    }

    if (assignment.status !== 'published') {
      await ctx.answerCbQuery('⚠️ Уже обработано');
      // Update the message to show current status
      await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
      return;
    }

    const telegramId = assignment.creator?.user?.telegram_id;
    const username = assignment.creator?.user?.username;
    const campaignTitle = assignment.campaign?.title || 'Кампания';
    const reward = assignment.campaign?.rewardPerStory || 0;

    if (action === 'ok') {
      // Approve: credit balance
      await prisma.$transaction([
        prisma.assignment.update({ where: { id: assignmentId }, data: { status: 'verified' } }),
        prisma.creatorProfile.update({
          where: { id: assignment.creatorId },
          data: { balance: { increment: reward } },
        }),
      ]);
      await ctx.answerCbQuery(`✅ Одобрено! Начислено ${reward.toLocaleString()} ₽`);
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [[{ text: `✅ ОДОБРЕНО +${reward.toLocaleString()}₽`, callback_data: 'done' }]],
      });
      if (telegramId) {
        notifyProofApproved(telegramId, campaignTitle, reward, username).catch(console.error);
      }
    } else {
      // Reject
      await prisma.assignment.update({ where: { id: assignmentId }, data: { status: 'rejected' } });
      await ctx.answerCbQuery('❌ Отклонено');
      await ctx.editMessageReplyMarkup({
        inline_keyboard: [[{ text: '❌ ОТКЛОНЕНО', callback_data: 'done' }]],
      });
      if (telegramId) {
        notifyProofRejected(telegramId, campaignTitle, username).catch(console.error);
      }
    }
  } catch (err) {
    console.error('callback_query error:', err);
    await ctx.answerCbQuery('Ошибка сервера');
  }
});

bot.catch((err, ctx) => {
  console.error(`Bot error for ${ctx.updateType}`, err);
});
