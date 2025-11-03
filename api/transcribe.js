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
	
	const keywords_en = [
	  'assist', 'assistant referee', 'attacker', 'back heel', 'backs', 'ball', 'bicycle kick', 'boots',
	  'caution', 'celebration', 'chest', 'chip', 'clean sheet', 'cleats', 'coach', 'corner', 'corner kick',
	  'counterattack', 'cross', 'crossbar', 'defender', 'dismissal', 'dive', 'division', 'draw', 'dribble',
	  'dribbling', 'dummy', 'end line', 'equalizer', 'essential kit', 'extra time', 'fair play', 'fans',
	  'flag', 'flop', 'fluke', 'football', 'forward', 'foul', 'fourth official', 'free-kick', 'friendly',
	  'full time', 'gloves', 'goal', 'goal kick', 'goal line', 'goalie', 'goalkeeper', 'half back',
	  'half-time', 'handball', 'hat-trick', 'header', 'howler', 'keeper', 'kick-off', 'kit', 'league',
	  'leg', 'lob', 'mark', 'match', 'mid', 'midfielder', 'national team', 'net', 'nutmeg', 'officials',
	  'offside', 'own goal', 'pass', 'penalty', 'penalty area', 'penalty kick', 'penalty shoot-out',
	  'pitch', 'pk', 'post', 'punt', 'red card', 'referee', 'save', 'scissors kick', 'sent off',
	  'shin guards', 'shirt', 'shoot', 'shorts', 'shot', 'sideline', 'slide tackle', 'socks', 'striker',
	  'substitute', 'sweeper', 'teams', 'through ball', 'throw-in', 'touchline', 'trap', 'var', 'volley',
	  'wall', 'whistle', 'yellow card'
	];

	const keywords_es = [
	  'asistencia', 'arbitro asistente', 'atacante', 'taconazo', 'respaldos', 'balon', 'chilena', 'botas',
	  'precaucion', 'celebracion', 'pecho', 'cuchara', 'hoja limpia', 'tacos', 'entrenador', 'saque de esquina', 'tiro de esquina',
	  'contraataque', 'centro', 'larguero', 'defensa', 'expulsion', 'piscinazo', 'division', 'empate', 'regate',
	  'regate', 'amago', 'linea de fondo', 'gol de empate', 'equipacion', 'prorroga', 'juego limpio', 'aficionados',
	  'banderin', 'simulacion', 'golpe de suerte', 'futbol', 'delantero', 'falta', 'cuarto arbitro', 'saque de falta', 'amistoso',
	  'tiempo completo', 'guantes', 'gol', 'saque de puerta', 'linea de gol', 'portero', 'portero', 'centrocampista defensivo',
	  'descanso', 'mano', 'hat-trick', 'remate de cabeza', 'cantada', 'guardameta', 'saque de centro', 'equipamiento', 'liga',
	  'pierna', 'vaselina', 'marcar', 'partido', 'medio', 'centrocampista', 'seleccion nacional', 'red', 'tunel', 'oficiales',
	  'fuera de juego', 'gol en propia meta', 'pase', 'penalti', 'area grande', 'penal', 'tanda de penaltis',
	  'campo', 'penalti', 'poste', 'despeje', 'tarjeta roja', 'arbitro', 'parada', 'media chilena', 'expulsado',
	  'espinilleras', 'camiseta', 'disparar', 'pantalones cortos', 'tiro', 'linea de banda', 'entrada deslizante', 'medias', 'delantero',
	  'suplente', 'libero', 'equipos', 'pase al hueco', 'saque de banda', 'linea de banda', 'control', 'var', 'volea',
	  'barrera', 'silbato', 'tarjeta amarilla'
	];

	const keywords_it = [
	  'assist', 'assistente', 'attaccante', 'colpo di tacco', 'retropassaggi', 'pallone', 'bicicletta', 'scarpini',
	  'cautela', 'esultanza', 'petto', 'tocco sotto', 'foglio pulito', 'scarpe chiodate', 'allenatore', 'corner', 'calcio d\'angolo',
	  'contropiede', 'cross', 'traversa', 'difensore', 'espulsione', 'tuffo', 'divisione', 'pareggio', 'dribbling',
	  'dribbling', 'finta', 'linea di fondo', 'goal del pareggio', 'kit di base', 'supplementari', 'fair play', 'tifosi',
	  'bandierina', 'caduta simulata', 'colpo di fortuna', 'calcio', 'attaccante', 'fallo', 'quarto uomo', 'punizione', 'amichevole',
	  'finale', 'guantoni', 'gol', 'rimessa dal fondo', 'linea di porta', 'portiere', 'portiere', 'centrocampista difensivo',
	  'primo tempo', 'fallo di mano', 'tripletta', 'colpo di testa', 'papera', 'portiere', 'calcio d\'inizio', 'equipaggiamento', 'lega',
	  'gamba', 'pallonetto', 'marcare', 'partita', 'centrocampista', 'centrocampista', 'nazionale', 'rete', 'tunnel', 'ufficiali di gara',
	  'fuorigioco', 'autogol', 'passaggio', 'rigore', 'area di rigore', 'rigore', 'rigori',
	  'campo', 'rigore', 'palo', 'rinvio', 'cartellino rosso', 'arbitro', 'parata', 'sforbiciata', 'espulso',
	  'parastinchi', 'maglia', 'tira', 'calzoncini', 'tiro', 'linea laterale', 'scivolata', 'calzettoni', 'attaccante',
	  'nuovo entrato', 'libero', 'squadre', 'palla filtrante', 'rimessa laterale', 'linea laterale', 'trappola', 'VAR', 'tiro al volo',
	  'barriera', 'fischio', 'cartellino giallo'
	];

	const keywords_de = [
	  'helfen', 'schiedsrichter-assistent', 'angreifer', 'hackentrick', 'ruckseiten', 'ball', 'fallruckzieher', 'schuhe',
	  'vorsicht', 'jubel', 'brust', 'lupfer', 'weisse weste', 'stollen', 'trainer', 'ecke', 'eckstoss',
	  'konter', 'flanke', 'latte', 'verteidiger', 'entlassung', 'schwalbe', 'aufteilung', 'zeichnen', 'dribbling',
	  'tropfelnd', 'korpertauschung', 'endlinie', 'ausgleich', 'ausrustung', 'verlangerung', 'fair-play', 'fans',
	  'fahne', 'pleite', 'gluckstreffer', 'fussball', 'vorwarts', 'foul', 'vierter offizieller', 'freistoss', 'freundlich',
	  'ende', 'handschuhe', 'tor', 'abstoss', 'torlinie', 'torwart', 'torwart', 'halber rucken',
	  'halbzeit', 'hand', 'hattrick', 'kopfball', 'schnitzer', 'torwart', 'anstoss', 'ausrustung', 'liga',
	  'bein', 'heber', 'markieren', 'streichholz', 'mitte', 'mittelfeldspieler', 'nationalmannschaft', 'netz', 'tunnel', 'die offiziellen',
	  'abseits', 'eigentor', 'pass', 'elfmeter', 'strafraum', 'elfmeter', 'elfmeterschiessen',
	  'rasen', 'pk', 'pfosten', 'stossen', 'rote karte', 'schiedsrichter', 'parade', 'seitfallzieher', 'weggeschickt',
	  'schienbeinschoner', 'trikot', 'schiess', 'hose', 'schuss', 'seitenlinie', 'gratsche', 'socken'
	];
	  
	const keywords_fr = [
	  'passe decisive', 'arbitre assistant', 'attaquant', 'talonnade', 'arriere', 'balle', 'bicyclette', 'crampon',
	  'prudence', 'joie', 'poitrine', 'pichenette', 'feuille de match vierge', 'crampons', 'entraineur', 'corner', 'corner',
	  'contre-attaque', 'centre', 'barre', 'defenseur', 'expulsion', 'plongeon', 'division', 'match nul', 'dribble',
	  'dribble', 'feinte', 'ligne de fond', 'egalisation', 'essentiel equipement', 'prolongation', 'fair-play', 'les fans',
	  'drapeau', 'simulation', 'coup de billard', 'football', 'avant', 'faute', 'quatrieme officiel', 'coup franc', 'amical',
	  'fin du match', 'gants', 'but', 'degagement', 'ligne de but', 'gardien', 'gardien', 'demi',
	  'mi-temps', 'main', 'hat-trick', 'tete', 'erreur', 'gardien', 'coupd envoi', 'equipement', 'ligue',
	  'jambe', 'lob', 'marquer', 'match', 'milieu', 'milieu', 'equipe nationale', 'fille', 'petit pont', 'arbitres',
	  'hors-jeu', 'but contre son', 'passe', 'penalty', 'surface de', 'tir au but', 'tirs au but',
	  'bien', 'penalty', 'poteau', 'degagement', 'carton rouge', 'arbitre', 'arret', 'ciseau', 'expulse',
	  'protege-tibias', 'maillot', 'tir', 'short', 'coup', 'ligne de touche', 'tacle glisse', 'chaussettes', 'buteur',
	  'remplacement', 'libero', 'equipes', 'grace a billes', 'touche', 'ligne de touche', 'controle', 'var', 'volee',
	  'mur', 'sifflet', 'carton jaune'
	];

  
    // Keyword filtering
	const keywordMap = {
	  en: keywords_en,
	  es: keywords_es,
	  it: keywords_it,
	  de: keywords_de,
	  fr: keywords_fr,
	};

	const keywords = keywordMap[language] || [];

    const transcriptLower = transcript.toLowerCase();
    const containsKeyword = keywords.some(kw => transcriptLower.includes(kw));
	
	const wordCount = transcript.trim().split(/\s+/).length;
	const minConfidence = wordCount < 3 ? 0.5 : (language === 'en' ? 0.75 : 0.5);

	if (!containsKeyword || confidence < minConfidence) {
	  if (!containsKeyword && confidence >= minConfidence) {
		console.log(`[NO KEYWORD] (${language}) "${transcript}" @ ${confidence}`);
	  } else {
		console.log(`[FILTERED] (${language}) "${transcript}" @ ${confidence}`);
	  }

	  return res.status(200).json({
		transcript,
		confidence,
		filtered: true,
		reason: !containsKeyword ? 'no keywords' : 'low confidence',
	  });
	}



    return res.status(200).json({ transcript, confidence });

  } catch (error) {
    console.error('Transcribe error:', error);
    return res.status(500).json({ error: 'Failed', details: error.message });
  }
}