// Vercel Serverless Function for Smart Translation

// Soccer keyword dictionary for instant translation
const soccerDictionary = {
  'it-en': {
    'gol': 'goal',
    'goool': 'goooal',
    'rigore': 'penalty',
    'calcio di rigore': 'penalty kick',
    'fallo': 'foul',
    'cartellino giallo': 'yellow card',
    'cartellino rosso': 'red card',
    'fuorigioco': 'offside',
    'calcio d\'angolo': 'corner kick',
    'angolo': 'corner',
    'calcio di punizione': 'free kick',
    'punizione': 'free kick',
    'portiere': 'goalkeeper',
    'difensore': 'defender',
    'attaccante': 'forward',
    'centrocampista': 'midfielder',
    'cross': 'cross',
    'tiro': 'shot',
    'colpo di testa': 'header',
    'passaggio': 'pass',
    'azione': 'play',
    'contropiede': 'counter attack',
    'tempi supplementari': 'extra time',
    'primo tempo': 'first half',
    'secondo tempo': 'second half',
    'partita': 'match',
    'pareggio': 'tie',
    'vittoria': 'victory',
    'sconfitta': 'defeat',
    'attacco': 'attack',
    'difesa': 'defense',
    'palla': 'ball',
    'pallone': 'ball',
    'arbitro': 'referee',
    'linea': 'line',
    'area': 'box',
    'area di rigore': 'penalty area',
    'sostituzione': 'substitution',
    'cambio': 'substitution',
  },
  'es-en': {
    'gol': 'goal',
    'golazo': 'amazing goal',
    'penalti': 'penalty',
    'penal': 'penalty',
    'falta': 'foul',
    'tarjeta amarilla': 'yellow card',
    'tarjeta roja': 'red card',
    'fuera de juego': 'offside',
    'córner': 'corner',
    'tiro libre': 'free kick',
    'portero': 'goalkeeper',
    'defensa': 'defender',
    'delantero': 'forward',
    'mediocampista': 'midfielder',
    'centro': 'cross',
    'tiro': 'shot',
    'cabezazo': 'header',
    'pase': 'pass',
    'jugada': 'play',
    'contraataque': 'counter attack',
    'tiempo extra': 'extra time',
    'medio tiempo': 'half time',
    'partido': 'match',
    'empate': 'tie',
    'balón': 'ball',
    'árbitro': 'referee',
  },
  'en-es': {
    'goal': 'gol',
    'penalty': 'penalti',
    'foul': 'falta',
    'yellow card': 'tarjeta amarilla',
    'red card': 'tarjeta roja',
    'offside': 'fuera de juego',
    'corner': 'córner',
    'free kick': 'tiro libre',
    'goalkeeper': 'portero',
    'shot': 'tiro',
    'pass': 'pase',
  },
  'en-it': {
    'goal': 'gol',
    'penalty': 'rigore',
    'foul': 'fallo',
    'yellow card': 'cartellino giallo',
    'red card': 'cartellino rosso',
    'offside': 'fuorigioco',
    'corner': 'angolo',
    'free kick': 'punizione',
    'goalkeeper': 'portiere',
    'shot': 'tiro',
  }
};

function quickTranslateWithDictionary(text, sourceLang, targetLang) {
  const dictKey = `${sourceLang}-${targetLang}`;
  const dict = soccerDictionary[dictKey] || {};
  
  let translated = text.toLowerCase();
  
  // Replace keywords
  for (const [key, value] of Object.entries(dict)) {
    const regex = new RegExp('\\b' + key + '\\b', 'gi');
    translated = translated.replace(regex, value);
  }
  
  // Capitalize first letter
  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

export default async function handler(req, res) {
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

    // Get language codes (it, es, en, etc.)
    const sourceLang = sourceLanguage.toLowerCase().substring(0, 2);
    const targetLang = targetLanguage.toLowerCase().substring(0, 2);

    // For very short phrases (1-5 words), use dictionary only
    const wordCount = text.trim().split(/\s+/).length;
    
    if (wordCount <= 5) {
      const translation = quickTranslateWithDictionary(text, sourceLang, targetLang);
      return res.status(200).json({
        translation,
        originalText: text,
        method: 'dictionary',
      });
    }

    // For longer phrases, use GPT-4 with simple prompt
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY) {
      // Fallback to dictionary if no API key
      const translation = quickTranslateWithDictionary(text, sourceLang, targetLang);
      return res.status(200).json({ translation, originalText: text, method: 'dictionary-fallback' });
    }

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
            content: `You are a translator. Translate the following text to ${targetLanguage}. 
IMPORTANT: Your response must ONLY contain the translation in ${targetLanguage}. 
Do not include the original text. Do not explain. Just translate.
Keep the same tone and energy.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      // Fallback to dictionary on API error
      const translation = quickTranslateWithDictionary(text, sourceLang, targetLang);
      return res.status(200).json({ translation, originalText: text, method: 'dictionary-fallback' });
    }

    const result = await response.json();
    const translation = result.choices[0]?.message?.content || '';

    return res.status(200).json({
      translation,
      originalText: text,
      method: 'gpt4',
    });

  } catch (error) {
    console.error('Translation error:', error);
    
    // Final fallback to dictionary
    try {
      const { text, sourceLanguage, targetLanguage } = req.body;
      const sourceLang = sourceLanguage.toLowerCase().substring(0, 2);
      const targetLang = targetLanguage.toLowerCase().substring(0, 2);
      const translation = quickTranslateWithDictionary(text, sourceLang, targetLang);
      return res.status(200).json({ 
        translation, 
        originalText: text,
        method: 'dictionary-emergency',
        note: 'API failed, used dictionary'
      });
    } catch {
      return res.status(500).json({ error: 'Translation failed completely' });
    }
  }
}