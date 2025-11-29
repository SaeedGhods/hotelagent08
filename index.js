const express = require('express');
const twilio = require('twilio');
const xaiService = require('./xai-service');
const elevenlabsService = require('./elevenlabs-service');
require('dotenv').config();

// Initialize Twilio client for call recording
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.send('AI Voice Agent is running!');
});

// TwiML endpoint for handling incoming calls
app.post('/voice', async (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  // Log recording parameters from webhook URL
  console.log('🎙️ Call recording attempt:', {
    callSid: req.body.CallSid,
    recordParam: req.query.Record,
    from: req.body.From,
    timestamp: new Date().toISOString()
  });

  // Start recording the call using Twilio REST API
  try {
    const callSid = req.body.CallSid;
    if (callSid) {
      const recording = await twilioClient.recordings.create({
        callSid: callSid,
        recordingChannels: 'dual',  // Record both sides of the conversation
        statusCallback: `${req.protocol}://${req.get('host')}/recording-status`,
        statusCallbackMethod: 'POST'
      });
      console.log('✅ Recording started:', recording.sid);
    }
  } catch (recordingError) {
    console.error('❌ Failed to start recording:', {
      error: recordingError.message,
      callSid: req.body.CallSid,
      code: recordingError.code,
      status: recordingError.status,
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Generate ElevenLabs audio for greeting - room service and concierge specialist
    const greetingAudioId = await elevenlabsService.generateSpeech('Hello, this is Saeed, your Room Service and Concierge Specialist. How may I assist you today?');
    if (greetingAudioId) {
      const greetingUrl = `${req.protocol}://${req.get('host')}/audio/${greetingAudioId}`;
      twiml.play(greetingUrl);
    } else {
      // Fallback to Twilio TTS
      twiml.say('Hello, this is Saeed, your Room Service and Concierge Specialist. How may I assist you today?');
    }

    // Gather speech input naturally - increased timeout for longer responses
    const gather = twiml.gather({
      input: 'speech',
      action: '/process-speech',
      timeout: 10,  // Increased from 5 to 10 seconds to allow for longer AI responses
      speechTimeout: 'auto'
    });

    // No additional prompts needed - keep it natural

    // If no speech detected, end call naturally
    twiml.hangup();

  } catch (error) {
    console.error('Error in voice endpoint:', error);
    // Fallback - keep it room service and concierge focused
    twiml.say('Hello, this is Saeed, your Room Service and Concierge Specialist. How may I assist you today?');
    const gather = twiml.gather({
      input: 'speech',
      action: '/process-speech',
      timeout: 10,  // Consistent timeout for longer responses
      speechTimeout: 'auto'
    });
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// Process speech input with xAI and ElevenLabs
app.post('/process-speech', async (req, res) => {
  const speechResult = req.body.SpeechResult;
  console.log('Speech received:', speechResult);

  const twiml = new twilio.twiml.VoiceResponse();

  try {
    let audioUrl = null;

    if (speechResult) {
      // Get AI response from xAI with conversation context
      const conversationId = req.body.CallSid; // Use Twilio CallSid as conversation ID
      const aiResponse = await xaiService.generateResponse(speechResult, conversationId);

      if (aiResponse) {
        // Generate audio with ElevenLabs
        const audioId = await elevenlabsService.generateSpeech(aiResponse);
        if (audioId) {
          audioUrl = `${req.protocol}://${req.get('host')}/audio/${audioId}`;
        }
      }
    }

    if (audioUrl) {
      // Play the ElevenLabs audio
      twiml.play(audioUrl);
    } else {
      // Fallback to Twilio TTS if ElevenLabs fails
      const audioErrorVariations = [
        'I apologize, but I\'m having a bit of trouble with the audio right now. Could you try again?',
        'My apologies, there seems to be a temporary audio issue. Would you mind repeating that?',
        'I\'m experiencing a brief technical difficulty. Could you say that once more?'
      ];
      const speechErrorVariations = [
        'I didn\'t quite catch that. Could you please repeat?',
        'I missed that, I\'m afraid. Would you mind saying it again?',
        'I didn\'t hear you clearly. Could you repeat that?'
      ];
      const selectedVariations = speechResult ? audioErrorVariations : speechErrorVariations;
      const fallbackText = selectedVariations[Math.floor(Math.random() * selectedVariations.length)];
      twiml.say(fallbackText);
    }

    // Continue the conversation naturally
    const gather = twiml.gather({
      input: 'speech',
      action: '/process-speech',
      timeout: 10,  // Consistent timeout for longer responses
      speechTimeout: 'auto'
    });

    // Keep conversation natural - no prompts needed

  } catch (error) {
    console.error('Error processing speech:', error);
    // Keep error message friendly and varied
    const errorMessages = [
      "I'm sorry, I didn't quite catch that. Could you say it again?",
      "My apologies, I missed that. Would you mind repeating it?",
      "I didn't quite get that. Could you try again?",
      "Sorry about that, I didn't hear you clearly. Could you repeat that?",
      "I'm having trouble hearing you clearly. Would you mind saying that once more?"
    ];
    const randomErrorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];

    const errorAudioId = await elevenlabsService.generateSpeech(randomErrorMessage);
    if (errorAudioId) {
      const errorUrl = `${req.protocol}://${req.get('host')}/audio/${errorAudioId}`;
      twiml.play(errorUrl);
    } else {
      twiml.say(randomErrorMessage);
    }

    const gather = twiml.gather({
      input: 'speech',
      action: '/process-speech',
      timeout: 10,  // Consistent timeout for longer responses
      speechTimeout: 'auto'
    });
  }

  // No formal goodbye - let conversations end naturally

  res.type('text/xml');
  res.send(twiml.toString());
});

// Serve generated audio files
app.get('/audio/:audioId', (req, res) => {
  const audioId = req.params.audioId;
  const audioBuffer = elevenlabsService.getAudio(audioId);

  if (!audioBuffer) {
    return res.status(404).send('Audio not found or expired');
  }

  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Length': audioBuffer.length,
    'Cache-Control': 'no-cache'
  });

  res.send(audioBuffer);
});

// Recording status callback endpoint (for REST API recordings)
app.post('/recording-status', (req, res) => {
  console.log('🎵 Recording status update:', {
    accountSid: req.body.AccountSid,
    callSid: req.body.CallSid,
    recordingSid: req.body.RecordingSid,
    recordingUrl: req.body.RecordingUrl,
    recordingStatus: req.body.RecordingStatus,
    recordingDuration: req.body.RecordingDuration,
    recordingChannels: req.body.RecordingChannels,
    timestamp: new Date().toISOString()
  });

  if (req.body.RecordingStatus === 'completed' && req.body.RecordingUrl) {
    console.log('✅ Recording completed successfully:', req.body.RecordingUrl);
    // Here you could:
    // - Store recording metadata in a database
    // - Send notifications to staff for review
    // - Process the recording for quality assurance
    // - Archive recordings for compliance
  } else if (req.body.RecordingStatus === 'failed') {
    console.log('❌ Recording failed for call:', req.body.CallSid);
  }

  res.sendStatus(200);
});

app.listen(port, () => {
  console.log(`AI Voice Agent listening on port ${port}`);
});
