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
            content: 'You are Saeed having a friendly phone conversation. Respond naturally and warmly like a real person would. Be helpful, engaging, and conversational. Keep responses natural and not robotic. Don\'t reintroduce yourself or mention being AI. Act like you\'re continuing an ongoing conversation.'
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
