import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Settings, Play, Pause, Wifi, WifiOff } from 'lucide-react';

const SoccerTranslator = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(true);
  const [sourceLanguage, setSourceLanguage] = useState('it');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [transcript, setTranscript] = useState('');
  const [translation, setTranslation] = useState('');
  const [status, setStatus] = useState('Ready to start');
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const streamRef = useRef(null);

  const languageMap = {
    'it': { code: 'it', name: 'Italian', fullCode: 'it-IT' },
    'es': { code: 'es', name: 'Spanish', fullCode: 'es-ES' },
    'en': { code: 'en', name: 'English', fullCode: 'en-US' },
    'de': { code: 'de', name: 'German', fullCode: 'de-DE' },
    'fr': { code: 'fr', name: 'French', fullCode: 'fr-FR' },
  };

  const processAudioChunk = async (audioBlob) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];

        // Step 1: Transcribe with Deepgram
        setStatus('Transcribing...');
        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioData: base64Audio,
            language: sourceLanguage,
          }),
        });

        if (!transcribeRes.ok) {
          throw new Error('Transcription failed');
        }

        const { transcript: newTranscript } = await transcribeRes.json();
        
        if (!newTranscript || newTranscript.trim().length === 0) {
          setIsProcessing(false);
          setStatus('Listening to commentary...');
          return;
        }

        setTranscript(prev => prev + newTranscript + ' ');

        // Step 2: Translate with GPT-4
        setStatus('Translating...');
        const translateRes = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: newTranscript,
            sourceLanguage: languageMap[sourceLanguage].name,
            targetLanguage: languageMap[targetLanguage].name,
          }),
        });

        if (!translateRes.ok) {
          throw new Error('Translation failed');
        }

        const { translation: newTranslation } = await translateRes.json();
        setTranslation(prev => prev + newTranslation + ' ');

        // Step 3: Generate speech with ElevenLabs
        if (isSpeaking) {
          setStatus('Generating speech...');
          const speakRes = await fetch('/api/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: newTranslation,
              language: targetLanguage,
            }),
          });

          if (speakRes.ok) {
            const { audio } = await speakRes.json();
            
            // Play audio
            const audioBlob = new Blob(
              [Uint8Array.from(atob(audio), c => c.charCodeAt(0))],
              { type: 'audio/mpeg' }
            );
            const audioUrl = URL.createObjectURL(audioBlob);
            const audioElement = new Audio(audioUrl);
            audioElement.play();
          }
        }

        setStatus('Listening to commentary...');
        setIsProcessing(false);
      };

    } catch (error) {
      console.error('Processing error:', error);
      setStatus(`Error: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });
      
      streamRef.current = stream;
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Process every 3 seconds
      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          processAudioChunk(audioBlob);
          audioChunksRef.current = [];
        }
      };

      // Start recording in 3-second chunks
      mediaRecorder.start();
      setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 3000);

      setIsListening(true);
      setStatus('Listening to commentary...');

    } catch (error) {
      console.error('Microphone error:', error);
      setStatus('Microphone access denied. Please allow access.');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
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
          <h1 className="text-3xl font-bold mb-2">⚽ Soccer Translator Pro</h1>
          <p className="text-green-200 text-sm">AI-powered real-time translation</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Wifi size={16} className="text-green-400" />
            <span className="text-xs text-green-300">Using Professional APIs</span>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">{status}</span>
              {isProcessing && (
                <div className="ml-2 text-xs text-yellow-300">Processing...</div>
              )}
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
                <label className="text-sm text-green-200 mb-1 block">Source Language</label>
                <select
                  value={sourceLanguage}
                  onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full bg-white/10 rounded px-3 py-2 text-white"
                  disabled={isListening}
                >
                  <option value="it">Italian</option>
                  <option value="es">Spanish</option>
                  <option value="en">English</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-green-200 mb-1 block">Target Language</label>
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full bg-white/10 rounded px-3 py-2 text-white"
                  disabled={isListening}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="it">Italian</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
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
              disabled={isProcessing}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-lg font-semibold transition ${
                isListening
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-green-600 hover:bg-green-700'
              } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
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
              💡 Place device 3-6 inches from TV speaker for best results
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-green-200">Original Commentary</h3>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                {languageMap[sourceLanguage].name.toUpperCase()}
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
                {languageMap[targetLanguage].name.toUpperCase()}
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
          <h4 className="font-semibold mb-2">🚀 Pro Features Active:</h4>
          <ul className="space-y-1 text-blue-100 list-disc list-inside">
            <li>Deepgram AI for accurate transcription</li>
            <li>GPT-4 for context-aware translation</li>
            <li>ElevenLabs for natural voice output</li>
            <li>3-second chunk processing for real-time feel</li>
          </ul>
          <p className="mt-3 text-xs text-blue-200">
            ⚡ Much better quality than browser APIs!
          </p>
        </div>
      </div>
    </div>
  );
};

export default SoccerTranslator;