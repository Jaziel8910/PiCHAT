import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HistorySidebar } from './components/HistorySidebar';
import { ChatView } from './components/ChatView';
import type { Conversation, AppSettings } from './types';
import { DEFAULT_PERSONA_ID, Persona, loadCustomPersonas, saveCustomPersonas } from './personas';
import { PlusIcon, LoadingIcon } from './components/Icons';
import { SettingsPage } from './components/SettingsPage';
import { VoiceChat } from './components/VoiceChat';

declare const puter: any;
const CONVERSATIONS_PATH = '.config/pichat-conversations.json';
const SETTINGS_KEY = 'pichat-settings';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      const defaultSettings: AppSettings = {
          theme: 'system',
          defaultSidebarCollapsed: false,
          defaultTemperature: 0.8,
          defaultMaxTokens: 4096,
      };
      return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(settings.defaultSidebarCollapsed);

  // A ref to prevent multiple saves at the same time
  const isSaving = useRef(false);
  const saveQueue = useRef<Conversation[] | null>(null);

  useEffect(() => {
    setCustomPersonas(loadCustomPersonas());
  }, []);
  
  // Persist settings
  useEffect(() => {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Handle theme changes
  useEffect(() => {
      const root = window.document.documentElement;
      const isDark =
          settings.theme === 'dark' ||
          (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      root.classList.toggle('dark', isDark);

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
          if (settings.theme === 'system') {
              root.classList.toggle('dark', mediaQuery.matches);
          }
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);


  const handleUpdateCustomPersonas = (updatedPersonas: Persona[]) => {
    setCustomPersonas(updatedPersonas);
    saveCustomPersonas(updatedPersonas);
  };

  const saveConversations = useCallback(async (convs: Conversation[]) => {
    saveQueue.current = convs;
    if (isSaving.current) return;

    isSaving.current = true;
    
    // Process the latest save request in the queue
    while(saveQueue.current !== null) {
        const dataToSave = saveQueue.current;
        saveQueue.current = null;
        try {
            if (typeof puter !== 'undefined' && puter.fs) {
                await puter.fs.write(CONVERSATIONS_PATH, JSON.stringify(dataToSave, null, 2), {
                    createMissingParents: true,
                });
            } else {
                console.warn("Puter.fs not available, cannot save conversations to cloud.");
            }
        } catch (err: any) {
            console.error("Failed to save conversations to Puter FS:", err);
            if (err.message && err.message.toLowerCase().includes('user cancelled')) {
                setError("Could not save chats. You cancelled the authentication.");
            } else {
                setError("Could not save chats. Please check your connection.");
            }
        }
    }
    
    isSaving.current = false;
  }, []);

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      model: 'gpt-4o',
      persona: DEFAULT_PERSONA_ID,
      temperature: settings.defaultTemperature,
      maxTokens: settings.defaultMaxTokens,
      selectedTools: [],
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  }, [settings.defaultTemperature, settings.defaultMaxTokens]);
  
  const branchConversation = useCallback((conversationId: string, messageId: string) => {
    setConversations(prev => {
        const sourceConv = prev.find(c => c.id === conversationId);
        if (!sourceConv) return prev;

        const messageIndex = sourceConv.messages.findIndex(m => m.id === messageId);
        if (messageIndex === -1) return prev;

        const newMessages = sourceConv.messages.slice(0, messageIndex + 1);

        const newConversation: Conversation = {
            ...sourceConv,
            id: `conv-${Date.now()}`,
            title: `Branch of "${sourceConv.title}"`,
            messages: newMessages,
        };
        
        setActiveConversationId(newConversation.id);
        return [newConversation, ...prev];
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadConversations = async () => {
      // A short delay to allow Puter.js to initialize, preventing race conditions
      await new Promise(resolve => setTimeout(resolve, 50));
      if (!isMounted) return;

      if (typeof puter === 'undefined' || !puter.fs) {
          console.warn("Puter.fs not available, using fallback.");
          if (isMounted) {
            createNewConversation();
            setIsLoading(false);
          }
          return;
      }
      try {
        const blob = await puter.fs.read(CONVERSATIONS_PATH);
        if (!isMounted) return;

        if (!blob) {
            throw new Error("No saved data found.");
        }

        const savedConversations = await blob.text();
        if (!isMounted) return;
        
        const parsed = JSON.parse(savedConversations);
        
        if (isMounted) {
            if (Array.isArray(parsed) && parsed.length > 0) {
              setConversations(parsed);
              const lastActiveId = localStorage.getItem('pichat-active-id');
              const activeExists = parsed.some(c => c.id === lastActiveId);
              setActiveConversationId(activeExists ? lastActiveId : parsed[0].id);
            } else {
              createNewConversation();
            }
        }
      } catch (error) {
        if (isMounted) {
            console.log("No saved conversations found or error reading, creating new one.", error);
            createNewConversation();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadConversations();
    
    return () => {
        isMounted = false;
    };
  }, [createNewConversation]);

  useEffect(() => {
    const isAnyStreaming = conversations.some(c => c.messages.some(m => m.isStreaming));

    if (conversations.length > 0 && !isLoading && !isAnyStreaming) {
      saveConversations(conversations);
    }
    if(activeConversationId) {
        localStorage.setItem('pichat-active-id', activeConversationId);
    }
  }, [conversations, activeConversationId, isLoading, saveConversations]);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const newConversations = prev.filter(c => c.id !== id);
      if (activeConversationId === id) {
        if (newConversations.length > 0) {
          setActiveConversationId(newConversations[0].id);
        } else {
          setActiveConversationId(null);
        }
      }
      return newConversations;
    });
  }, [activeConversationId]);

  // Effect to handle the case where all conversations are deleted
  useEffect(() => {
    if(!isLoading && conversations.length === 0){
      createNewConversation();
    }
  }, [conversations, isLoading, createNewConversation]);

  const updateConversation = (
    id: string,
    updatedData: Partial<Conversation> | ((conv: Conversation) => Partial<Conversation>)
  ) => {
    setConversations(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updates = typeof updatedData === 'function' ? updatedData(c) : updatedData;
          return { ...c, ...updates };
        }
        return c;
      })
    );
  };
  
  const handleExportData = useCallback(async () => {
      try {
          const dataToExport = {
              conversations,
              customPersonas,
          };
          const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
          await puter.fs.write('pichat_export.json', blob, { createMissingParents: true });
          alert('Data exported successfully to pichat_export.json in your root directory.');
      } catch (e) {
          console.error("Export failed:", e);
          alert('Failed to export data.');
      }
  }, [conversations, customPersonas]);

  const handleImportData = useCallback(async () => {
      try {
          const file = await puter.ui.upload({ multiple: false, accept: '.json' });
          if (!file) return;

          const content = await file.text();
          const data = JSON.parse(content);

          if (window.confirm('This will overwrite your current conversations and personas. Are you sure?')) {
              if (Array.isArray(data.conversations)) {
                  setConversations(data.conversations);
                  setActiveConversationId(data.conversations[0]?.id || null);
              }
              if (Array.isArray(data.customPersonas)) {
                  handleUpdateCustomPersonas(data.customPersonas);
              }
              alert('Data imported successfully.');
          }
      } catch (e) {
          console.error("Import failed:", e);
          alert('Failed to import data. Please ensure it is a valid export file.');
      }
  }, []);

  const handleClearAllData = useCallback(() => {
      if (window.confirm('DANGER: This will delete all your conversations and custom personas permanently. Are you sure?')) {
          setConversations([]);
          handleUpdateCustomPersonas([]);
          localStorage.removeItem('pichat-active-id');
          // This will trigger creation of a new chat
          setTimeout(() => createNewConversation(), 0);
          alert('All data has been cleared.');
      }
  }, [createNewConversation]);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-theme-bg">
            <LoadingIcon className="w-10 h-10 text-puter-blue" />
            <p className="ml-4 text-lg text-theme-text-secondary">Loading your chats...</p>
        </div>
    );
  }

  return (
    <div className="flex h-screen w-full font-sans p-4">
      <VoiceChat 
        isOpen={isVoiceChatOpen}
        onClose={() => setIsVoiceChatOpen(false)}
      />
      <SettingsPage 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={setSettings}
        onExport={handleExportData}
        onImport={handleImportData}
        onClearAllData={handleClearAllData}
      />
      <HistorySidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onCreateConversation={createNewConversation}
        onSelectConversation={setActiveConversationId}
        onDeleteConversation={deleteConversation}
        onRenameConversation={(id, title) => updateConversation(id, { title })}
        isCollapsed={isSidebarCollapsed}
        onToggle={toggleSidebar}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
      <main className={`flex-1 flex flex-col bg-theme-surface backdrop-blur-2xl rounded-4xl ml-4 overflow-hidden transition-all duration-300 ease-in-out`}>
        {error && <div className="bg-red-500/80 text-white text-center p-2 text-sm">{error}</div>}
        {activeConversation ? (
          <ChatView
            key={activeConversation.id}
            conversation={activeConversation}
            setConversation={updateConversation}
            onBranch={branchConversation}
            customPersonas={customPersonas}
            onUpdateCustomPersonas={handleUpdateCustomPersonas}
            onOpenVoiceChat={() => setIsVoiceChatOpen(true)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-theme-text-secondary">
            <h1 className="text-2xl font-semibold mb-4 text-theme-text">PiChat</h1>
            <p className="mb-6">Select a chat or start a new one.</p>
             <button
                onClick={createNewConversation}
                className="flex items-center gap-2 px-4 py-2 bg-puter-blue text-white rounded-2xl hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/20"
              >
                <PlusIcon className="w-5 h-5" />
                New Chat
              </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;