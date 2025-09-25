import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { Conversation, Message, PuterModel, Memory } from '../types';
import { usePuter } from '../hooks/usePuter';
import { PERSONAS, Persona } from '../personas';
import { MODELS } from '../types';
import * as Icons from './Icons';
import { AdvancedModelSelector } from './AdvancedModelSelector';

declare const puter: any;

interface MainPageProps {
  activeConversation: Conversation | null;
  setConversation: (id: string, updatedData: Partial<Conversation> | ((conv: Conversation) => Partial<Conversation>)) => void;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  customPersonas: Persona[];
  memory: Memory;
  onUpdateMemory: (newMemory: Memory) => void;
  onOpenSettings: () => void;
  onOpenVoiceChat: () => void;
  user: { username: string; avatar: string; } | null;
}

const GREETING_PHRASES = [
    "crear una obra de arte?",
    "escribir el próximo bestseller?",
    "resolver los misterios del universo?",
    "planificar tu próxima aventura?",
    "lanzar una startup exitosa?",
    "depurar ese código imposible?",
    "descubrir una nueva receta?",
    "escribir un poema?",
    "dominar un nuevo tema?",
    "crear la presentación perfecta?",
];

const QUICK_PROMPTS = [
    { title: "Explain in simple terms", prompt: "Explain quantum computing in simple terms", icon: Icons.BrainIcon },
    { title: "Write a short story", prompt: "Write a short story about a cat who is a detective", icon: Icons.QuillIcon },
    { title: "Pros and Cons", prompt: "What are the pros and cons of learning React vs. Svelte?", icon: Icons.CommentsIcon },
    { title: "Create a plan", prompt: "Create a 3-day workout plan for a beginner", icon: Icons.DumbbellIcon },
];

const AssistantIcon: React.FC<{ modelId: string; className?: string }> = ({ modelId, className }) => {
    const modelInfo = useMemo(() => MODELS.find(m => m.id === modelId), [modelId]);
    const Icon = modelInfo ? Icons[modelInfo.providerIcon] : Icons.AssistantIcon;
    return <Icon className={className} />;
};

