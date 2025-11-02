export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { audioData, language } = req.body;
    if (!audioData) return res.status(400).json({ error: 'No audio data' });

    const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
    if (!DEEPGRAM_API_KEY) return res.status(500).json({ error: 'API key missing' });

    const audioBuffer = Buffer.from(audioData, 'base64');

    const response = await fetch(
      `https://api.deepgram.com/v1/listen?language=${language}&punctuate=true`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': 'audio/wav',
        },
        body: audioBuffer,
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Deepgram failed' });
    }

    const result = await response.json();
    const transcript = result.results?.channels[0]?.alternatives[0]?.transcript || '';
    const confidence = result.results?.channels[0]?.alternatives[0]?.confidence || 0;

    // Keyword filtering
    const keywords = [
      // English
      'goal', 'goooal', 'penalty', 'red card', 'yellow card', 'offside', 'var',
      'corner', 'free kick', 'foul', 'substitution', 'shot', 'save', 'referee',
      'header', 'handball', 'tackle', 'booking', 'whistle',
      // Italian
      'gol', 'goool', 'rigore', 'cartellino rosso', 'cartellino giallo',
      'fuorigioco', 'angolo', 'punizione', 'fallo', 'sostituzione',
      'tiro', 'parata', 'arbitro', 'colpo di testa', 'mano', 'ammonizione',
      // Spanish
      'golazo', 'penalti', 'tarjeta roja', 'tarjeta amarilla',
      'córner', 'tiro libre', 'árbitro',
    ];

    const transcriptLower = transcript.toLowerCase();
    const containsKeyword = keywords.some(kw => transcriptLower.includes(kw));

	if (!containsKeyword || confidence < 0.75) {
		// TEMPORARY: Return what we're filtering so you can see
		return res.status(200).json({ 
		transcript, 
		confidence,
		filtered: true,
		reason: !containsKeyword ? 'no keywords' : 'low confidence'
	});
	}

    return res.status(200).json({ transcript, confidence });

  } catch (error) {
    console.error('Transcribe error:', error);
    return res.status(500).json({ error: 'Failed', details: error.message });
  }
}