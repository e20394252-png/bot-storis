/**
 * Telegram notification helper
 * Sends messages to users via Bot API using simple fetch (no Telegraf dep needed here)
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_MINI_APP_URL || 'https://bot-storis-kassandr.amvera.io';

async function sendMessage(chatId: string | number | bigint, text: string, extra?: object) {
  if (!BOT_TOKEN) {
    console.warn('[notify] TELEGRAM_BOT_TOKEN not set, skipping notification');
    return;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId.toString(),
        text,
        parse_mode: 'HTML',
        ...extra,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[notify] Telegram API error:', err);
    }
  } catch (err) {
    console.error('[notify] Failed to send notification:', err);
  }
}

const openAppButton = {
  reply_markup: JSON.stringify({
    inline_keyboard: [[{ text: '📱 Открыть приложение', web_app: { url: APP_URL } }]],
  }),
};

// ─── Notification functions ────────────────────────────────────────────────

/** Profile approved after AI verification */
export async function notifyProfileApproved(telegramId: bigint, username?: string | null) {
  await sendMessage(telegramId,
    `✅ <b>Профиль одобрен!</b>\n\n` +
    `Отличные новости${username ? `, @${username}` : ''}! Ваша анкета прошла AI-верификацию.\n\n` +
    `🎯 Теперь вам доступны рекламные кампании.\n` +
    `Заходите в приложение и откликайтесь на задания!`,
    openAppButton
  );
}

/** Profile rejected after AI verification */
export async function notifyProfileRejected(telegramId: bigint, username?: string | null) {
  await sendMessage(telegramId,
    `❌ <b>Верификация не прошла</b>\n\n` +
    `К сожалению, AI не смог подтвердить скриншот статистики${username ? `, @${username}` : ''}.\n\n` +
    `📸 Попробуйте загрузить другой скриншот с чёткой статистикой просмотров.\n` +
    `Вы можете повторно подать анкету в приложении.`,
    openAppButton
  );
}

/** Proof approved + balance credited */
export async function notifyProofApproved(
  telegramId: bigint,
  campaignTitle: string,
  rewardAmount: number,
  username?: string | null
) {
  await sendMessage(telegramId,
    `💸 <b>Оплата начислена!</b>\n\n` +
    `Ваш пруф по кампании <b>"${campaignTitle}"</b> одобрен${username ? `, @${username}` : ''}.\n\n` +
    `💰 Начислено: <b>${rewardAmount.toLocaleString('ru-RU')} ₽</b>\n\n` +
    `Проверьте баланс в приложении.`,
    openAppButton
  );
}

/** Proof rejected */
export async function notifyProofRejected(
  telegramId: bigint,
  campaignTitle: string,
  username?: string | null
) {
  await sendMessage(telegramId,
    `⚠️ <b>Пруф отклонён</b>\n\n` +
    `Ваш скриншот по кампании <b>"${campaignTitle}"</b> не прошёл проверку${username ? `, @${username}` : ''}.\n\n` +
    `Если вы считаете это ошибкой, обратитесь в поддержку.`,
    openAppButton
  );
}

/** New campaign available (optional, can be used for mass notify) */
export async function notifyNewCampaign(telegramId: bigint, campaignTitle: string, reward: number) {
  await sendMessage(telegramId,
    `🔔 <b>Новая кампания!</b>\n\n` +
    `Доступна новая рекламная кампания: <b>"${campaignTitle}"</b>\n` +
    `💰 Награда: <b>${reward.toLocaleString('ru-RU')} ₽</b>\n\n` +
    `Успейте откликнуться!`,
    openAppButton
  );
}
