const axios = require('axios');
const config = require('../config');

class VendorService {
  constructor() {
    this.baseUrl = config.VENDOR_API.BASE_URL;
    this.timeout = config.VENDOR_API.TIMEOUT;
  }
  generatePersonalizedMessage(customer, campaign) {
    const { name, totalSpend, segment } = customer;
    const { type, description, companyName } = campaign;
    const customerFirstName = name.split(' ')[0] || 'there';
    let personalizedMessage = description;

    // --- Smart Greeting Logic ---
    // [User Name] placeholder
    const hasUserNamePlaceholder = description.includes('[User Name]');
    //  [Your Company Name] placeholder
    const hasCompanyNamePlaceholder = description.includes('[Your Company Name]');
    //  [Platform Name] placeholder
    const hasPlatformNamePlaceholder = description.includes('[Platform Name]');

    let finalMessage = '';

    //  NOT already contain [User Name]
    if (!hasUserNamePlaceholder && type === 'email') {
        finalMessage += `Hi ${customerFirstName},\n\n`; // Use customer first name and add newlines
    }
    // --- End Smart Greeting Logic ---
    personalizedMessage = personalizedMessage.replace(/\[User Name\]/g, name || 'Valued Customer'); // Use full name
    personalizedMessage = personalizedMessage.replace(/\[Your Company Name\]/g, companyName || 'Your Company Name'); // Use companyName from campaign object, fallback if needed
    personalizedMessage = personalizedMessage.replace(/\[Platform Name\]/g, type === 'email' ? 'Email' : 
                                                      type === 'social' ? 'Social Media' : 
                                                      type === 'display' ? 'Display Ads' : 'Platform'); // Replace with appropriate platform name based on campaign type
  
    //  message body
    personalizedMessage = personalizedMessage.replace(/\n{2,}/g, '\n\n').trim(); // Replace multiple newlines with double, trim whitespace
    // message body from AI
    finalMessage += personalizedMessage;
    // This part adds information *around* or *within* the AI-generated text.
    if (type === 'email') {
        // VIP/Segment 
        if (segment === 'Active' && totalSpend > 20000) {
          finalMessage += '\n\nAs a valued VIP customer, you get exclusive benefits. Use code VIP20 for an exclusive 20% discount!';
        } else if (segment === 'Active') {
          finalMessage += '\n\nAs an active customer, enjoy 15% off your next purchase with code ACTIVE15!';
        } else if (segment === 'Inactive') {
          finalMessage += '\n\nWe miss you! Come back and get 25% off with code WELCOMEBACK!';
        }
         // ecommendations based on spending
        if (totalSpend > 15000) {
          finalMessage += '\n\nAs a premium customer, you get priority access to our new collections!';
        }
         if (!hasCompanyNamePlaceholder) {
           finalMessage += `\n\nThanks,\nThe ${companyName || 'Your Company Name'} Team`; 
         }

    } else if (type === 'social') {
         finalMessage = personalizedMessage;
     } else if (type === 'display') {
          finalMessage = personalizedMessage;
       }
    
    // --- End data-driven content section ---
    return finalMessage.trim(); 
  }

  // Send message to customer
  async sendMessage(log) {
    try {
      const success = Math.random() < 0.95;

      if (!success) {
        throw new Error('Vendor API failed to send message');
      }
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();
      return {
        success: true,
        response: {
          messageId,
          timestamp,
          status: 'sent'
        }
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        response: {
          error: error.message,
          timestamp: new Date().toISOString(),
          status: 'failed'
        }
      };
    }
  }

  // Simulate delivery receipt from vendor
  async sendDeliveryReceipt(messageId, customerId) {
    try {
      const states = ['delivered', 'opened', 'clicked'];
      const weights = [0.6, 0.3, 0.1];
      const random = Math.random();
      let cumulativeWeight = 0;
      let state = 'delivered';

      for (let i = 0; i < states.length; i++) {
        cumulativeWeight += weights[i];
        if (random < cumulativeWeight) {
          state = states[i];
          break;
        }
      }

      // Send receipt to our backend immediately
      await axios.post(
        `${config.API_URL}/api/campaigns/delivery-receipt`,
        {
          messageId,
          customerId,
          status: state,
          timestamp: new Date().toISOString()
        },
        { timeout: this.timeout }
      );

      return { status: state };
    } catch (error) {
      console.error('Error sending delivery receipt:', error);
      return { status: 'failed', error: error.message };
    }
  }
}

module.exports = new VendorService(); 