export const MainPage: React.FC<MainPageProps> = ({ activeConversation, setConversation, conversations, onSelectConversation, customPersonas, memory, onUpdateMemory, onOpenSettings, onOpenVoiceChat, user }) => {
    const [input, setInput] = useState('');
    const [userName, setUserName] = useState('User');
    const [greetingPhrase, setGreetingPhrase] = useState('');
    const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
    const modelManagerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { streamChatResponse } = usePuter();
    const streamAbortControllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (user && user.username) {
            setUserName(user.username.split(' ')[0]);
        }
        setGreetingPhrase(GREETING_PHRASES[Math.floor(Math.random() * GREETING_PHRASES.length)]);
    }, [user]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const handleSaveMemory = useCallback((key: string, value: string) => {
        const newMemory = { ...memory, [key]: value };
        onUpdateMemory(newMemory);
    }, [memory, onUpdateMemory]);

    const handleSubmit = useCallback(async () => {
        if (!activeConversation || !input.trim()) return;

        const userInput: Message = { id: `msg-${Date.now()}`, role: 'user', content: input.trim() };
        const newTitle = input.trim().length > 30 ? input.trim().substring(0, 27) + '...' : input.trim();
        const history = [userInput];

        setInput('');

        const abortController = new AbortController();
        streamAbortControllerRef.current = abortController;

        const aiPlaceholder: Message = { id: `msg-${Date.now() + 1}`, role: 'assistant', content: '', isStreaming: true };
        
        setConversation(activeConversation.id, conv => ({
            ...conv,
            title: newTitle,
            messages: [...history, aiPlaceholder],
        }));
        
        // The App component will now switch to ChatView due to message length > 0
        // The streaming logic will be handled there, so we just need to initiate it.

        try {
            const allPersonas = [...PERSONAS, ...customPersonas];
            const persona = allPersonas.find(p => p.id === activeConversation.persona);
            let systemPromptWithMemory = persona?.prompt || '';
            if (memory && Object.keys(memory).length > 0) {
                 const memoryBlock = "--- Start of Long-Term Memory ---\n" + Object.entries(memory).map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`).join('\n') + "\n--- End of Long-Term Memory ---";
                 systemPromptWithMemory = `${memoryBlock}\n\n${systemPromptWithMemory}`;
            }

            let streamBuffer = '';
            await streamChatResponse({
                model: activeConversation.model,
                messages: history,
                systemPrompt: systemPromptWithMemory,
                temperature: activeConversation.temperature,
                max_tokens: activeConversation.maxTokens,
                abortSignal: abortController.signal,
                onChunk: (chunk) => {
                    streamBuffer += chunk;
                    const memoryCommandRegex = /\[SAVE_MEMORY\s+key="([^"]+)"\s+value="([^"]+)"]/g;
                    let match;
                    while ((match = memoryCommandRegex.exec(streamBuffer)) !== null) {
                        handleSaveMemory(match[1], match[2]);
                        streamBuffer = streamBuffer.replace(match[0], '').trim();
                        memoryCommandRegex.lastIndex = 0;
                    }

                    setConversation(activeConversation.id, currentConv => {
                        const messages = [...currentConv.messages];
                        if (messages.length > 0) {
                            const lastMsg = messages[messages.length - 1];
                            lastMsg.content = streamBuffer; // Simplified update for the initial stream
                        }
                        return { ...currentConv, messages };
                    });
                },
                onDone: () => {
                    setConversation(activeConversation.id, currentConv => ({
                        messages: currentConv.messages.map(msg => ({ ...msg, isStreaming: false }))
                    }));
                },
                onError: (error) => {
                    setConversation(activeConversation.id, currentConv => ({
                        messages: [...currentConv.messages.slice(0, -1), {id: 'err', role: 'assistant', content: `Error: ${error.message}`}]
                    }));
                }
            });
        } catch (err) {
            console.error(err);
        }
    }, [activeConversation, input, setConversation, streamChatResponse, customPersonas, memory, handleSaveMemory]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
          if (modelManagerRef.current && !modelManagerRef.current.contains(event.target as Node)) {
            setIsModelManagerOpen(false);
          }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

    const handleModelChange = (modelId: PuterModel) => {
        if(activeConversation) {
            setConversation(activeConversation.id, { model: modelId });
        }
        setIsModelManagerOpen(false);
    }

    return (
        <>
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-theme-text overflow-hidden">
                <div className="flex-1 flex flex-col justify-center items-center w-full max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 animate-blur-in">
                        Hola {userName},<br/>¿listo para {greetingPhrase}
                    </h1>

                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-8 w-full">
                        {QUICK_PROMPTS.map(p => (
                            <button key={p.title} onClick={() => { setInput(p.prompt); textareaRef.current?.focus(); }} className="p-3 bg-black/5 rounded-2xl text-left hover:bg-black/10 transition-colors">
                                <p.icon className="w-5 h-5 text-theme-text-secondary mb-2" />
                                <p className="font-semibold text-sm text-theme-text">{p.title}</p>
                            </button>
                        ))}
                    </div>

                    <div className="w-full relative">
                        <div className="absolute left-3 top-3 flex items-center gap-1">
                            <button className="p-2 rounded-full hover:bg-black/10 text-theme-text-secondary"><Icons.PlusIcon className="w-5 h-5"/></button>
                            <div className="relative" ref={modelManagerRef}>
                                <button onClick={() => setIsModelManagerOpen(p => !p)} className="flex items-center gap-2 p-2 rounded-full hover:bg-black/10 text-theme-text-secondary">
                                    <Icons.CommentsIcon className="w-5 h-5"/>
                                </button>
                                <AdvancedModelSelector
                                    isOpen={isModelManagerOpen}
                                    onClose={() => setIsModelManagerOpen(false)}
                                    selectedModel={activeConversation?.model || 'gpt-4o'}
                                    onModelChange={handleModelChange}
                                    position="top"
                                />
                            </div>
                        </div>
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder="Ask me anything..."
                            className="w-full bg-black/5 rounded-2xl p-4 pl-28 pr-16 resize-none max-h-48 focus:outline-none focus:ring-2 focus:ring-puter-blue border-transparent text-base placeholder-theme-text-secondary"
                            rows={1}
                            disabled={!activeConversation}
                        />
                        <button
                            onClick={() => handleSubmit()}
                            disabled={!input.trim() || !activeConversation}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex-shrink-0 flex items-center justify-center bg-puter-blue text-white rounded-full transition-all duration-200 shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:bg-gray-400 disabled:shadow-none"
                        >
                            <Icons.SendIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="text-center text-xs text-theme-text-secondary mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1">
                        <span><kbd className="font-sans bg-black/10 px-1.5 py-0.5 rounded">Enter</kbd> to send</span>
                        <span><kbd className="font-sans bg-black/10 px-1.5 py-0.5 rounded">Esc</kbd> to stop</span>
                        <span><kbd className="font-sans bg-black/10 px-1.5 py-0.5 rounded">Ctrl+Shift+S</kbd> for settings</span>
                        <span><kbd className="font-sans bg-black/10 px-1.5 py-0.5 rounded">Ctrl+Shift+V</kbd> for voice</span>
                    </div>
                </div>
                
                {conversations.length > 0 && (
                    <div className="w-full max-w-3xl mt-auto pb-4">
                        <h3 className="text-sm font-semibold text-theme-text-secondary mb-3">Continue a conversation</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {conversations.map(conv => (
                                <button key={conv.id} onClick={() => onSelectConversation(conv.id)} className="p-3 bg-black/5 rounded-2xl text-left hover:bg-black/10 transition-colors">
                                    <p className="font-semibold text-sm text-theme-text truncate">{conv.title}</p>
                                    <p className="text-xs text-theme-text-secondary truncate mt-1">
                                        {conv.messages[conv.messages.length - 1]?.content || '...'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
