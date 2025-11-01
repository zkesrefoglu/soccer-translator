import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Settings, Play, Pause } from 'lucide-react';

const SoccerTranslator = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState('es-ES');
  const [targetLanguage, setTargetLanguage] = useState('en-US');
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [status, setStatus] = useState('Ready to start');
  const [showSettings, setShowSettings] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(typeof window !== 'undefined' ? window.speechSynthesis : null);

  const soccerDictionary = {
    'es-en': {
      'gol': 'goal',
      'golazo': 'amazing goal',
      'penalti': 'penalty',
      'penal': 'penalty',
      'falta': 'foul',
      'tarjeta amarilla': 'yellow card',
      'tarjeta roja': 'red card',
      'fuera de juego': 'offside',
      'offside': 'offside',
      'córner': 'corner',
      'corner': 'corner kick',
      'saque de esquina': 'corner kick',
      'tiro libre': 'free kick',
      'portero': 'goalkeeper',
      'arquero': 'goalkeeper',
      'defensa': 'defender',
      'delantero': 'forward',
      'mediocampista': 'midfielder',
      'medio': 'midfielder',
      'centro': 'cross',
      'remate': 'shot',
      'tiro': 'shot',
      'disparo': 'shot',
      'cabezazo': 'header',
      'pase': 'pass',
      'jugada': 'play',
      'contra ataque': 'counter attack',
      'contraataque': 'counter attack',
      'tiempo extra': 'extra time',
      'medio tiempo': 'half time',
      'partido': 'match',
      'empate': 'tie',
      'victoria': 'victory',
      'derrota': 'defeat',
      'ataque': 'attack',
      'balón': 'ball',
      'pelota': 'ball',
      'árbitro': 'referee',
      'línea': 'line',
      'área': 'box',
      'cambio': 'substitution'
    },
    'en-es': {
      'goal': 'gol',
      'amazing goal': 'golazo',
      'penalty': 'penalti',
      'foul': 'falta',
      'yellow card': 'tarjeta amarilla',
      'red card': 'tarjeta roja',
      'offside': 'fuera de juego',
      'corner': 'córner',
      'corner kick': 'saque de esquina',
      'free kick': 'tiro libre',
      'goalkeeper': 'portero',
      'defender': 'defensa',
      'forward': 'delantero',
      'midfielder': 'mediocampista',
      'cross': 'centro',
      'shot': 'tiro',
      'header': 'cabezazo',
      'pass': 'pase',
      'play': 'jugada',
      'counter attack': 'contraataque',
      'extra time': 'tiempo extra',
      'half time': 'medio tiempo',
      'match': 'partido',
      'tie': 'empate',
      'victory': 'victoria',
      'defeat': 'derrota',
      'attack': 'ataque',
      'ball': 'balón',
      'referee': 'árbitro',
      'line': 'línea',
      'box': 'área',
      'substitution': 'cambio'
    }
  };

  const translateWithDictionary = (text, direction) => {
    const dict = soccerDictionary[direction];
    let translated = text.toLowerCase();
    
    for (const [key, value] of Object.entries(dict)) {
      const regex = new RegExp('\\b' + key + '\\b', 'gi');
      translated = translated.replace(regex, value);
    }
    
    return translated;
  };

  const speak = (text, lang) => {
    if (!isSpeaking || !synthRef.current) return;
    
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (typeof window === 'undefined') return;
    
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setStatus('Speech recognition not supported. Please use Chrome or Safari.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = sourceLanguage;

    recognition.onstart = () => {
      setStatus('Listening to commentary...');
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        
        const direction = sourceLanguage.startsWith('es') ? 'es-en' : 'en-es';
        const translated = translateWithDictionary(finalTranscript, direction);
        
        setTranslation(prev => prev + translated + ' ');
        speak(translated, targetLanguage);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setStatus(`Error: ${event.error}. Try allowing microphone access.`);
      if (event.error === 'not-allowed') {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Failed to restart recognition:', e);
          setIsListening(false);
          setStatus('Stopped');
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      setStatus('Failed to start. Please refresh and try again.');
      console.error('Recognition start error:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setStatus('Stopped');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearTranscripts = () => {
    setTranscript('');
    setTranslation('');
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    clearTranscripts();
    if (isListening) {
      stopListening();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">⚽ Soccer Translator</h1>
          <p className="text-green-200 text-sm">Real-time commentary translation</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">{status}</span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              <Settings size={20} />
            </button>
          </div>

          {showSettings && (
            <div className="bg-black/20 rounded-lg p-4 mb-4 space-y-3">
              <div>
                <label className="text-sm text-green-200 mb-1 block">Source Language (What you hear)</label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full bg-white/10 rounded px-3 py-2 text-white"
                  disabled={isListening}
                >
                  <option value="es-ES">Spanish</option>
                  <option value="en-US">English</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="fr-FR">French</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-green-200 mb-1 block">Target Language (Translation)</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full bg-white/10 rounded px-3 py-2 text-white"
                  disabled={isListening}
                >
                  <option value="en-US">English</option>
                  <option value="es-ES">Spanish</option>
                  <option value="de-DE">German</option>
                  <option value="it-IT">Italian</option>
                  <option value="fr-FR">French</option>
                </select>
              </div>
              <button
                onClick={swapLanguages}
                className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg transition"
                disabled={isListening}
              >
                ⇄ Swap Languages
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={toggleListening}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-semibold transition ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isListening ? (
                <>
                  <Pause size={24} />
                  Stop Listening
                </>
              ) : (
                <>
                  <Play size={24} />
                  Start Listening
                </>
              )}
            </button>
            <button
              onClick={() => setIsSpeaking(!isSpeaking)}
              className={`px-4 rounded-lg transition ${
                isSpeaking ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {isSpeaking ? <Volume2 size={24} /> : <VolumeX size={24} />}
            </button>
          </div>

          {isListening && (
            <div className="mt-3 text-xs text-green-200 text-center">
              💡 Place your device near the TV speaker
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-green-200">Original Commentary</h3>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                {sourceLanguage.split('-')[0].toUpperCase()}
              </span>
            </div>
            <div className="bg-black/20 rounded p-3 min-h-[100px] max-h-[200px] overflow-y-auto text-sm">
              {transcript || 'Waiting for commentary...'}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-green-200">Translation</h3>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                {targetLanguage.split('-')[0].toUpperCase()}
              </span>
            </div>
            <div className="bg-black/20 rounded p-3 min-h-[100px] max-h-[200px] overflow-y-auto text-sm">
              {translation || 'Translation will appear here...'}
            </div>
          </div>
        </div>

        {(transcript || translation) && (
          <button
            onClick={clearTranscripts}
            className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm"
          >
            Clear Transcripts
          </button>
        )}

        <div className="mt-6 bg-blue-900/30 border border-blue-500/30 rounded-lg p-4 text-sm">
          <h4 className="font-semibold mb-2">📱 How to use:</h4>
          <ol className="space-y-1 text-blue-100 list-decimal list-inside">
            <li>Allow microphone access when prompted</li>
            <li>Select your source and target languages</li>
            <li>Press "Start Listening"</li>
            <li>Place device near TV speaker (6-12 inches)</li>
            <li>Watch the match with real-time translation!</li>
          </ol>
          <p className="mt-3 text-xs text-blue-200">
            ⚠️ Note: This prototype uses browser speech recognition. Works best in Safari on iPhone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SoccerTranslator;