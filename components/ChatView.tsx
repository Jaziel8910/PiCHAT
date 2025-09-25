import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Conversation, Message, PuterModel, Memory } from '../types';
import { UserIcon, SendIcon, LoadingIcon, EditIcon, RegenerateIcon, AttachmentIcon, CopyIcon, CheckIcon, ImageIcon, SettingsIcon, ToolIcon, BranchIcon, XIcon, BrainIcon, PlusIcon, StopIcon, BellIcon, CodeIcon, DownloadIcon, SpeakerIcon, PinIcon, ExpandIcon, CompressIcon, BoldIcon, ItalicIcon, GlobeIcon, CalculatorIcon, ChevronDownIcon, CommentsIcon } from './Icons';
import * as Icons from './Icons';
import { AdvancedModelSelector } from './AdvancedModelSelector';
import { PersonaManager } from './PersonaSelector';
import { PERSONAS, Persona, SUPERTEXTS_PROMPT_APPENDIX } from '../personas';
import { usePuter } from '../hooks/usePuter';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ImageGallery } from './ImageGallery';
import { USER_TOOLS } from '../tools';
import { ThinkingBox } from './ThinkingBox';
import { MODELS, AUTO_ROUTER_SYSTEM_PROMPT } from '../types';
import { ImageGenerator } from './ImageGenerator';
import { DeepThinkingIndicator } from './DeepThinkingIndicator';

declare const puter: any;

