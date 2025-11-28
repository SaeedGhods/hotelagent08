const express = require('express');
const twilio = require('twilio');
const xaiService = require('./xai-service');
const elevenlabsService = require('./elevenlabs-service');
require('dotenv').config();

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

  try {
    // Generate ElevenLabs audio for greeting
    const greetingAudioId = await elevenlabsService.generateSpeech('Hello! Connecting you to our AI assistant...');
    if (greetingAudioId) {
      const greetingUrl = `${req.protocol}://${req.get('host')}/audio/${greetingAudioId}`;
      twiml.play(greetingUrl);
    } else {
      // Fallback to Twilio TTS
      twiml.say('Hello! Connecting you to our AI assistant...');
    }

    // For now, we'll use a simple gathering to collect speech
    const gather = twiml.gather({
      input: 'speech',
      action: '/process-speech',
      timeout: 3,
      speechTimeout: 'auto'
    });

    // Generate ElevenLabs audio for instructions
    const promptAudioId = await elevenlabsService.generateSpeech('Please speak.');
    if (promptAudioId) {
      const promptUrl = `${req.protocol}://${req.get('host')}/audio/${promptAudioId}`;
      gather.play(promptUrl);
    } else {
      // Fallback to Twilio TTS
      gather.say('Please speak.');
    }

    // If no speech detected, end call
    twiml.say('We didn\'t hear anything. Goodbye!');
    twiml.hangup();

  } catch (error) {
    console.error('Error in voice endpoint:', error);
    // Fallback to all Twilio TTS
    twiml.say('Hello! Connecting you to our AI assistant...');
    const gather = twiml.gather({
      input: 'speech',
      action: '/process-speech',
      timeout: 3,
      speechTimeout: 'auto'
    });
    gather.say('Please speak your message after the beep.');
    twiml.say('We didn\'t hear anything. Goodbye!');
    twiml.hangup();
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
      // Get AI response from xAI
      const aiResponse = await xaiService.generateResponse(speechResult);

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
      const fallbackText = speechResult ?
        'I apologize, but I\'m having trouble generating audio right now. Please try again.' :
        'I didn\'t catch that. Could you please repeat?';
      twiml.say(fallbackText);
    }

    // Continue the conversation
    const gather = twiml.gather({
      input: 'speech',
      action: '/process-speech',
      timeout: 3,
      speechTimeout: 'auto'
    });

    // Generate ElevenLabs audio for simple follow-up prompt
    const followUpAudioId = await elevenlabsService.generateSpeech('Go ahead.');
    if (followUpAudioId) {
      const followUpUrl = `${req.protocol}://${req.get('host')}/audio/${followUpAudioId}`;
      gather.play(followUpUrl);
    } else {
      // Fallback to Twilio TTS
      gather.say('Go ahead.');
    }

  } catch (error) {
    console.error('Error processing speech:', error);
    twiml.say('I apologize, but I\'m having technical difficulties. Please try calling back later.');
  }

  twiml.say('Thank you for calling. Goodbye!');
  twiml.hangup();

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

app.listen(port, () => {
  console.log(`AI Voice Agent listening on port ${port}`);
});
