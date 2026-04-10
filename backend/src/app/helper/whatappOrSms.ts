/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Injectable, Logger } from '@nestjs/common';
import Twilio from 'twilio';
import config from '../config';

@Injectable()
export class WhatsappOrSmsService {
  private readonly logger = new Logger(WhatsappOrSmsService.name);
  private client: Twilio.Twilio;

  constructor() {
    this.client = Twilio(config.twilio.sid!, config.twilio.token!);
  }

  /**
   * Bangladesh number normalize: 01XXXXXXXXX → +8801XXXXXXXXX
   */
  formatBDNumber(number: string): string {
    if (!number) return '';
    const cleaned = number.replace(/[\s\\-]/g, '');
    if (cleaned.startsWith('+880')) return cleaned;
    if (cleaned.startsWith('880')) return `+${cleaned}`;
    if (cleaned.startsWith('0')) return `+880${cleaned.slice(1)}`;
    return `+880${cleaned}`;
  }

  /**
   * Try WhatsApp first → fallback to SMS automatically
   */
  async sendMessage(phone: string, message: string): Promise<boolean> {
    const formattedPhone = this.formatBDNumber(phone);
    if (!formattedPhone) {
      this.logger.warn('⚠️  Invalid phone number provided');
      return false;
    }

    // 1️⃣ Try WhatsApp first
    try {
      await this.client.messages.create({
        from: config.twilio.whatsappNumber!, // whatsapp:+14155238886
        to: `whatsapp:${formattedPhone}`,
        body: message,
      });
      this.logger.log(`✅ WhatsApp sent to ${formattedPhone}`);
      return true;
    } catch (whatsappError: any) {
      this.logger.warn(
        `⚠️  WhatsApp failed for ${formattedPhone}: ${whatsappError.message} — trying SMS...`,
      );
    }

    // 2️⃣ Fallback to SMS
    try {
      await this.client.messages.create({
        from: config.twilio.phoneNumber!, // +16626232910
        to: formattedPhone,
        body: message,
      });
      this.logger.log(`✅ SMS sent to ${formattedPhone}`);
      return true;
    } catch (smsError: any) {
      this.logger.error(
        `❌ SMS also failed for ${formattedPhone}: ${smsError.message}`,
      );
      return false;
    }
  }

  // ─── Message Templates ────────────────────────────────────────────

  overdueMessage(taskTitle: string): string {
    return (
      `🚨 *Task Overdue!*\n\n` +
      `Your task *"${taskTitle}"* deadline has passed.\n` +
      `Please complete it as soon as possible! ✅`
    );
  }

  reminderMessage(taskTitle: string, minutesLeft: number): string {
    return (
      `⏰ *Task Reminder!*\n\n` +
      `Your task *"${taskTitle}"* is due in *${minutesLeft} minutes*.\n` +
      `Hurry up and complete it! 💪`
    );
  }

  completedMessage(taskTitle: string): string {
    return (
      `🎉 *Task Completed!*\n\n` +
      `Great job! You completed *"${taskTitle}"*.\n` +
      `Keep up the excellent work! 🚀`
    );
  }
}
