const BaseChannel = require('./BaseChannel');
const SMSChannel = require('./smsChannel');
const TelegramChannel = require('./TelegramChannel');
const VKChannel = require('./VKChannel');
const WhatsAppChannel = require('./WhatsAppChannel');

const smsChannel = new SMSChannel();
const telegramChannel = new TelegramChannel();
const vkChannel = new VKChannel();
const whatsAppChannel = new WhatsAppChannel();

module.exports = {
  smsChannel,
  telegramChannel,
  vkChannel,
  whatsAppChannel,
  BaseChannel
};