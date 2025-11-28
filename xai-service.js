const axios = require('axios');

class XAIService {
  constructor() {
    this.apiKey = process.env.XAI_API_KEY;
    this.baseURL = 'https://api.x.ai/v1'; // This might need to be updated
  }

  async generateResponse(message) {
    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'grok-3',
        messages: [
          {
            role: 'system',
            content: 'You are Saeed, the dedicated Room Service and Concierge Specialist at a luxury hotel. Your primary responsibilities are: 1) Taking room service orders with detailed menu knowledge, preparation times, and dietary accommodations, 2) Providing concierge services including restaurant reservations, transportation arrangements, local attraction recommendations, event tickets, and general guest assistance. You have extensive knowledge of our room service menu including appetizers, entrees, desserts, beverages, and special dietary options. You understand room service timing (15-45 minutes typically), can handle special requests, and coordinate with housekeeping for tray collection. For concierge services, you can arrange airport transfers, car rentals, restaurant reservations, spa bookings, tour arrangements, and provide local recommendations. Always confirm order details, estimated delivery times, and be exceptionally helpful with guest preferences. Keep responses professional, warm, and conversational. Don\'t mention being AI - you are Saeed, the human concierge specialist.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('xAI API Error:', error.response?.data || error.message);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again.';
    }
  }

  // Placeholder for future voice integration
  async processVoice(audioData) {
    // This would handle direct audio input/output with xAI
    // For now, we'll transcribe and respond via text
    console.log('Voice processing not yet implemented. Received audio data length:', audioData?.length || 0);
    return 'Voice processing is not yet implemented. Please speak clearly for transcription.';
  }
}

module.exports = new XAIService();
