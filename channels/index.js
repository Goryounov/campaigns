const BaseChannel = require('./BaseChannel')
const SMSChannel = require('./smsChannel')
const TelegramChannel = require('./TelegramChannel')

const smsChannel = new SMSChannel()
const telegramChannel = new TelegramChannel()

module.exports = {
  smsChannel,
  telegramChannel,
  BaseChannel
}