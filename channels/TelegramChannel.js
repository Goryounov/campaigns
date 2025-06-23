const BaseChannel = require('./BaseChannel');

class TelegramChannel extends BaseChannel {
  constructor() {
    super();

    this.botToken = 'telegram-bot-token-123456';
    this.apiEndpoint = 'https://api.telegram.org/bot';
  }

  getChannelName() {
    return 'telegram';
  }

  async send(username, message) {
    console.log(`[Telegram] Sending to ${username}: ${message}`);

    if (!username || typeof username !== 'string') {
      throw new Error('Valid Telegram username is required');
    }

    try {
      // Имитация работы с внешней системой
      await new Promise(resolve => setTimeout(resolve, 2000));

      const success = Math.random() > 0.05;
      if (!success) {
        throw new Error('Telegram delivery failed');
      }

      return {
        ok: true
      };
    } catch (error) {
      console.error('Telegram error:', error);
      throw error;
    }
  }
}

module.exports = TelegramChannel;