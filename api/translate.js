// Vercel Serverless Function for GPT-4 Translation
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, sourceLanguage, targetLanguage } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    // Soccer-specific translation prompt
    const systemPrompt = `You are a professional soccer commentary translator. 
Translate the following soccer commentary from ${sourceLanguage} to ${targetLanguage}.
Maintain the excitement and energy of the original commentary.
Preserve soccer-specific terms accurately (goal, penalty, offside, corner, etc.).
Keep the translation concise and natural.`;

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using mini for speed and cost efficiency
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI error:', errorText);
      return res.status(response.status).json({ error: 'OpenAI API error' });
    }

    const result = await response.json();
    const translation = result.choices[0]?.message?.content || '';

    return res.status(200).json({
      translation,
      originalText: text,
    });

  } catch (error) {
    console.error('Translation error:', error);
    return res.status(500).json({ error: 'Translation failed', details: error.message });
  }
}