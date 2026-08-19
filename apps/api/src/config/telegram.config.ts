import { registerAs } from '@nestjs/config';

export default registerAs('telegram', () => ({
  botToken: process.env.TELEGRAM_BOT_TOKEN,
  botUsername: process.env.TELEGRAM_BOT_USERNAME,
  miniAppUrl: process.env.MINI_APP_URL ?? 'https://app.gutshotapp.ru',
  // Optional alternate HTTPS front (e.g. Cloudflare tunnel) for flaky direct TLS.
  miniAppPublicUrl:
    process.env.MINI_APP_PUBLIC_URL?.trim() ||
    process.env.MINI_APP_URL ||
    'https://app.gutshotapp.ru',
  webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() || undefined,
  webhookUrl: process.env.TELEGRAM_WEBHOOK_URL?.trim() || undefined,
}));
