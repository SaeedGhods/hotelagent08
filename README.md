# AI Voice Agent

A simple voice-based AI agent using Twilio and xAI that you can call via phone.

## Setup Instructions

### 1. Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp env.example .env
```

Fill in the following values in `.env`:

- **TWILIO_ACCOUNT_SID**: Your Twilio Account SID
- **TWILIO_AUTH_TOKEN**: Your Twilio Auth Token
- **TWILIO_PHONE_NUMBER**: Your Twilio phone number
- **XAI_API_KEY**: Your xAI API key
- **ELEVENLABS_API_KEY**: Your ElevenLabs API key
- **ELEVENLABS_VOICE_ID**: Your custom ElevenLabs voice ID (optional)

### 2. Twilio Setup

1. Sign up for a [Twilio account](https://www.twilio.com/)
2. Get a phone number
3. Configure the voice webhook URL to: `https://your-render-app-url.onrender.com/voice`

### 3. xAI Setup

1. Get an xAI API key from [xAI](https://x.ai/)
2. Add it to your `.env` file

### 4. ElevenLabs Setup

1. Sign up for an [ElevenLabs account](https://elevenlabs.io/)
2. Get your API key from the dashboard
3. **Optional:** Create a custom voice in your ElevenLabs dashboard
4. Find your voice ID (see instructions below)
5. Add these to your `.env` file:
   - `ELEVENLABS_API_KEY=your_elevenlabs_api_key_here`
   - `ELEVENLABS_VOICE_ID=your_custom_voice_id_here` (optional, defaults to Rachel voice)

### 4. Deploy to Render

1. Push this code to GitHub
2. Connect your GitHub repo to [Render](https://render.com/)
3. Use the render.yaml configuration for automatic deployment

## Local Development

```bash
npm install
npm start
```

The server will run on http://localhost:3000

## API Endpoints

- `GET /`: Health check
- `POST /voice`: Twilio voice webhook
- `POST /process-speech`: Speech processing endpoint

## How It Works

1. Someone calls your Twilio number
2. Twilio sends a request to `/voice`
3. The app responds with TwiML to gather speech input
4. Speech is transcribed and sent to xAI for processing
5. xAI generates a response, which is converted to speech by ElevenLabs
6. High-quality audio is played back to the caller
7. The conversation continues until the caller hangs up

## Finding Your Voice ID

To use your custom "saeed" voice:

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/voices)
2. Find your custom voice in the list
3. Click on it to open the voice details
4. Copy the **Voice ID** (looks like: `abc123...`)
5. Add it as `ELEVENLABS_VOICE_ID` in your environment variables

**Default Voice:** If no voice ID is provided, it uses ElevenLabs' "Rachel" voice.
