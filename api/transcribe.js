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
	  'asistencia', 'árbitro asistente', 'atacante', 'taconazo', 'respaldos', 'balón', 'chilena', 'botas',
	  'precaución', 'celebración', 'pecho', 'cuchara', 'hoja limpia', 'tacos', 'entrenador', 'saque de esquina', 'tiro de esquina',
	  'contraataque', 'centro', 'larguero', 'defensa', 'expulsión', 'piscinazo', 'división', 'empate', 'regate',
	  'regate', 'amago', 'línea de fondo', 'gol de empate', 'equipación', 'prórroga', 'juego limpio', 'aficionados',
	  'banderín', 'simulación', 'golpe de suerte', 'fútbol', 'delantero', 'falta', 'cuarto árbitro', 'saque de falta', 'amistoso',
	  'tiempo completo', 'guantes', 'gol', 'saque de puerta', 'línea de gol', 'portero', 'portero', 'centrocampista defensivo',
	  'descanso', 'mano', 'hat-trick', 'remate de cabeza', 'cantada', 'guardameta', 'saque de centro', 'equipamiento', 'liga',
	  'pierna', 'vaselina', 'marcar', 'partido', 'medio', 'centrocampista', 'selección nacional', 'red', 'túnel', 'oficiales',
	  'fuera de juego', 'gol en propia meta', 'pase', 'penalti', 'área grande', 'penal', 'tanda de penaltis',
	  'campo', 'penalti', 'poste', 'despeje', 'tarjeta roja', 'árbitro', 'parada', 'media chilena', 'expulsado',
	  'espinilleras', 'camiseta', 'disparar', 'pantalones cortos', 'tiro', 'línea de banda', 'entrada deslizante', 'medias', 'delantero',
	  'suplente', 'líbero', 'equipos', 'pase al hueco', 'saque de banda', 'línea de banda', 'control', 'VAR', 'volea',
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
	  'helfen', 'schiedsrichter-assistent', 'angreifer', 'hackentrick', 'rückseiten', 'ball', 'fallrückzieher', 'schuhe',
	  'vorsicht', 'jubel', 'brust', 'lupfer', 'weiße weste', 'stollen', 'trainer', 'ecke', 'eckstoß',
	  'konter', 'flanke', 'latte', 'verteidiger', 'entlassung', 'schwalbe', 'aufteilung', 'zeichnen', 'dribbling',
	  'tröpfelnd', 'körpertäuschung', 'endlinie', 'ausgleich', 'ausrüstung', 'verlängerung', 'fair-play', 'fans',
	  'fahne', 'pleite', 'glückstreffer', 'fußball', 'vorwärts', 'foul', 'vierter offizieller', 'freistoß', 'freundlich',
	  'ende', 'handschuhe', 'tor', 'abstoß', 'torlinie', 'torwart', 'torwart', 'halber rücken',
	  'halbzeit', 'hand', 'hattrick', 'kopfball', 'schnitzer', 'torwart', 'anstoß', 'ausrüstung', 'liga',
	  'bein', 'heber', 'markieren', 'streichholz', 'mitte', 'mittelfeldspieler', 'nationalmannschaft', 'netz', 'tunnel', 'die offiziellen',
	  'abseits', 'eigentor', 'pass', 'elfmeter', 'strafraum', 'elfmeter', 'elfmeterschießen',
	  'rasen', 'pk', 'pfosten', 'stoßen', 'rote karte', 'schiedsrichter', 'parade', 'seitfallzieher', 'weggeschickt',
	  'schienbeinschoner', 'trikot', 'schieß', 'hose', 'schuss', 'seitenlinie', 'grätsche', 'socken'
	  
	const keywords_pt = [
	  'assistência', 'árbitro assistente', 'atacante', 'toque de', 'defesas', 'bola', 'de-bicicleta', 'chuteiras',
	  'precaução', 'celebração', 'peito', 'chapéu', 'balanço limpo', 'chuteiras', 'treinador', 'canto', 'pontapé de canto',
	  'contra-ataque', 'cruzamento', 'barra', 'defesa', 'expulsão', 'mergulho', 'divisão', 'empate', 'finta',
	  'drible', 'simulação', 'linha de fundo', 'golo de empate', 'equipamentos', 'prolongamento', 'fair play', 'adeptos',
	  'bandeirinha', 'simulação', 'momento fortuito', 'futebol', 'avançado', 'falta', 'quarto-árbitro', 'livre directo', 'amistoso',
	  'final do jogo', 'luvas', 'golo', 'pontapé-de-baliza', 'linha de baliza', 'guarda-redes', 'guarda-redes', 'medio-defensivo',
	  'intervalo', 'bola na mão', 'hat-trick', 'cabeceamento', '(guarda-redes)', 'guarda-redes', 'pontapé-de-saída', 'equipamento', 'liga',
	  'perna', 'chapéu longo', 'marcar', 'partida', 'medio', 'médio', 'selecção nacional', 'rede', 'túnel', 'árbitros',
	  'fora-de-jogo', 'autogolo', 'passe', 'penalty', 'grande área', 'pontapé de penalti', 'por penalties',
	  'campo', 'penalti', 'poste', 'pontapé longo', 'cartão vermelho', 'árbitro', 'defesa', 'remate à', 'expulso',
	  'caneleiras', 'camisola', 'remate', 'calções', 'remate', 'linha lateral', 'tackle deslizante', 'meias', 'ponta-de-lança',
	  'substituto', 'varredura', 'equipas', 'passe longo', 'linha lateral', 'linha lateral', 'dominar', 'VAR', 'volley',
	  'barreira', 'apito', 'cartão amarelo'
	];

	const keywords_pl = [
	  'asysta', 'asystent sędziego', 'napastnik', 'piętka', 'obrońcy', 'piłka', 'przewrotka', 'buty',
	  'żółta kartka', 'radość', 'klatka piersiowa', 'podcinka', 'czyste konto', 'korki', 'trener', 'rzut rożny', 'rzut rożny',
	  'kontratak', 'dośrodkowanie', 'poprzeczka', 'obrońca', 'wyrzucenie z boiska', 'jaskółka', 'liga', 'remis', 'dryblować',
	  'drybling', 'zmyłka', 'linia końcowa', 'gol wyrównujący', 'wyposażenie', 'dogrywka', 'fair play', 'kibice',
	  'chorągiewka', 'symulacja', 'przypadek', 'piłka nożna', 'napastnik', 'faul', 'sędzia', 'rzut wolny', 'mecz towarzyski',
	  'koniec meczu', 'rękawice', 'gol', 'rzut od bramki', 'linia bramkowa', 'bramkarz', 'bramkarz', 'pomocnik defensywny',
	  'przerwa', 'ręka', 'hat-trick', 'główka', 'wielki błąd', 'bramkarz', 'początek meczu', 'strój', 'liga',
	  'noga', 'lob', 'krycie', 'mecz', 'środkowy pomocnik', 'pomocnik', 'reprezentacja', 'siatka', 'kanał', 'sędziowie',
	  'spalony', 'gol samobójczy', 'podanie', 'rzut karny', 'pole karne', 'rzut karny', 'rzuty karne',
	  'murawa', 'rzut karny', 'słupek', 'wybicie piłki', 'czerwona kartka', 'sędzia', 'obrona', 'nożyce', 'czerwona kartka',
	  'ochraniacze na goleń', 'koszulka', 'strzelać', 'spodenki', 'strzał', 'linia boczna', 'wślizg', 'getry', 'napastnik',
	  'napastnik', 'libero', 'zespoły', 'podanie', 'wrzut z autu', 'linia boczna', 'przyjęcie piłki', 'VAR', 'wolej',
	  'mur', 'gwizdek', 'żółta kartka'
	];

	const keywords_ru = [
	  'ассист', 'помощник судьи', 'атакующий игрок', 'пятка', 'защита', 'мяч', 'себя в падении', 'бутсы',
	  'осторожность', 'празднование', 'грудь', 'подсечка', 'чистый лист', 'бутсы', 'тренер', 'угловой', 'угловой',
	  'контратака', 'навес', 'перекладина', 'защитник', 'удаление', 'нырок', 'дивизион', 'ничья', 'обводка',
	  'дриблинг', 'нулевое касание', 'линия ворот', 'уравнивающий гол', 'самое основное', 'дополнительное', 'фэйр-плей', 'болельщики',
	  'флажок', 'имитация падения', 'шальной гол', 'футбол', 'нападающий', 'фол', 'четвертый судья', 'штрафной удар', 'товарищеский матч',
	  'конец матча', 'перчатки', 'гол', 'удар от ворот', 'линия ворот', 'вратарь', 'вратарь', 'полузащитник',
	  'перерыв', 'игра рукой', 'хет-трик', 'удар головой', 'детская ошибка', 'вратарь', 'начальный удар', 'форма', 'лига',
	  'нога', 'удар за шиворот', 'отмечать', 'матч', 'центральный полузащитник', 'полузащитник', 'сборная', 'сетка', '“гамак”', 'арбитры',
	  'офсайд', 'автогол', 'пас', 'пенальти', 'штрафная', 'штрафной удар', 'серия пенальти',
	  'поле', 'пенальти', 'штанга', 'подавать мяч (пант)', 'красная карточка', 'судья', 'сейв', 'удар “ножницами”', 'удалён с поля',
	  'защита для голени', 'футболка', 'бить', 'шорты', 'удар', 'боковая линия', 'подкат', 'гетры', 'нападающий',
	  'запасной', 'свипер', 'команды', 'проникающий пас', 'аут', 'боковая линия', 'ловить мяч', 'VAR', 'удар с лета',
	  'стенка', 'свисток', 'желтая карточка'
	];
  
    // Keyword filtering
	const keywordMap = {
	  en: keywords_en,
	  es: keywords_es,
	  it: keywords_it,
	  de: keywords_de,
	  fr: keywords_fr,
	  pt: keywords_pt,
	  pl: keywords_pl,
	  ru: keywords_ru,
	};

	const keywords = keywordMap[language] || [];



    const transcriptLower = transcript.toLowerCase();
    const containsKeyword = keywords.some(kw => transcriptLower.includes(kw));

	if (!containsKeyword || confidence < 0.75) {
		// TEMPORARY: Return what we're filtering so you can see
		console.log(`[FILTERED] (${language}) "${transcript}" @ ${confidence}`);
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