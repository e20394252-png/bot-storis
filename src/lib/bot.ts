import { Telegraf } from 'telegraf';

export const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'dummy_token');

bot.start((ctx) => {
  const appUrl = process.env.NEXT_PUBLIC_MINI_APP_URL;
  if (!appUrl) {
    return ctx.reply('Приложение пока не настроено.');
  }

  return ctx.reply(
    '👋 Привет! Добро пожаловать на биржу сторис.\n\nЗдесь ты можешь монетизировать свои просмотры. Нажми кнопку ниже, чтобы начать!',
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '📱 Открыть приложение',
              web_app: { url: appUrl },
            },
          ],
        ],
      },
    }
  );
});

// Добавим обработку ошибок бота, чтобы он не падал
bot.catch((err, ctx) => {
  console.error(`Ooops, encountered an error for ${ctx.updateType}`, err);
});
