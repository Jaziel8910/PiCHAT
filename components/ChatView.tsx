import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Conversation, Message, PuterModel } from '../types';
import { UserIcon, SendIcon, LoadingIcon, EditIcon, RegenerateIcon, AttachmentIcon, CopyIcon, CheckIcon, ImageIcon, SettingsIcon, ToolIcon, BranchIcon, XIcon, BrainIcon, PlusIcon, StopIcon, BellIcon, CodeIcon } from './Icons';
import * as Icons from './Icons';
import { AdvancedModelSelector } from './AdvancedModelSelector';
import { PersonaManager } from './PersonaSelector';
import { PERSONAS, Persona } from '../personas';
import { usePuter } from '../hooks/usePuter';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ImageGallery } from './ImageGallery';
import { USER_TOOLS } from '../tools';
import { ThinkingBox } from './ThinkingBox';
import { MODELS } from '../types';
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
}

export const ChatView: React.FC<ChatViewProps> = ({ conversation, setConversation, onBranch, customPersonas, onUpdateCustomPersonas, onOpenVoiceChat }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isFileProcessing, setIsFileProcessing] = useState(false);
  const [isCoding, setIsCoding] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { streamChatResponse, getChatResponse, generateImage, img2txt, zipAndDownload } = usePuter();
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
  const [isCodingMode, setIsCodingMode] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const [pendingAttachment, setPendingAttachment] = useState<{ file: File, preview_url: string } | null>(null);
  const streamAbortControllerRef = useRef<AbortController | null>(null);

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

  const handleStopStreaming = () => {
    if (streamAbortControllerRef.current) {
        streamAbortControllerRef.current.abort();
        streamAbortControllerRef.current = null;
    }
    setIsStreaming(false);
    setIsCoding(false);
    setConversation(conversation.id, currentConv => ({
        messages: currentConv.messages.map(msg => ({ ...msg, isStreaming: false, isCurrentlyThinking: false }))
    }));
  };
  
  const triggerAIResponse = useCallback(async (history: Message[], isTitleUpdate: boolean = false, newTitle: string = '') => {
    if (isStreaming) return;
    
    handleStopStreaming(); // Ensure any previous controller is aborted
    const abortController = new AbortController();
    streamAbortControllerRef.current = abortController;

    setIsStreaming(true);

    const aiPlaceholder: Message = { id: `msg-${Date.now() + 1}`, role: 'assistant', content: '', isStreaming: true, thinkingContent: '' };
    
    setConversation(conversation.id, conv => ({
        ...conv,
        messages: [...history, aiPlaceholder],
        ...(isTitleUpdate && { title: newTitle }),
    }));

    let isCurrentlyThinking = false;
    let streamBuffer = '';

    try {
        const allPersonas = [...PERSONAS, ...customPersonas];
        const persona = allPersonas.find(p => p.id === conversation.persona);
        const isEffectivelyFirstMessage = history.filter(m => m.role === 'user').length === 1;
        
        await streamChatResponse({
            model: conversation.model,
            messages: history,
            systemPrompt: isEffectivelyFirstMessage ? persona?.prompt : undefined,
            temperature: conversation.temperature,
            max_tokens: conversation.maxTokens,
            abortSignal: abortController.signal,
            onChunk: (chunk) => {
              streamBuffer += chunk;

              setConversation(conversation.id, (currentConv) => {
                const messages = [...currentConv.messages];
                const lastMsg = { ...messages[messages.length - 1] };

                while (streamBuffer.length > 0) {
                    if (!isCurrentlyThinking) {
                        const thinkStart = streamBuffer.indexOf('<think>');
                        if (thinkStart !== -1) {
                            const textBefore = streamBuffer.substring(0, thinkStart);
                            lastMsg.content = (lastMsg.content || '') + textBefore;
                            isCurrentlyThinking = true;
                            streamBuffer = streamBuffer.substring(thinkStart + '<think>'.length);
                        } else {
                            lastMsg.content = (lastMsg.content || '') + streamBuffer;
                            streamBuffer = '';
                            break;
                        }
                    }

                    if (isCurrentlyThinking) {
                        const thinkEnd = streamBuffer.indexOf('</think>');
                        if (thinkEnd !== -1) {
                            const thinkingText = streamBuffer.substring(0, thinkEnd);
                            lastMsg.thinkingContent = (lastMsg.thinkingContent || '') + thinkingText;
                            isCurrentlyThinking = false;
                            streamBuffer = streamBuffer.substring(thinkEnd + '</think>'.length);
                        } else {
                            lastMsg.thinkingContent = (lastMsg.thinkingContent || '') + streamBuffer;
                            streamBuffer = '';
                            break;
                        }
                    }
                }
                
                lastMsg.isCurrentlyThinking = isCurrentlyThinking;
                messages[messages.length - 1] = lastMsg;
                return { ...currentConv, messages };
              });
            },
            onError: (error) => {
              console.error('Streaming error:', error);
              let friendlyMessage = "Sorry, I encountered an error. Please try again.";
              let errorMessage = error.message || '';

              try {
                  const errorJson = JSON.parse(errorMessage);
                  if (errorJson?.error?.message) errorMessage = errorJson.error.message;
              } catch (e) { /* Not a JSON string */ }
              
              if (errorMessage.toLowerCase().includes("disallowed model") || errorMessage.toLowerCase().includes("does not exist")) {
                  friendlyMessage = "Sorry, the selected model seems to be unavailable or invalid. Please choose a different model.";
              } else if (errorMessage.length < 150) {
                  friendlyMessage = `An error occurred: ${errorMessage}`;
              }

              setConversation(conversation.id, (currentConv) => ({
                  messages: currentConv.messages.map((msg, index) => {
                    if (index === currentConv.messages.length - 1) {
                      return { ...msg, content: friendlyMessage, isStreaming: false };
                    }
                    return msg;
                  })
              }));
            },
        });
    } catch(err) {
        if (err.name !== 'AbortError') {
            console.error("Failed to stream response:", err);
        }
    } finally {
        if (streamAbortControllerRef.current === abortController) {
             setIsStreaming(false);
             streamAbortControllerRef.current = null;
        }
        setConversation(conversation.id, currentConv => ({
            messages: currentConv.messages.map(msg => ({ ...msg, isStreaming: false, isCurrentlyThinking: false }))
        }));
    }
  }, [conversation, setConversation, streamChatResponse, customPersonas]);

  const handleAddImageToChat = (prompt: string, imageUrl: string) => {
    const userMessage: Message = { id: `msg-${Date.now()}`, role: 'user', content: prompt };
    const assistantMessage: Message = { id: `msg-${Date.now() + 1}`, role: 'assistant', content: prompt, imageUrl };

    setConversation(conversation.id, conv => ({
        ...conv,
        messages: [...conv.messages, userMessage, assistantMessage],
    }));
  };

   const handleCodingRequest = useCallback(async (userInput: Message) => {
    setIsCoding(true);
    const history = [...conversation.messages, userInput];
    const aiPlaceholder: Message = { id: `msg-${Date.now() + 1}`, role: 'assistant', content: 'Starting coding session... Outlining file structure.' };
     setConversation(conversation.id, conv => ({
        ...conv,
        messages: [...history, aiPlaceholder],
    }));
    try {
        const systemPrompt = `You are an expert web developer. Your task is to create a complete web application based on the user's prompt. First, you must outline the complete folder and file structure in a markdown list. Then, for each file, you must provide its full content inside a fenced code block, starting with a comment: '// FILE: path/to/your/file.js'. Ensure all necessary files (HTML, CSS, JS) are included. After providing all file contents, you must provide a final message '// ZIP_READY'. Be extremely thorough and generate a complete, working project.`;
        
        const responseText = await getChatResponse({
            model: 'gpt-4o', // Hardcode a powerful model for this task
            messages: history,
            systemPrompt,
            max_tokens: 8192, // Add a higher token limit for code generation
        });

        if (!responseText) throw new Error("No response from model.");

        setConversation(conversation.id, conv => {
            const newMessages = [...conv.messages];
            newMessages[newMessages.length - 1] = { ...newMessages[newMessages.length - 1], content: responseText };
            return { ...conv, messages: newMessages };
        });

        const files: { [path: string]: string } = {};
        const parts = responseText.split('// FILE:');
        
        parts.slice(1).forEach(part => {
            const firstLineEnd = part.indexOf('\n');
            const path = part.substring(0, firstLineEnd).trim();
            const codeBlockStart = part.indexOf('```');
            const codeBlockEnd = part.lastIndexOf('```');
            if (codeBlockStart !== -1 && codeBlockEnd > codeBlockStart) {
                let code = part.substring(codeBlockStart, codeBlockEnd);
                // remove ```lang and ```
                code = code.substring(code.indexOf('\n') + 1);
                files[path] = code;
            }
        });

        if (Object.keys(files).length > 0 && responseText.includes('// ZIP_READY')) {
            const projectName = `project-${Date.now()}`;
            await zipAndDownload(files, `${projectName}.zip`);
        } else {
             throw new Error("Could not parse files from response or ZIP_READY marker not found.");
        }

    } catch (err: any) {
        console.error("Coding request failed:", err);
        setConversation(conversation.id, conv => {
            const newMessages = [...conv.messages];
            const lastMsg = newMessages[newMessages.length - 1];
            lastMsg.content = `Sorry, the coding request failed: ${err.message}`;
            return { ...conv, messages: newMessages };
        });
    } finally {
        setIsCoding(false);
    }

  }, [conversation.messages, getChatResponse, setConversation, zipAndDownload]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming || isCoding) return;
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
    if (isFirstMessage && !isCodingMode) {
        const titleCandidate = trimmedInput || "Image Analysis";
        newTitle = titleCandidate.length > 30 ? titleCandidate.substring(0, 27) + '...' : titleCandidate;
    }

    if (isCodingMode) {
        handleCodingRequest(userInput);
    } else {
        triggerAIResponse(history, isFirstMessage, newTitle);
    }
  }, [input, pendingAttachment, isStreaming, isFileProcessing, conversation, triggerAIResponse, isCodingMode, handleCodingRequest, isCoding]);
  
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
  
  const handleToolClick = (toolId: string) => {
    setIsToolsOpen(false);
    switch (toolId) {
        case 'generate-image':
            setIsImageGeneratorOpen(true);
            break;
        case 'voice-chat':
            onOpenVoiceChat();
            break;
        case 'ocr-image':
            triggerFileUpload(true);
            break;
        case 'coding-mode':
            setIsCodingMode(prev => !prev);
            break;
        default:
            break;
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
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
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
            disabled={isStreaming || isCoding}
        />
      }
       <AdvancedModelSelector
            isOpen={isModelManagerOpen}
            onClose={() => setIsModelManagerOpen(false)}
            selectedModel={conversation.model}
            onModelChange={(modelId) => {
                handleModelChange(modelId);
                setIsModelManagerOpen(false);
            }}
        />
      <header className="flex items-center justify-between p-4 border-b border-theme-border bg-theme-surface/80 backdrop-blur-xl z-10 gap-2 flex-wrap rounded-t-4xl">
        <h2 className="text-lg font-semibold text-theme-text truncate flex-shrink-0">{conversation.title}</h2>
        <div className="flex-1 min-w-0 px-4" />
        <div className="flex items-center gap-1 flex-shrink-0">
            <button 
              onClick={() => setIsGalleryOpen(true)}
              className="p-2 text-theme-text-secondary rounded-2xl hover:bg-black/5 hover:text-theme-text transition-colors"
              aria-label="Open image gallery"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
             <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => setIsSettingsOpen(prev => !prev)}
                  className="p-2 text-theme-text-secondary rounded-2xl hover:bg-black/5 hover:text-theme-text transition-colors"
                  aria-label="Open model settings"
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
            >
              <BrainIcon className="w-5 h-5" />
            </button>
             <button 
              onClick={() => setIsModelManagerOpen(true)}
              className="p-2 text-theme-text-secondary rounded-2xl hover:bg-black/5 hover:text-theme-text transition-colors"
              aria-label="Select model"
            >
              {AssistantIconComponent}
            </button>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isLastMessage = index === conversation.messages.length - 1;
              const hasReminders = conversation.reminders && conversation.reminders[message.id];
              const isDeepThought = selectedModelInfo?.category === 'deep-thought';

              return (
                  <div key={message.id} className={`flex items-start gap-4 message-appear ${isUser ? 'justify-end' : ''}`}>
                       {!isUser && (
                          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 flex-shrink-0">
                            {AssistantIconComponent}
                          </div>
                      )}
                      <div className={`w-full max-w-2xl group ${isUser ? 'order-1' : 'order-2'}`}>
                        {message.thinkingContent && <ThinkingBox content={message.thinkingContent} />}
                        {(isLastMessage && message.isStreaming && !message.content && isDeepThought) && <DeepThinkingIndicator />}
                        
                        <div className={`relative ${isUser ? '' : 'px-5 py-3 bg-black/5 text-theme-text rounded-3xl rounded-bl-lg'}`}>
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
                                    {isUser ? (
                                        <>
                                            {message.content && (
                                                <div className="prose prose-sm max-w-none text-theme-text">
                                                    <MarkdownRenderer content={message.content} isStreaming={message.isStreaming && isLastMessage} />
                                                </div>
                                            )}
                                            {message.attachments?.map((att, i) => (
                                                <div key={i} className={`${message.content ? 'mt-2' : ''} rounded-2xl overflow-hidden aspect-video w-full max-w-xs`}>
                                                    <img src={att.preview_url} alt="attachment" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                        </>
                                    ) : (
                                        <>
                                            {message.imageUrl && (
                                                <div className="mb-2 rounded-2xl overflow-hidden aspect-video">
                                                    <img src={message.imageUrl} alt={message.content} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            {message.attachments?.map((att, i) => (
                                                <div key={i} className="mb-2 rounded-2xl overflow-hidden aspect-video">
                                                    <img src={att.preview_url} alt="attachment" className="w-full h-full object-cover" />
                                                </div>
                                            ))}
                                            <div className="prose prose-sm max-w-none text-current">
                                              <MarkdownRenderer content={message.content} isStreaming={message.isStreaming && isLastMessage} />
                                            </div>
                                        </>
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

                         <div className="flex items-center gap-2 mt-1.5 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleCopy(message.content, message.id)} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                {copiedMessageId === message.id ? <CheckIcon className="w-3 h-3 text-green-500" /> : <CopyIcon className="w-3 h-3" />}
                              </button>
                             {isUser && (
                                 <button onClick={() => setEditingMessage({ id: message.id, content: message.content })} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                     <EditIcon className="w-3 h-3" />
                                 </button>
                             )}
                              {!isUser && !isStreaming && !isCoding && (
                                 <button onClick={handleRegenerate} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                     <RegenerateIcon className="w-3 h-3" />
                                 </button>
                             )}
                             <button onClick={() => onBranch(conversation.id, message.id)} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                 <BranchIcon className="w-3 h-3" />
                             </button>
                              {!isUser && (
                                <button onClick={() => handleSetReminder(message.id, message.content)} className="text-theme-text-secondary hover:text-theme-text p-1.5 rounded-full hover:bg-black/5">
                                  <BellIcon className="w-3 h-3" />
                                </button>
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
          <div className="flex items-end gap-2">
            <div className="relative" ref={toolsRef}>
                <button 
                    type="button" 
                    onClick={() => setIsToolsOpen(p => !p)} 
                    disabled={isStreaming || isCoding}
                    aria-label="Open tools menu"
                    className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 text-theme-text-secondary hover:bg-black/5 ${isToolsOpen ? 'bg-black/10 rotate-45' : ''}`}
                >
                    <PlusIcon className="w-5 h-5"/>
                </button>
                {isToolsOpen && (
                    <div className="absolute bottom-full left-0 mb-2 w-60 bg-theme-surface backdrop-blur-xl border border-theme-border rounded-3xl shadow-2xl p-2 transition-all origin-bottom-left animate-[blur-in_0.2s_ease-out]">
                        <button type="button" onClick={() => triggerFileUpload()} disabled={isFileProcessing || isStreaming || isCoding} className="w-full flex items-center gap-3 text-left p-2 rounded-xl hover:bg-black/5 text-sm font-medium text-theme-text disabled:opacity-50">
                           <AttachmentIcon className="w-4 h-4 text-theme-text-secondary" />
                           <span>Attach Image or File</span>
                        </button>
                        {USER_TOOLS.map(tool => (
                            <button key={tool.id} onClick={() => handleToolClick(tool.id)} className={`w-full flex items-center gap-3 text-left p-2 rounded-xl hover:bg-black/5 text-sm font-medium ${tool.id === 'coding-mode' && isCodingMode ? 'text-puter-blue' : 'text-theme-text'}`}>
                                <tool.icon className="w-4 h-4 text-theme-text-secondary" />
                                <span>{tool.name}</span>
                                {tool.id === 'coding-mode' && <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${isCodingMode ? 'bg-puter-blue text-white' : 'bg-black/10 text-theme-text-secondary'}`}>{isCodingMode ? 'ON' : 'OFF'}</span>}
                            </button>
                        ))}
                    </div>
                )}
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
              placeholder={isCodingMode ? "Provide a detailed prompt for the web app you want to create..." : "Type your message here..."}
              className="flex-1 bg-black/5 rounded-2xl p-3 resize-none max-h-48 focus:outline-none focus:ring-2 focus:ring-puter-blue border-transparent text-sm placeholder-theme-text-secondary"
              rows={1}
              disabled={isFileProcessing || isStreaming || isCoding}
            />
             <button
              type={isStreaming || isCoding ? "button" : "submit"}
              onClick={(isStreaming || isCoding) ? handleStopStreaming : undefined}
              disabled={(!input.trim() && !pendingAttachment) || isFileProcessing}
              className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-puter-blue text-white rounded-full transition-all duration-200 shadow-lg shadow-blue-500/20 hover:bg-blue-600 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              aria-label={isStreaming || isCoding ? "Stop generating" : "Send message"}
            >
              {isStreaming || isCoding ? <StopIcon className="w-5 h-5"/> : <SendIcon className="w-5 h-5"/>}
            </button>
             <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*,text/plain,.md" />
          </div>
        </form>
    </div>
  );
};