const axios = require('axios');
const config = require('../config');

class VendorService {
  constructor() {
    this.baseUrl = config.VENDOR_API.BASE_URL;
    this.timeout = config.VENDOR_API.TIMEOUT;
  }

  // Generate personalized message based on campaign and customer data
  generatePersonalizedMessage(customer, campaign) {
    const { name, totalSpend, segment } = customer;
    // Get companyName directly from the campaign object
    const { type, description, companyName } = campaign;
    const customerFirstName = name.split(' ')[0] || 'there';

    // Start with the campaign description template (which is the AI generated body)
    let personalizedMessage = description;

    // --- Smart Greeting Logic ---
    // Check if the original description template contains the [User Name] placeholder
    const hasUserNamePlaceholder = description.includes('[User Name]');
    // Check if the original description template contains the [Your Company Name] placeholder
    const hasCompanyNamePlaceholder = description.includes('[Your Company Name]');
    // Check if the original description template contains the [Platform Name] placeholder
    const hasPlatformNamePlaceholder = description.includes('[Platform Name]');

    let finalMessage = '';

    // Prepend greeting ONLY if the template does NOT already contain [User Name]
    if (!hasUserNamePlaceholder && type === 'email') {
        finalMessage += `Hi ${customerFirstName},\n\n`; // Use customer first name and add newlines
    }
    // --- End Smart Greeting Logic ---

    // Replace generic placeholders in the template
    personalizedMessage = personalizedMessage.replace(/\[User Name\]/g, name || 'Valued Customer'); // Use full name
    personalizedMessage = personalizedMessage.replace(/\[Your Company Name\]/g, companyName || 'Your Company Name'); // Use companyName from campaign object, fallback if needed
    personalizedMessage = personalizedMessage.replace(/\[Platform Name\]/g, type === 'email' ? 'Email' : 
                                                      type === 'social' ? 'Social Media' : 
                                                      type === 'display' ? 'Display Ads' : 'Platform'); // Replace with appropriate platform name based on campaign type
    // Add more general replacements here, like [Product Name], [App Name], etc. if the AI uses them
    // Example: personalizedMessage = personalizedMessage.replace(/\[Product Name\]/g, 'Our Service');

    // Clean up excessive newlines within the core message body
    personalizedMessage = personalizedMessage.replace(/\n{2,}/g, '\n\n').trim(); // Replace multiple newlines with double, trim whitespace

    // Append the cleaned, personalized message body from AI
    finalMessage += personalizedMessage;

    // --- Add specific, data-driven content based on campaign type and customer attributes ---
    // This part adds information *around* or *within* the AI-generated text.

    if (type === 'email') {
        // Add VIP/Segment specific offers or mentions (each with newlines for formatting)
        if (segment === 'Active' && totalSpend > 20000) {
          finalMessage += '\n\nAs a valued VIP customer, you get exclusive benefits. Use code VIP20 for an exclusive 20% discount!';
        } else if (segment === 'Active') {
          finalMessage += '\n\nAs an active customer, enjoy 15% off your next purchase with code ACTIVE15!';
        } else if (segment === 'Inactive') {
          finalMessage += '\n\nWe miss you! Come back and get 25% off with code WELCOMEBACK!';
        }
         // No default offer here, keep it based on segments above

         // Add personalized recommendations based on spending
        if (totalSpend > 15000) {
          finalMessage += '\n\nAs a premium customer, you get priority access to our new collections!';
        }

         // Add a consistent closing block using the campaign's company name ONLY if [Your Company Name] was not in the original message
         if (!hasCompanyNamePlaceholder) {
           finalMessage += `\n\nThanks,\nThe ${companyName || 'Your Company Name'} Team`; // Use the companyName from campaign
         }

    } else if (type === 'social') {
         // For social, just use the cleaned personalized message
         finalMessage = personalizedMessage;
         // You might add a standard hashtag or link here

    } else if (type === 'display') {
          // For display, just use the cleaned personalized message
          finalMessage = personalizedMessage;
          // You might add a standard call to action button text here
    }
    // Add cases for other campaign types as needed

    // --- End data-driven content section ---
    return finalMessage.trim(); // Trim final message whitespace
  }

  // Send message to customer
  async sendMessage(log) {
    try {
      // Simulate API call to vendor
      const success = Math.random() < 0.95; // 95% success rate

      if (!success) {
        throw new Error('Vendor API failed to send message');
      }

      // Generate message ID and timestamp
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      // Simulate vendor response
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
      // Simulate random delivery states with higher probability of success
      const states = ['delivered', 'opened', 'clicked'];
      const weights = [0.6, 0.3, 0.1]; // 60% delivered, 30% opened, 10% clicked
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