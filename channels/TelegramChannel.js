const axios = require('axios')

const BaseChannel = require('./BaseChannel')

class TelegramChannel extends BaseChannel {
  constructor() {
    super()

    this.botToken = 'telegram-bot-token-123456'
    this.apiEndpoint = 'https://api.telegram.org/bot'
  }

  getChannelName() {
    return 'telegram'
  }

  async send(tg_id, text, parseMode) {
    console.log(`[Telegram] Sending to ${tg_id}: ${text}`)

    try {
      await axios.post(
        `${this.apiEndpoint}${this.botToken}/sendMessage`, 
        {
          chat_id: tg_id,
          text: text,
          parse_mode: parseMode
        }
      )

      return {
        ok: true
      }
    } catch (error) {
      console.error('Telegram error:', error)
      throw error
    }
  }
}

module.exports = TelegramChannel