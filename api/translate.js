export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { text, sourceLanguage, targetLanguage } = req.body;
    if (!text) return res.status(400).json({ error: 'No text' });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(500).json({ error: 'API key missing' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: `Translate to ${targetLanguage}. Output ONLY the translation. Keep the same energy and emotion.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.2,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Translation failed' });
    }

    const result = await response.json();
    const translation = result.choices[0]?.message?.content || '';

    return res.status(200).json({ translation, originalText: text });

  } catch (error) {
    console.error('Translate error:', error);
    return res.status(500).json({ error: 'Failed', details: error.message });
  }
}