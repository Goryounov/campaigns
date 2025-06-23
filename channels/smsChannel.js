const BaseChannel = require('./BaseChannel');

class SmsChannel extends BaseChannel {
  constructor() {
    super();

    this.apiKey = 'sms-api-key-123456';
    this.apiEndpoint = 'https://api.sms-provider.com/send';
    this.apiVersion = 'v2';
  }

  getChannelName() {
    return 'sms';
  }

  async validateRecipient(phoneNumber) {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    return phoneNumber.length >= 10 && /^\d+$/.test(phoneNumber);
  }

  async send(phoneNumber, message) {
    console.log(`[SMS] Sending to ${phoneNumber}: ${message}`);

    if (!await this.validateRecipient(phoneNumber)) {
      throw new Error('Invalid phone number');
    }

    // Имитация работы с внешней системой
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = Math.random() > 0.1;
    if (!success) {
      throw new Error('SMS delivery failed');
    }

    return {
      success: true
    };
  }
}

module.exports = SmsChannel;