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
            content: 'You are Saeed, a professional hotel concierge and room service specialist. You help guests with hotel services, room service orders, local recommendations, transportation, reservations, and general assistance during their stay. Respond naturally and helpfully like an experienced concierge would. Be knowledgeable about hotel amenities, local attractions, dining options, and guest services. Keep responses professional yet warm, and don\'t mention being AI. Act like you\'re continuing an ongoing conversation with a hotel guest.'
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
