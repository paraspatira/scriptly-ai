const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint to generate script
app.post('/api/generate', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const { prompt, length } = req.body;

  if (!prompt || prompt.trim() === '') {
    return res.status(400).json({ error: 'Video topic or idea is required.' });
  }

  if (!apiKey || apiKey === 'your_api_key_here' || apiKey.trim() === '') {
    return res.status(500).json({
      error: 'Gemini API key is not configured. Please add your GEMINI_API_KEY to the .env file in the server root.'
    });
  }

  // Handle local mock development / verification mode
  if (apiKey === 'MOCK') {
    return res.json({
      title: `How to Master "${prompt}" in 30 Days (${length} Edition)`,
      hook: `[Visual: Dynamic text '${prompt.toUpperCase()} IN 30 DAYS' flashes on screen]\n[SFX: Synth swell]\n\nHey everyone! Ever felt overwhelmed by "${prompt}"? Today, I'm breaking down a complete, step-by-step roadmap to master it in exactly 30 days. No fluff, just the exact skills you need to succeed. Let's get started.`,
      mainScript: `[Visual: Show calendar grid highlighting Weeks 1 to 4]\n\nWeek 1 is all about the fundamentals. You'll master the basics and set up your workspace.\n\n[Visual: Screen recording showing simple hands-on practice]\n\nWeek 2, we start building real projects. This is where the magic happens. You'll apply the fundamentals to solve real-world problems.\n\nWeek 3, advanced concepts. Deep dive into optimization and complex workflows. This is what separates beginners from pros.`,
      outro: `[Visual: Show YouTube Subscribe button and link to code repository]\n\nIf you want the full daily syllabus, check the link in the description. Hit subscribe for more tutorials, and I'll see you in the next video!`
    });
  }

  // Determine target length guidelines
  let targetWords = '';
  let durationText = '';
  switch (length) {
    case 'Short':
      targetWords = '150-300 words';
      durationText = 'Short (1-2 minutes)';
      break;
    case 'Long':
      targetWords = '1500-2250 words';
      durationText = 'Long (10-15 minutes)';
      break;
    case 'Medium':
    default:
      targetWords = '750-1200 words';
      durationText = 'Medium (5-8 minutes)';
      break;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure JSON output format using the SDK schema properties
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            title: { type: 'STRING' },
            hook: { type: 'STRING' },
            mainScript: { type: 'STRING' },
            outro: { type: 'STRING' }
          },
          required: ['title', 'hook', 'mainScript', 'outro']
        }
      }
    });

    const systemPrompt = `You are a professional YouTube scriptwriter. Your task is to generate a complete, engaging, and well-structured video script based on the user's video idea or topic.
    
Topic/Idea: "${prompt}"
Requested Length: ${durationText} (Target word count: ${targetWords})

Structure the response with the following elements:
1. title: A high-click-through-rate (CTR) title.
2. hook: A gripping opening hook (first 15-30 seconds) that keeps viewers watching.
3. mainScript: The bulk of the content. Use paragraphs and add visual cues/actions in square brackets like [Visual: Show screen transition] or sound effect cues like [SFX: Subtle chime] to guide the creator.
4. outro: A clear ending with a call-to-action (subscribing, checking links, etc.).

Strictly output only a single JSON object matching the required schema. Do not include markdown code blocks.`;

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    
    // Parse the structured output
    const scriptData = JSON.parse(responseText);
    res.json(scriptData);
  } catch (error) {
    console.error('Gemini Generation Error:', error);
    res.status(500).json({
      error: `Failed to generate script: ${error.message || error}`
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
