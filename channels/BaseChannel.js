class BaseChannel {
  constructor() {
    this.channelTypes = ['sms', 'telegram', 'vk', 'whatsapp'];
  }

  async send(recipient, message) {
    throw new Error('Method send() must be implemented by derived classes');
  }

  async validateRecipient(recipient) {
    return recipient && recipient.length > 0;
  }

  getChannelName() {
    throw new Error('Method getChannelName() must be implemented by derived classes');
  }
}

module.exports = BaseChannel;