interface ChatViewProps {
  conversation: Conversation;
  setConversation: (id: string, updatedData: Partial<Conversation> | ((conv: Conversation) => Partial<Conversation>)) => void;
  onBranch: (conversationId: string, messageId: string) => void;
  customPersonas: Persona[];
  onUpdateCustomPersonas: (personas: Persona[]) => void;
  onOpenVoiceChat: () => void;
  onOpenSettings: () => void;
  memory: Memory;
  onUpdateMemory: (newMemory: Memory) => void;
  onExportConversation: (id: string, format: 'md' | 'html') => void;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ conversation, setConversation, onBranch, customPersonas, onUpdateCustomPersonas, onOpenVoiceChat, onOpenSettings, memory, onUpdateMemory, onExportConversation, isFullScreen, onToggleFullScreen }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { streamChatResponse, getChatResponse, generateImage, img2txt, zipAndDownload, txt2speech } = usePuter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingMessage, setEditingMessage] = useState<{ id: string; content: string } | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isPersonaManagerOpen, setIsPersonaManagerOpen] = useState(false);
  const [isModelManagerOpen, setIsModelManagerOpen] = useState(false);
  const [isImageGeneratorOpen, setIsImageGeneratorOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const modelManagerRef = useRef<HTMLDivElement>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{ file: File, preview_url: string } | null>(null);
  const streamAbortControllerRef = useRef<AbortController | null>(null);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  const selectedModelInfo = useMemo(() => MODELS.find(m => m.id === conversation.model), [conversation.model]);

  const AssistantIconComponent = useMemo(() => {
    const Icon = selectedModelInfo ? Icons[selectedModelInfo.providerIcon] : Icons.AssistantIcon;
    return <Icon className="w-5 h-5" />;
  }, [selectedModelInfo]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [conversation.messages]);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input, pendingAttachment]);

  useEffect(() => {
    if (editingMessage && editTextareaRef.current) {
        editTextareaRef.current.style.height = 'auto';
        editTextareaRef.current.style.height = `${editTextareaRef.current.scrollHeight}px`;
        editTextareaRef.current.focus();
    }
  }, [editingMessage]);

  const handleModelChange = (model: PuterModel) => {
    setConversation(conversation.id, { model });
  };
  
  const handlePersonaChange = (persona: Persona) => {
    setConversation(conversation.id, { 
      persona: persona.id,
      model: persona.starModel,
    });
  };

  const handleStopStreaming = useCallback(() => {
    if (streamAbortControllerRef.current) {
        streamAbortControllerRef.current.abort();
        streamAbortControllerRef.current = null;
    }
    setIsStreaming(false);
    setConversation(conversation.id, currentConv => ({
        messages: currentConv.messages.map(msg => ({ ...msg, isStreaming: false, isCurrentlyThinking: false }))
    }));
  }, [setConversation, conversation.id]);
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if(isStreaming) handleStopStreaming();
      }
      if (event.ctrlKey && event.shiftKey && event.key === 'S') {
        event.preventDefault();
        onOpenSettings();
      }
      if (event.ctrlKey && event.shiftKey && event.key === 'V') {
        event.preventDefault();
        onOpenVoiceChat();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isStreaming, handleStopStreaming, onOpenSettings, onOpenVoiceChat]);


  const handleSaveMemory = useCallback((key: string, value: string) => {
    const newMemory = { ...memory, [key]: value };
    onUpdateMemory(newMemory);
  }, [memory, onUpdateMemory]);
  
 const triggerAIResponse = useCallback(async (history: Message[], isTitleUpdate: boolean = false, newTitle: string = '') => {
    setIsStreaming(true);
    streamAbortControllerRef.current = new AbortController();

    if (isTitleUpdate) {
        setConversation(conversation.id, { title: newTitle });
    }
    
    const allPersonas = [...PERSONAS, ...customPersonas];
    const persona = allPersonas.find(p => p.id === conversation.persona);
    let systemPromptWithMemory = persona?.prompt || '';

    if (memory && Object.keys(memory).length > 0) {
        const memoryBlock = "--- Start of Long-Term Memory ---\n" + Object.entries(memory).map(([key, value]) => `- ${key.replace(/_/g, ' ')}: ${value}`).join('\n') + "\n--- End of Long-Term Memory ---";
        systemPromptWithMemory = `${memoryBlock}\n\n${systemPromptWithMemory}`;
    }

    if (conversation.supertextsEnabled) {
        systemPromptWithMemory += SUPERTEXTS_PROMPT_APPENDIX;
    }

    const startStreaming = async (modelId: string, streamHistory: Message[], placeholderId: string) => {
        let streamBuffer = '';
        try {
            await streamChatResponse({
                model: modelId,
                messages: streamHistory,
                systemPrompt: systemPromptWithMemory,
                temperature: conversation.temperature,
                max_tokens: conversation.maxTokens,
                abortSignal: streamAbortControllerRef.current!.signal,
                onChunk: (chunk) => {
                    streamBuffer += chunk;
                    const memoryCommandRegex = /\[SAVE_MEMORY\s+key="([^"]+)"\s+value="([^"]+)"]/g;
                    let match;
                    let contentWithoutCommands = streamBuffer;
                    while ((match = memoryCommandRegex.exec(contentWithoutCommands)) !== null) {
                        handleSaveMemory(match[1], match[2]);
                    }
                    contentWithoutCommands = contentWithoutCommands.replace(memoryCommandRegex, '').trim();

                    setConversation(conversation.id, currentConv => {
                        const newMessages = [...currentConv.messages];
                        const lastMsg = newMessages.find(m => m.id === placeholderId);
                        if (lastMsg) {
                            lastMsg.content = contentWithoutCommands;
                        }
                        return { ...currentConv, messages: newMessages };
                    });
                },
                onDone: () => {
                    setConversation(conversation.id, currentConv => ({
                        messages: currentConv.messages.map(msg => msg.id === placeholderId ? { ...msg, isStreaming: false, isCurrentlyThinking: false } : msg)
                    }));
                    setIsStreaming(false);
                },
                onError: (error) => {
                    setConversation(conversation.id, currentConv => ({
                        messages: currentConv.messages.map(msg => msg.id === placeholderId ? { ...msg, isStreaming: false, isCurrentlyThinking: false, content: `Sorry, something went wrong: ${error.message}` } : msg)
                    }));
                    setIsStreaming(false);
                }
            });
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                 setConversation(conversation.id, currentConv => ({
                    messages: currentConv.messages.map(msg => msg.id === placeholderId ? { ...msg, isStreaming: false, isCurrentlyThinking: false, content: `Sorry, something went wrong: ${err.message}` } : msg)
                }));
            }
            setIsStreaming(false);
        }
    };

    const aiPlaceholder: Message = { id: `msg-${Date.now() + 1}`, role: 'assistant', content: '', isStreaming: true };
    setConversation(conversation.id, conv => ({
        ...conv,
        messages: [...history, aiPlaceholder],
    }));

    if (conversation.model === 'openrouter/auto') {
        // FIX: Replace `findLast` with a more compatible equivalent.
        const lastUserMessage = history.slice().reverse().find(m => m.role === 'user');
        if (!lastUserMessage) {
            setConversation(conversation.id, c => ({ messages: c.messages.map(m => m.id === aiPlaceholder.id ? {...m, isStreaming: false, content: "Cannot route without a user prompt."} : m)}));
            setIsStreaming(false);
            return;
        }

        try {
            setConversation(conversation.id, c => ({ messages: c.messages.map(m => m.id === aiPlaceholder.id ? {...m, isCurrentlyThinking: true, thinkingContent: 'Selecting the best model for your request...'} : m)}));
            
            const routerResponse = await getChatResponse({
                model: 'meta-llama/Llama-3.2-1B-Instruct',
                messages: [{ role: 'user', content: lastUserMessage.content }],
                systemPrompt: AUTO_ROUTER_SYSTEM_PROMPT,
                temperature: 0,
            });
            const recommendedModelId = routerResponse?.message?.content?.trim();
            const isValidModel = recommendedModelId && MODELS.some(m => m.id === recommendedModelId && m.isSupported !== false);

            if (!isValidModel) {
                 throw new Error(`Router returned an invalid or unsupported model ID: "${recommendedModelId}"`);
            }

            const modelInfo = MODELS.find(m => m.id === recommendedModelId);
            const thinkingUpdate = `Selected Model: **${modelInfo?.name || recommendedModelId}**. Generating response...`;
            setConversation(conversation.id, c => ({ messages: c.messages.map(m => m.id === aiPlaceholder.id ? {...m, thinkingContent: thinkingUpdate} : m)}));

            await startStreaming(recommendedModelId, history, aiPlaceholder.id);
        } catch (err: any) {
            const errorMessage = `Model router failed: ${err.message}. Please select a model manually.`;
            setConversation(conversation.id, c => ({ messages: c.messages.map(m => m.id === aiPlaceholder.id ? {...m, isStreaming: false, isCurrentlyThinking: false, content: errorMessage} : m)}));
            setIsStreaming(false);
        }
    } else {
        await startStreaming(conversation.model, history, aiPlaceholder.id);
    }
  }, [conversation, setConversation, streamChatResponse, getChatResponse, customPersonas, memory, handleSaveMemory]);

  const handleAddImageToChat = (prompt: string, imageUrl: string) => {
    const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', content: prompt };
    const assistantMessage: Message = { id: `msg-${Date.now() + 1}`, role: 'assistant', content: prompt, imageUrl };

    setConversation(conversation.id, conv => ({
        ...conv,
        messages: [...conv.messages, userMessage, assistantMessage],
    }));
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) return;
    const trimmedInput = input.trim();
    if ((!trimmedInput && !pendingAttachment) || isFileProcessing) return;

    setInput('');
    const attachmentToProcess = pendingAttachment;
    setPendingAttachment(null);

    let attachmentsForMessage: Message['attachments'] = [];

    if (attachmentToProcess) {
      setIsFileProcessing(true);
      try {
        const uploadPath = `.puter/pichat/uploads/${Date.now()}-${attachmentToProcess.file.name}`;
        await puter.fs.write(uploadPath, attachmentToProcess.file, { createMissingParents: true });
        attachmentsForMessage = [{
          puter_path: uploadPath,
          preview_url: attachmentToProcess.preview_url,
        }];
      } catch (err) {
        console.error("File upload error:", err);
        setUploadError("Failed to upload image. Please try again.");
        setIsFileProcessing(false);
        setPendingAttachment(attachmentToProcess);
        return;
      } finally {
        setIsFileProcessing(false);
      }
    }

    const userInput: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      ...(attachmentsForMessage.length > 0 && { attachments: attachmentsForMessage }),
    };
    
    const history = [...conversation.messages, userInput];
    
    const isFirstMessage = conversation.messages.length === 0;
    let newTitle = conversation.title;
    if (isFirstMessage) {
        const titleCandidate = trimmedInput || "Image Analysis";
        newTitle = titleCandidate.length > 30 ? titleCandidate.substring(0, 27) + '...' : titleCandidate;
    }
    
    triggerAIResponse(history, isFirstMessage, newTitle);
  }, [input, pendingAttachment, isStreaming, isFileProcessing, conversation, triggerAIResponse]);
  
  const handleSaveEdit = useCallback(async () => {
    if (!editingMessage) return;

    const messageIndex = conversation.messages.findIndex(m => m.id === editingMessage.id);
    if (messageIndex === -1) return;

    const updatedMessage = { ...conversation.messages[messageIndex], content: editingMessage.content };
    const history = [...conversation.messages.slice(0, messageIndex), updatedMessage];

    setEditingMessage(null);
    triggerAIResponse(history);
  }, [editingMessage, conversation.messages, triggerAIResponse]);
  
  const handleRegenerate = useCallback(async () => {
    let lastUserMessageIndex = -1;
    for (let i = conversation.messages.length - 1; i >= 0; i--) {
      if (conversation.messages[i].role === 'user') {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex === -1) return;

    const history = conversation.messages.slice(0, lastUserMessageIndex + 1);
    triggerAIResponse(history);
  }, [conversation.messages, triggerAIResponse]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, forOcr: boolean = false) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const isVisionModel = selectedModelInfo?.category === 'multimodal' || selectedModelInfo?.tags.includes('vision');

    if (file.type.startsWith('image/')) {
        if (isVisionModel && !forOcr) {
            const preview_url = URL.createObjectURL(file);
            setPendingAttachment({ file, preview_url });
        } else {
            setIsFileProcessing(true);
            try {
                const text = await img2txt(file);
                setInput(prev => `Content of the uploaded image:\n\n"""\n${text}\n"""\n\n---\n\n${prev}`);
                textareaRef.current?.focus();
            } catch (err: any) {
                setUploadError(`Failed to extract text: ${err.message}`);
            } finally {
                setIsFileProcessing(false);
            }
        }
    } else if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt')) {
        setIsFileProcessing(true);
        try {
            const text = await file.text();
            setInput(text);
        } catch (err) {
            setUploadError('Failed to read text file.');
        } finally {
            setIsFileProcessing(false);
        }
    } else {
        setUploadError('Unsupported file type. Please upload an image or text file.');
    }
    
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileUpload = (forOcr = false) => {
    if (forOcr) {
      const ocrInput = document.createElement('input');
      ocrInput.type = 'file';
      ocrInput.accept = 'image/*';
      ocrInput.onchange = (e) => handleFileSelect(e as any, true);
      ocrInput.click();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };
  
  const handleEnhancePrompt = useCallback(async () => {
      if (!input.trim()) return;
      setIsToolsOpen(false);
      const originalInput = input;
      setInput("Enhancing your prompt...");
      try {
          const systemPrompt = "You are a prompt engineering expert. Your task is to rewrite the user's prompt to be more detailed, specific, and effective for a large language model. Add context, constraints, and a clear desired output format. Respond only with the improved prompt, without any pleasantries or explanations.";
          const response = await getChatResponse({
              model: 'gpt-4o-mini',
              messages: [{ role: 'user', content: originalInput }],
              systemPrompt,
          });
          const enhancedPrompt = response?.message?.content;
          setInput(enhancedPrompt || originalInput);
      } catch (err) {
          console.error("Prompt enhancement failed:", err);
          setInput(originalInput); // Restore original on error
      }
  }, [input, getChatResponse]);
  
  const handleToolClick = (toolId: string) => {
    setIsToolsOpen(false);
    switch (toolId) {
        case 'generate-image': setIsImageGeneratorOpen(true); break;
        case 'voice-chat': onOpenVoiceChat(); break;
        case 'ocr-image': triggerFileUpload(true); break;
        case 'supertexts-mode': setConversation(conversation.id, { supertextsEnabled: !conversation.supertextsEnabled }); break;
        case 'enhance-prompt': handleEnhancePrompt(); break;
        default: break;
    }
  };

  const handleSetReminder = (messageId: string, text: string) => {
    const minutes = prompt("In how many minutes should I remind you about this message?");
    const parsedMinutes = minutes ? parseFloat(minutes) : NaN;
    if (!isNaN(parsedMinutes) && parsedMinutes > 0) {
        const remindTime = Date.now() + parsedMinutes * 60 * 1000;
        
        setConversation(conversation.id, conv => ({
            ...conv,
            reminders: {
                ...conv.reminders,
                [messageId]: { time: remindTime, text: text.substring(0, 100) },
            }
        }));

        setTimeout(() => {
            puter.ui.showNotification(`Reminder for: "${conversation.title}"`, text.substring(0, 100));
            setConversation(conversation.id, conv => {
                const newReminders = { ...conv.reminders };
                delete newReminders[messageId];
                return { ...conv, reminders: newReminders };
            });
        }, parsedMinutes * 60 * 1000);

        alert(`Reminder set for ${parsedMinutes} minutes from now.`);
    } else if (minutes) { // if user entered something but it wasn't a valid number
        alert("Please enter a valid number of minutes.");
    }
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) setIsSettingsOpen(false);
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) setIsToolsOpen(false);
      if (modelManagerRef.current && !modelManagerRef.current.contains(event.target as Node)) setIsModelManagerOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    let objectUrl: string | null = null;
    if (pendingAttachment) {
      objectUrl = pendingAttachment.preview_url;
    }
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [pendingAttachment]);

  const handlePlayTTS = async (text: string) => {
      if (playingAudio) {
          playingAudio.pause();
          setPlayingAudio(null);
      }
      const audio = await txt2speech(text, { engine: 'neural' });
      if (audio) {
          setPlayingAudio(audio);
          audio.play();
          audio.onended = () => setPlayingAudio(null);
      }
  };

  const handleTogglePin = (messageId: string) => {
      setConversation(conversation.id, conv => ({
          ...conv,
          pinnedMessageId: conv.pinnedMessageId === messageId ? null : messageId
      }));
  };

  const handleFormat = (format: 'bold' | 'italic' | 'code') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = input.substring(start, end);
    let markdown;
    switch (format) {
        case 'bold': markdown = `**${selectedText}**`; break;
        case 'italic': markdown = `*${selectedText}*`; break;
        case 'code': markdown = `\`${selectedText}\``; break;
    }
    const newInput = `${input.substring(0, start)}${markdown}${input.substring(end)}`;
    setInput(newInput);
    setTimeout(() => {
        textarea.focus();
        const newPos = start + markdown.length - (format === 'bold' ? 2 : 1);
        textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };
  
  const pinnedMessage = useMemo(() => conversation.messages.find(m => m.id === conversation.pinnedMessageId), [conversation.messages, conversation.pinnedMessageId]);
  const regularMessages = useMemo(() => conversation.messages.filter(m => m.id !== conversation.pinnedMessageId), [conversation.messages, conversation.pinnedMessageId]);

  return (
    <div className="flex flex-col h-full">
      <ImageGenerator 
        isOpen={isImageGeneratorOpen}
        onClose={() => setIsImageGeneratorOpen(false)}
        onAddToChat={handleAddImageToChat}
      />
      {isGalleryOpen && <ImageGallery conversation={conversation} onClose={() => setIsGalleryOpen(false)} />}
      {isPersonaManagerOpen && 
        <PersonaManager 
            isOpen={isPersonaManagerOpen}
            onClose={() => setIsPersonaManagerOpen(false)}
            onPersonaSelect={handlePersonaChange}
            selectedPersonaId={conversation.persona}
            customPersonas={customPersonas}
            onUpdateCustomPersonas={onUpdateCustomPersonas}
            disabled={isStreaming}
        />
      }
      <header className="flex items-center justify-between p-4 border-b border-theme-border bg-theme-surface backdrop-blur-xl z-10 gap-2 flex-wrap rounded-t-4xl">
        <h2 className="text-lg font-semibold text-theme-text truncate flex-shrink-0">{conversation.title}</h2>
        <div className="flex-1 min-w-0 px-4" />
        <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onExportConversation(conversation.id, 'md')}
              className="p-2 text-theme-text-secondary rounded-2xl hover:bg-black/5 hover:text-theme-text transition-colors"
              aria-label="Export conversation"
              title="Export conversation"
            >
              <DownloadIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={() => onToggleFullScreen()}
              className="p-2 text-theme-text-secondary rounded-2xl hover:bg-black/5 hover:text-theme-text transition-colors"
              aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
                {isFullScreen ? <CompressIcon className="w-5 h-5" /> : <ExpandIcon className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => setIsGalleryOpen(true)}
              className="p-2 text-theme-text-secondary rounded-2xl hover:bg-black/5 hover:text-theme-text transition-colors"
              aria-label="Open image gallery"
              title="Open image gallery"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
             <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => setIsSettingsOpen(prev => !prev)}
                  className="p-2 text-theme-text-secondary rounded-2xl hover:bg-black/5 hover:text-theme-text transition-colors"
                  aria-label="Open model settings"
                  title="Open model settings"
                >
                  <SettingsIcon className="w-5 h-5" />
                </button>
                {isSettingsOpen && (
                    <div className="absolute z-20 top-full right-0 mt-2 w-72 bg-theme-surface backdrop-blur-xl border border-theme-border rounded-3xl shadow-2xl p-4 space-y-4 transition-all origin-top-right animate-[blur-in_0.2s_ease-out]">
                       <div>
                           <label className="block text-sm font-medium text-theme-text">Creativity (temperature)</label>
                           <p className="text-xs text-theme-text-secondary mb-2">Higher values are more random. {Number(conversation.temperature || 0) > 1.5 && "Things might get... questionable."}</p>
                           <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0" max="2" step="0.1"
                                value={conversation.temperature || 0.8}
                                onChange={(e) => setConversation(conversation.id, { temperature: parseFloat(e.target.value) })}
                                className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm font-mono text-theme-text w-10 text-center">{Number(conversation.temperature || 0).toFixed(1)}</span>
                           </div>
                       </div>
                        <div>
                           <label htmlFor="max-tokens" className="block text-sm font-medium text-theme-text">Max Response Length (tokens)</label>
                           <input
                                id="max-tokens"
                                type="number"
                                value={conversation.maxTokens || 4096}
                                onChange={(e) => setConversation(conversation.id, { maxTokens: parseInt(e.target.value, 10) })}
                                className="w-full mt-1 bg-black/5 text-theme-text rounded-2xl p-2 text-sm focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent"
                            />
                        </div>
                    </div>
                )}
            </div>
             <button 
              onClick={() => setIsPersonaManagerOpen(true)}
              className="p-2 text-theme-text-secondary rounded-2xl hover:bg-black/5 hover:text-theme-text transition-colors"
              aria-label="Select persona"
              title="Select persona"
            >
              <BrainIcon className="w-5 h-5" />
            </button>
            <div className="relative" ref={modelManagerRef}>
              <button 
                onClick={() => setIsModelManagerOpen(p => !p)}
                className="p-2 text-theme-text-secondary rounded-2xl hover:bg-black/5 hover:text-theme-text transition-colors"
                aria-label="Select model"
                title="Select model"
              >
                <CommentsIcon className="w-5 h-5" />
              </button>
              <AdvancedModelSelector
                    isOpen={isModelManagerOpen}
                    onClose={() => setIsModelManagerOpen(false)}
                    selectedModel={conversation.model}
                    onModelChange={(modelId) => {
                        handleModelChange(modelId);
                        setIsModelManagerOpen(false);
                    }}
                />
            </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pinnedMessage && (
               <div className="sticky top-0 z-10 p-2 bg-yellow-500/10 border-l-4 border-yellow-500 rounded-lg animate-blur-in">
                    <div className="flex items-start gap-3">
                        <PinIcon className="w-4 h-4 text-yellow-600 mt-1 flex-shrink-0"/>
                        <div className="flex-1">
                            <p className="text-xs font-bold text-yellow-700">Pinned Message</p>
                             <div className={`prose prose-sm max-w-none text-theme-text-secondary`}>
                                <MarkdownRenderer content={pinnedMessage.content} supertextsEnabled={conversation.supertextsEnabled} />
                            </div>
                        </div>
                        <button onClick={() => handleTogglePin(pinnedMessage.id)} className="p-1 text-yellow-600 hover:text-yellow-800"><XIcon className="w-4 h-4"/></button>
                    </div>
                </div>
          )}
          {regularMessages.map((message, index) => {
              const isUser = message.role === 'user';
              const isLastMessage = index === regularMessages.length - 1;
              const hasReminders = conversation.reminders && conversation.reminders[message.id];
              const isDeepThought = selectedModelInfo?.category === 'deep-thought';

              return (
                  <div key={message.id} className={`flex items-start gap-4 message-appear ${isUser ? 'justify-end' : ''}`}>
                       {!isUser && (
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 flex-shrink-0">
                            {AssistantIconComponent}
                          </div>
                      )}
                      <div className={`max-w-2xl group ${isUser ? 'order-1' : 'order-2'}`}>
                        {message.isCurrentlyThinking && <ThinkingBox content={message.thinkingContent || ''} />}
                        {(isLastMessage && message.isStreaming && !message.content && isDeepThought) && <DeepThinkingIndicator />}
                        
                        {(message.content || message.attachments || message.imageUrl) && (
                            <div className={`relative ${isUser ? 'px-5 py-3 bg-puter-blue text-white rounded-3xl rounded-br-lg' : 'px-5 py-3 bg-black/5 text-theme-text rounded-3xl rounded-bl-lg'}`}>
                                {editingMessage?.id === message.id ? (
                                    <div className="space-y-2">
                                        <textarea
                                            ref={editTextareaRef}
                                            value={editingMessage.content}
                                            onChange={(e) => setEditingMessage({ ...editingMessage, content: e.target.value })}
                                            className="w-full bg-white/20 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-white/50 resize-none text-sm"
                                            rows={3}
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={() => setEditingMessage(null)} className="px-3 py-1 text-xs font-semibold rounded-lg hover:bg-white/10">Cancel</button>
                                            <button onClick={handleSaveEdit} className="px-3 py-1 text-xs font-semibold rounded-lg bg-white/90 text-puter-blue hover:bg-white">Save & Submit</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {message.imageUrl && (
                                            <div className="mb-2 rounded-2xl overflow-hidden aspect-video">
                                                <img src={message.imageUrl} alt={message.content} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        {message.attachments?.map((att, i) => (
                                            <div key={i} className={`${message.content ? 'mt-2' : ''} rounded-2xl overflow-hidden aspect-video w-full max-w-xs`}>
                                                <img src={att.preview_url} alt="attachment" className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                        {message.content && (
                                            <div className={`prose prose-sm max-w-none ${isUser ? 'text-white prose-invert' : 'text-current'}`}>
                                                <MarkdownRenderer content={message.content} isStreaming={message.isStreaming && isLastMessage} supertextsEnabled={conversation.supertextsEnabled} />
                                            </div>
                                        )}
                                    </>
                                )}
                                {hasReminders && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-blue-200">
                                        <BellIcon className="w-3 h-3"/>
                                        <span>Reminder set</span>
                                    </div>
                                )}
                            </div>
                        )}

                         <div className="flex items-center gap-2 mt-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleCopy(message.content, message.id)} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                {copiedMessageId === message.id ? <CheckIcon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                              </button>
                             {isUser && (
                                 <button onClick={() => setEditingMessage({ id: message.id, content: message.content })} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                     <EditIcon className="w-3 h-3" />
                                 </button>
                             )}
                              {!isUser && !isStreaming && (
                                 <button onClick={handleRegenerate} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                     <RegenerateIcon className="w-3 h-3" />
                                 </button>
                             )}
                             <button onClick={() => onBranch(conversation.id, message.id)} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                 <BranchIcon className="w-3 h-3" />
                             </button>
                              <button onClick={() => handleTogglePin(message.id)} className={`p-1.5 rounded-full hover:bg-black/5 ${conversation.pinnedMessageId === message.id ? 'text-yellow-500' : 'text-theme-text-secondary hover:text-theme-text'}`}>
                                  <PinIcon className="w-3 h-3" />
                              </button>
                              {!isUser && (
                                <>
                                <button onClick={() => handleSetReminder(message.id, message.content)} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                  <BellIcon className="w-3 h-3" />
                                </button>
                                <button onClick={() => handlePlayTTS(message.content)} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                  <SpeakerIcon className="w-3 h-3" />
                                </button>
                                </>
                             )}
                         </div>
                      </div>
                      {isUser && (
                           <div className="w-8 h-8 flex items-center justify-center rounded-full bg-puter-blue flex-shrink-0 order-2">
                              <UserIcon className="w-4 h-4 text-white" />
                          </div>
                      )}
                  </div>
              )
          })}
          <div ref={messagesEndRef} />
      </div>
       <form onSubmit={handleSubmit} className="p-4 border-t border-theme-border">
          {uploadError && <div className="text-xs text-red-500 mb-2">{uploadError}</div>}
          {pendingAttachment && (
              <div className="flex items-center gap-2 mb-2 p-2 bg-black/5 rounded-2xl">
                  <img src={pendingAttachment.preview_url} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
                  <span className="text-sm text-theme-text-secondary truncate">{pendingAttachment.file.name}</span>
                  <button onClick={() => setPendingAttachment(null)} className="ml-auto p-1.5 text-theme-text-secondary hover:text-theme-text hover:bg-black/10 rounded-full">
                      <XIcon className="w-4 h-4" />
                  </button>
              </div>
          )}
          <div className="bg-black/5 rounded-2xl p-1 flex items-end gap-2 chat-input-glow">
            <div className="relative" ref={toolsRef}>
                <button 
                    type="button" 
                    onClick={() => setIsToolsOpen(p => !p)} 
                    disabled={isStreaming}
                    aria-label="Open tools menu"
                    className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 text-theme-text-secondary hover:bg-black/10 ${isToolsOpen ? 'bg-black/20 rotate-45' : ''}`}
                >
                    <PlusIcon className="w-5 h-5"/>
                </button>
                {isToolsOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-60 bg-theme-surface backdrop-blur-xl border border-theme-border rounded-3xl shadow-2xl p-2 transition-all origin-bottom-left animate-[blur-in_0.2s_ease-out]">
                        <button type="button" onClick={() => triggerFileUpload()} disabled={isFileProcessing || isStreaming} className="w-full flex items-center gap-3 text-left p-2 rounded-xl hover:bg-black/5 text-sm font-medium text-theme-text disabled:opacity-50">
                           <AttachmentIcon className="w-4 h-4 text-theme-text-secondary" />
                           <span>Attach Image or File</span>
                        </button>
                        {USER_TOOLS.map(tool => {
                            const isToggleOn = (tool.id === 'supertexts-mode' && conversation.supertextsEnabled);
                            return (
                                <button key={tool.id} onClick={() => handleToolClick(tool.id)} className={`w-full flex items-center gap-3 text-left p-2 rounded-xl hover:bg-black/5 text-sm font-medium disabled:opacity-50 ${isToggleOn ? 'text-puter-blue' : 'text-theme-text'}`}>
                                    <tool.icon className="w-4 h-4 text-theme-text-secondary" />
                                    <span>{tool.name}</span>
                                    {tool.id === 'supertexts-mode' && <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isToggleOn ? 'bg-puter-blue text-white' : 'bg-black/10 text-theme-text-secondary'}`}>{isToggleOn ? 'ON' : 'OFF'}</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
             <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 pl-2 border-b border-black/10 mb-1">
                    <button type="button" onClick={() => handleFormat('bold')} className="p-1.5 text-theme-text-secondary hover:bg-black/10 rounded"><BoldIcon className="w-4 h-4" /></button>
                    <button type="button" onClick={() => handleFormat('italic')} className="p-1.5 text-theme-text-secondary hover:bg-black/10 rounded"><ItalicIcon className="w-4 h-4" /></button>
                    <button type="button" onClick={() => handleFormat('code')} className="p-1.5 text-theme-text-secondary hover:bg-black/10 rounded"><CodeIcon className="w-4 h-4" /></button>
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
                  placeholder={"Type your message here..."}
                  className="w-full bg-transparent p-2 resize-none max-h-48 focus:outline-none border-transparent text-sm placeholder-theme-text-secondary"
                  rows={1}
                  disabled={isFileProcessing || isStreaming}
                />
                 <span className="text-xs text-right text-theme-text-secondary pr-2 pb-1">{input.length} / 16000</span>
             </div>
             <button
              type={isStreaming ? "button" : "submit"}
              onClick={isStreaming ? handleStopStreaming : undefined}
              disabled={(!input.trim() && !pendingAttachment) || isFileProcessing}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-puter-blue text-white rounded-full transition-all duration-200 shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              aria-label={isStreaming ? "Stop generating" : "Send message"}
            >
              {isStreaming ? <StopIcon className="w-5 h-5"/> : <SendIcon className="w-5 h-5"/>}
            </button>
             <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,text/plain,.md" />
          </div>
        </form>
    </div>
  );
};