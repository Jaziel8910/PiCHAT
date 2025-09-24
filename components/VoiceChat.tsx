import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePuter } from '../hooks/usePuter';
import { XIcon, MicrophoneIcon, LoadingIcon, SettingsIcon, MuteIcon, SendIcon, ChevronDownIcon } from './Icons';
import { MODELS } from '../types';

declare const puter: any;
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface VoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
}

type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking';

export const VoiceChat: React.FC<VoiceChatProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [model, setModel] = useState('openrouter:x-ai/grok-4-fast:free');
  const [error, setError] = useState('');
  const [history, setHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  
  const { txt2speech, streamChatResponse } = usePuter();
  
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  
  const audioQueueRef = useRef<HTMLAudioElement[]>([]);
  const isPlayingRef = useRef(false);

  const playNextInQueue = useCallback(() => {
    if (isPlayingRef.current) return;

    const audio = audioQueueRef.current.shift();

    if (audio) {
        isPlayingRef.current = true;
        if (!isMuted) {
            audio.play().catch(e => {
                console.error("Audio play failed:", e);
                isPlayingRef.current = false;
                playNextInQueue(); // try next one
            });
        }
        audio.onended = () => {
            isPlayingRef.current = false;
            playNextInQueue();
        };
    } else {
        // Queue is empty, and we are not playing anything.
        if (status === 'speaking') {
             setStatus('idle');
        }
    }
  }, [isMuted, status]);

  const handleSendToAI = useCallback(async (text: string) => {
    const newHistory = [...history, { role: 'user', content: text }];
    setHistory(newHistory);
    setStatus('speaking');

    let sentenceBuffer = '';
    let fullResponse = '';
    
    streamChatResponse({
        model: model,
        messages: newHistory.map(m => ({...m, attachments: []})),
        onChunk: async (chunk) => {
            sentenceBuffer += chunk;
            fullResponse += chunk;
            const sentenceEnd = /[.?!]/.exec(sentenceBuffer);
            if (sentenceEnd) {
                const sentence = sentenceBuffer.substring(0, sentenceEnd.index + 1);
                sentenceBuffer = sentenceBuffer.substring(sentenceEnd.index + 1);
                
                if (sentence.trim()) {
                    const audio = await txt2speech(sentence, { engine: 'neural' });
                    if (audio) {
                        audioQueueRef.current.push(audio);
                        if(!isPlayingRef.current) playNextInQueue();
                    }
                }
            }
        },
        onError: (err) => {
            setError(err.message);
            setStatus('idle');
        },
        onDone: async () => {
            if (sentenceBuffer.trim()) {
                const audio = await txt2speech(sentenceBuffer, { engine: 'neural' });
                 if (audio) {
                    audioQueueRef.current.push(audio);
                    if(!isPlayingRef.current) playNextInQueue();
                }
            }
            // Wait for queue to finish before setting history
            const checkQueue = setInterval(() => {
                if (audioQueueRef.current.length === 0 && !isPlayingRef.current) {
                    clearInterval(checkQueue);
                    setHistory(prev => [...prev, {role: 'assistant', content: fullResponse}]);
                    setStatus('idle');
                }
            }, 100);
        }
    });
  }, [history, model, streamChatResponse, txt2speech, playNextInQueue]);

  const handleSendToAIRef = useRef(handleSendToAI);
  useEffect(() => {
      handleSendToAIRef.current = handleSendToAI;
  }, [handleSendToAI]);

  useEffect(() => {
    if (!isOpen) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        setError("Speech recognition is not supported in this browser.");
        return;
    }
    
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
        let interimTranscript = '';
        finalTranscriptRef.current = ''; // Reset and rebuild from scratch
        for (let i = 0; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscriptRef.current += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        setTranscript(finalTranscriptRef.current + interimTranscript);
    };
    
    recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        if (event.error !== 'aborted') {
          setError(`Speech recognition error: ${event.error}`);
        }
        setStatus('idle');
    };

    recognition.onstart = () => {
        finalTranscriptRef.current = '';
        setStatus('listening');
    };
    
    recognition.onend = () => {
        if (status !== 'listening') return;

        setStatus('processing');
        const finalTranscript = finalTranscriptRef.current.trim();
        if (finalTranscript) {
            setTranscript(finalTranscript);
            handleSendToAIRef.current(finalTranscript);
        } else {
            setStatus('idle');
        }
        finalTranscriptRef.current = '';
    };
    
    return () => {
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
        }
    };
  }, [isOpen, status]);

  const handleStartListening = useCallback(() => {
      if (status !== 'idle' || !recognitionRef.current) return;
      setError('');
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Could not start voice recognition.');
        setStatus('idle');
      }
  }, [status]);

  const handleStopListening = useCallback(() => {
      if (status === 'listening' && recognitionRef.current) {
          recognitionRef.current.stop();
      }
  }, [status]);


  useEffect(() => {
      if (isMuted) {
          audioQueueRef.current.forEach(audio => { audio.pause(); audio.currentTime = 0; });
          if(isPlayingRef.current) {
            const currentAudio = document.querySelector('audio[src*="blob:"]');
            if (currentAudio instanceof HTMLAudioElement) {
              currentAudio.pause();
              currentAudio.currentTime = 0;
            }
          }
          isPlayingRef.current = false;
      } else {
         if(!isPlayingRef.current) playNextInQueue();
      }
  }, [isMuted, playNextInQueue]);


  const getStatusText = () => {
    switch(status) {
        case 'idle': return 'Tap the icon to speak';
        case 'listening': return 'Listening... Tap to stop';
        case 'processing': return 'Thinking...';
        case 'speaking': return 'Speaking...';
    }
  }

  const handleClose = () => {
    if (recognitionRef.current) {
        recognitionRef.current.abort();
    }
    audioQueueRef.current.forEach(audio => audio.pause());
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setStatus('idle');
    setHistory([]);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={handleClose} role="dialog" aria-modal="true">
        <div 
            className={`voice-chat-bg ${status === 'listening' ? 'listening' : ''} w-full max-w-2xl h-[70vh] rounded-4xl shadow-2xl flex flex-col items-center justify-between p-8 transition-all duration-500`}
            onClick={e => e.stopPropagation()}
        >
            <header className="w-full flex justify-between items-center">
                <h2 className="text-xl font-bold text-theme-text">Voice Chat</h2>
                <button onClick={handleClose} className="p-2 text-theme-text-secondary rounded-full hover:bg-black/10"><XIcon className="w-5 h-5"/></button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center text-center">
                <p className="text-lg font-medium text-theme-text-secondary h-8">{getStatusText()}</p>
                {transcript && <p className="mt-2 text-2xl font-semibold text-theme-text">"{transcript}"</p>}
                {error && <p className="mt-4 text-red-500 bg-red-100 p-2 rounded-lg">{error}</p>}
            </div>

            <div className="w-full flex flex-col items-center gap-6">
                <button
                    onClick={status === 'listening' ? handleStopListening : handleStartListening}
                    disabled={status === 'processing' || status === 'speaking'}
                    className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 disabled:opacity-50
                        ${status === 'listening' ? 'bg-red-500 animate-pulse' : 'bg-puter-blue'}`}
                >
                    {status === 'processing' ? <LoadingIcon className="w-10 h-10" /> : <MicrophoneIcon className="w-10 h-10" />}
                </button>

                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMuted(!isMuted)} className="p-4 rounded-full bg-black/5 backdrop-blur-sm text-theme-text-secondary hover:bg-black/10">
                        {isMuted ? <MuteIcon className="w-6 h-6"/> : <MicrophoneIcon className="w-6 h-6"/>}
                    </button>
                    <div className="relative">
                        <select value={model} onChange={e => setModel(e.target.value)} className="appearance-none p-4 rounded-full bg-black/5 backdrop-blur-sm text-theme-text-secondary hover:bg-black/10 font-semibold pr-10">
                            {MODELS.filter(m => m.isSupported && (m.category === 'text' || m.category === 'multimodal' || m.category === 'deep-thought')).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                         <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                            <ChevronDownIcon className="w-5 h-5"/>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-4 rounded-full bg-red-500/10 backdrop-blur-sm text-red-500 hover:bg-red-500/20">
                       <XIcon className="w-6 h-6"/>
                    </button>
                </div>
            </div>
        </div>
    </div>
  )
}