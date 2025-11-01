import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings, Play, Pause } from 'lucide-react';

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

  // Soccer keyword dictionary
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
      'defensa': 'defense',
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
      'defense': 'defensa',
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
    
    // Try to match keywords
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
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => prev + finalTranscript);
        
        // Translate using dictionary
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
    
      
        {/* Header */}
        
          ⚽ Soccer Translator
          Real-time commentary translation
        

        {/* Status Card */}
        
          
            
              
              {status}
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/10 rounded-lg transition"
            >
              
            
          

          {/* Settings Panel */}
          {showSettings && (
            
              
                Source Language (What you hear)
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full bg-white/10 rounded px-3 py-2 text-white"
                  disabled={isListening}
                >
                  Spanish
                  English
                  German
                  Italian
                  French
                
              
              
                Target Language (Translation)
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full bg-white/10 rounded px-3 py-2 text-white"
                  disabled={isListening}
                >
                  English
                  Spanish
                  German
                  Italian
                  French
                
              
              
                ⇄ Swap Languages
              
            
          )}

          {/* Controls */}
          
            
              {isListening ? (
                <>
                  
                  Stop Listening
                </>
              ) : (
                <>
                  
                  Start Listening
                </>
              )}
            
            <button
              onClick={() => setIsSpeaking(!isSpeaking)}
              className={`px-4 rounded-lg transition ${
                isSpeaking ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              {isSpeaking ?  : }
            
          

          {isListening && (
            
              💡 Place your device near the TV speaker
            
          )}
        

        {/* Transcripts */}
        
          {/* Original Commentary */}
          
            
              Original Commentary
              
                {sourceLanguage.split('-')[0].toUpperCase()}
              
            
            
              {transcript || 'Waiting for commentary...'}
            
          

          {/* Translation */}
          
            
              Translation
              
                {targetLanguage.split('-')[0].toUpperCase()}
              
            
            
              {translation || 'Translation will appear here...'}
            
          
        

        {/* Clear Button */}
        {(transcript || translation) && (
          
            Clear Transcripts
          
        )}

        {/* Instructions */}
        
          📱 How to use:
          
            Allow microphone access when prompted
            Select your source and target languages
            Press "Start Listening"
            Place device near TV speaker (6-12 inches)
            Watch the match with real-time translation!
          
          
            ⚠️ Note: This prototype uses browser speech recognition. Works best in Safari on iPhone.
          
        
      
    
  );
};

export default SoccerTranslator;
