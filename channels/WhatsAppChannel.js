const BaseChannel = require('./BaseChannel');

class WhatsAppChannel extends BaseChannel {
  constructor() {
    super();

    this.apiKey = 'whatsapp-api-key-123456';
    this.apiEndpoint = 'https://api.whatsapp-provider.com/v1/messages';

    this.supportedMediaTypes = ['image', 'video', 'document', 'audio'];
    this.maxMediaSize = 16 * 1024 * 1024; // 16MB

    this.templateEnabled = true;
    this.templates = {
      welcome: 'Привет, {{1}}! Добро пожаловать!',
      confirmation: 'Ваш код подтверждения: {{1}}',
      reminder: 'Напоминаем о встрече {{1}} в {{2}}'
    };
  }

  getChannelName() {
    return 'whatsapp';
  }

  async validateRecipient(phoneNumber, countryCode = null) {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    if (countryCode) {
      return phoneNumber.length >= 10 && /^\d+$/.test(phoneNumber) && /^\d{1,3}$/.test(countryCode);
    }

    return phoneNumber.length >= 10 && /^\d+$/.test(phoneNumber);
  }

  async send(phoneNumber, message, options = {}) {
    console.log(`[WhatsApp] Sending to ${phoneNumber}: ${message}`);

    const { templateName, templateValues, mediaUrl, mediaType } = options;

    let finalMessage = message;
    if (templateName && this.templates[templateName]) {
      finalMessage = this.templates[templateName];
      if (templateValues && Array.isArray(templateValues)) {
        templateValues.forEach((value, index) => {
          finalMessage = finalMessage.replace(`{{${index + 1}}}`, value);
        });
      }
    }

    try {
      const countryCode = options.countryCode || null;
      if (!await this.validateRecipient(phoneNumber, countryCode)) {
        throw new Error('Invalid phone number');
      }

      // Имитация работы с внешней системой
      await new Promise(resolve => setTimeout(resolve, 1500));

      const success = Math.random() > 0.2;
      if (!success) {
        throw new Error('WhatsApp delivery failed');
      }

      console.log(`Successfully sent WhatsApp message to ${phoneNumber}`);

      return {
        success: true
      };
    } catch (error) {
      console.error('WhatsApp API error:', error);
      throw error;
    }
  }
}

module.exports = WhatsAppChannel;