const axios = require('axios');

class XAIService {
  constructor() {
    this.apiKey = process.env.XAI_API_KEY;
    this.baseURL = 'https://api.x.ai/v1'; // This might need to be updated
    // Simple conversation memory - stores context for up to 30 minutes
    this.conversationMemory = new Map();
  }

  getConversationContext(conversationId) {
    const context = this.conversationMemory.get(conversationId);
    if (context && Date.now() - context.timestamp < 30 * 60 * 1000) { // 30 minutes
      return context.history;
    }
    return [];
  }

  saveConversationContext(conversationId, history) {
    this.conversationMemory.set(conversationId, {
      history: history,
      timestamp: Date.now()
    });
  }

  async generateResponse(message, conversationId = null) {
    try {
      // Get conversation history if available
      let conversationHistory = [];
      if (conversationId) {
        conversationHistory = this.getConversationContext(conversationId);
      }

      const messages = [
        {
          role: 'system',
          content: 'You are Saeed, a warm and experienced hotel concierge with over 15 years in luxury hospitality. You have a genuine passion for making guests feel special and creating memorable experiences. Your personality: warm and approachable, knowledgeable but never condescending, proactive in anticipating needs, and you speak with the natural rhythm of someone who truly cares about guest satisfaction. You remember small details, use guests names when appropriate, and always follow up on previous conversations. For room service: you have encyclopedic knowledge of our menu, can make thoughtful recommendations based on dietary preferences and occasions, and always mention preparation times naturally in conversation. For concierge services: you are a local expert who knows the best hidden gems, can arrange special experiences, and treat every request as an opportunity to delight. Use conversational language like "I\'d be happy to help with that" or "That\'s an excellent choice" or "Let me take care of the details for you". Ask clarifying questions naturally, offer alternatives when appropriate, and show genuine enthusiasm for helping. Never sound scripted or robotic - respond as a trusted friend who happens to work in hospitality. When appropriate, add small personal touches like "I recommend this especially for sunset views" or "Our chef makes this dish exceptionally well".'
        }
      ];

      // Add previous conversation history
      messages.push(...conversationHistory);

      // Add current user message
      messages.push({
        role: 'user',
        content: message
      });

      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'grok-3',
        messages: messages,
        max_tokens: 150,
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const aiResponse = response.data.choices[0].message.content;

      // Save conversation context if conversationId provided
      if (conversationId) {
        const updatedHistory = [
          ...conversationHistory,
          { role: 'user', content: message },
          { role: 'assistant', content: aiResponse }
        ].slice(-10); // Keep last 10 exchanges to avoid token limits
        this.saveConversationContext(conversationId, updatedHistory);
      }

      return aiResponse;
    } catch (error) {
      console.error('xAI API Error:', error.response?.data || error.message);
      const errorVariations = [
        "I'm so sorry, but I'm having a bit of trouble right now. Could you try that again?",
        "My apologies, there seems to be a temporary issue. Would you mind repeating that?",
        "I'm experiencing a brief technical difficulty. Could you say that once more?",
        "I apologize for the inconvenience. Could you try again in just a moment?",
        "There seems to be a small hiccup. Would you mind repeating your request?"
      ];
      return this.getRandomResponse(errorVariations);
    }
  }

  // Response variation helpers for more natural conversation
  getRandomResponse(variations) {
    return variations[Math.floor(Math.random() * variations.length)];
  }

  getConfirmationVariations() {
    return [
      "Perfect, I've got that noted.",
      "Excellent choice!",
      "That sounds wonderful.",
      "Great, I'll take care of that right away.",
      "Perfect, consider it done.",
      "Wonderful, I'll arrange that for you.",
      "Excellent, I'll handle the details."
    ];
  }

  getQuestionVariations() {
    return [
      "Could you tell me a bit more about that?",
      "I'd love to help with that. What details can you share?",
      "That sounds interesting. Could you elaborate?",
      "I'd be happy to assist. What specifically are you looking for?",
      "Tell me more about what you have in mind.",
      "I'd love to help. What details should I know?"
    ];
  }

  getTimeEstimateVariations(minutes) {
    const variations = [
      `That should be ready in about ${minutes} minutes.`,
      `We'll have that to you in approximately ${minutes} minutes.`,
      `You can expect that in around ${minutes} minutes.`,
      `It'll be with you in roughly ${minutes} minutes.`,
      `That will take about ${minutes} minutes to prepare.`
    ];
    return this.getRandomResponse(variations);
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
