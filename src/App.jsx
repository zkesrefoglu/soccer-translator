import React, { useState, useRef } from 'react';
import { Settings, Play, Pause } from 'lucide-react';

const SoccerTranslator = () => {
  const [isListening, setIsListening] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('it');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [events, setEvents] = useState([]);
  const [status, setStatus] = useState('Ready');
  const [showSettings, setShowSettings] = useState(false);
  const [stats, setStats] = useState({ captured: 0, filtered: 0, translated: 0 });

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const languageMap = {
    'it': 'Italian',
    'es': 'Spanish',
    'en': 'English',
    'de': 'German',
    'fr': 'French',
  };

  const processAudioChunk = async (audioBlob) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64Audio = reader.result.split(',')[1];

        setStats(prev => ({ ...prev, captured: prev.captured + 1 }));

        // Transcribe with keyword filtering
        const transcribeRes = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioData: base64Audio, language: sourceLanguage }),
        });

        if (transcribeRes.status === 204) {
          // Filtered out - no keywords
          setStats(prev => ({ ...prev, filtered: prev.filtered + 1 }));
          return;
        }

        if (!transcribeRes.ok) return;

        const { transcript } = await transcribeRes.json();
        if (!transcript) return;

        // Translate
        const translateRes = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: transcript,
            sourceLanguage: languageMap[sourceLanguage],
            targetLanguage: languageMap[targetLanguage],
          }),
        });

        if (!translateRes.ok) return;

        const { translation } = await translateRes.json();
        
        setStats(prev => ({ ...prev, translated: prev.translated + 1 }));
        
        // Add event bubble
        setEvents(prev => [...prev, {
          id: Date.now(),
          original: transcript,
          translation: translation,
          time: new Date().toLocaleTimeString()
        }]);
      };

    } catch (error) {
      console.error('Error:', error);
    }
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 16000 } 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          processAudioChunk(audioBlob);
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.start();
      setInterval(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          mediaRecorder.start();
        }
      }, 3000);

      setIsListening(true);
      setStatus('Listening...');

    } catch (error) {
      setStatus('Mic access denied');
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
    setStatus('Stopped');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">⚽ Soccer Moments</h1>
          <p className="text-green-200 text-sm">Key events only</p>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm">{status}</span>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="p-2 hover:bg-white/10 rounded">
              <Settings size={20} />
            </button>
          </div>

          {showSettings && (
            <div className="bg-black/20 rounded p-3 mb-4 space-y-2">
              <div>
                <label className="text-xs text-green-200 block mb-1">Source Language</label>
                <select value={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value)}
                  className="w-full bg-white/10 rounded px-2 py-1 text-sm" disabled={isListening}>
                  <option value="it">Italian</option>
                  <option value="es">Spanish</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-green-200 block mb-1">Target Language</label>
                <select value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)}
                  className="w-full bg-white/10 rounded px-2 py-1 text-sm" disabled={isListening}>
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="it">Italian</option>
                </select>
              </div>
            </div>
          )}

          <button onClick={isListening ? stopListening : startListening}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold ${
              isListening ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}>
            {isListening ? <><Pause size={20} /> Stop</> : <><Play size={20} /> Start</>}
          </button>

          {isListening && (
            <div className="mt-3 text-xs text-center text-green-200">
              📊 Captured: {stats.captured} | Filtered: {stats.filtered} | Translated: {stats.translated}
            </div>
          )}
        </div>

        {/* Event Bubbles */}
        <div className="space-y-3">
          {events.length === 0 ? (
            <div className="text-center text-green-300 py-8">
              Waiting for key moments...
            </div>
          ) : (
            events.slice().reverse().map(event => (
              <div key={event.id} className="bg-white/10 backdrop-blur rounded-lg p-4 animate-fade-in">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-green-300">{event.time}</span>
                  <span className="text-xs bg-green-600 px-2 py-1 rounded">KEY MOMENT</span>
                </div>
                <div className="text-sm text-gray-300 mb-1">{event.original}</div>
                <div className="text-lg font-semibold">{event.translation}</div>
              </div>
            ))
          )}
        </div>

        {events.length > 0 && (
          <button onClick={() => setEvents([])}
            className="w-full mt-4 py-2 bg-white/10 hover:bg-white/20 rounded text-sm">
            Clear Events
          </button>
        )}

      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default SoccerTranslator;