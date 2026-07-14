import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.botToken = this.configService.get<string>('telegram.botToken');
  }

  async sendMessage(telegramId: string, text: string): Promise<boolean> {
    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN не задан — сообщение не отправлено');
      return false;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text,
          parse_mode: 'HTML',
        }),
      });

      if (!response.ok) {
        this.logger.error(`Telegram API error: ${response.status} ${await response.text()}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Ошибка отправки Telegram сообщения', error as Error);
      return false;
    }
  }

  templates = {
    registrationSuccess: (tournamentTitle: string): string =>
      `✅ Вы успешно зарегистрированы на турнир «${tournamentTitle}».`,
    movedFromWaiting: (tournamentTitle: string): string =>
      `🎉 Для вас освободилось место на турнире «${tournamentTitle}». Вы переведены в основной список.`,
    registrationCancelled: (tournamentTitle: string): string =>
      `❌ Регистрация на турнир «${tournamentTitle}» отменена.`,
    reminder: (tournamentTitle: string): string =>
      `⏰ Напоминаем: турнир «${tournamentTitle}» начнется через 2 часа.`,
    checkedIn: (): string => '✅ Вы успешно отметились. Удачи за столом!',
    tournamentFinished: (tournamentTitle: string, place: number, xp: number): string =>
      `🏁 Турнир «${tournamentTitle}» завершен. Ваше место: ${place}. Начислено XP: +${xp}.`,
    xpAwarded: (amount: number): string => `⭐ Начислено ${amount} XP.`,
    levelUp: (level: number): string => `🚀 Новый уровень: ${level}!`,
  };
}
