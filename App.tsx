import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HistorySidebar } from './components/HistorySidebar';
import { ChatView } from './components/ChatView';
import { MainPage } from './components/MainPage';
import type { Conversation, AppSettings, Memory } from './types';
import { PERSONAS, DEFAULT_PERSONA_ID, Persona, loadCustomPersonas, saveCustomPersonas } from './personas';
import { PlusIcon, LoadingIcon } from './components/Icons';
import { SettingsPage } from './components/SettingsPage';
import { VoiceChat } from './components/VoiceChat';
import { usePuter } from './hooks/usePuter';
import { MemoryManager } from './components/MemoryManager';
import { SignInPage } from './components/SignInPage';

declare const puter: any;
const CONVERSATIONS_PATH = '.config/pichat-conversations.json';
const SETTINGS_KEY = 'pichat-settings';
const CUSTOM_PERSONAS_KEY = 'pichat-custom-personas';
const ACTIVE_ID_KEY = 'pichat-active-id';

const defaultSettings: AppSettings = {
    theme: 'system',
    defaultSidebarCollapsed: false,
    defaultTemperature: 0.8,
    defaultMaxTokens: 4096,
};

const App: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<'checking' | 'signedIn' | 'signedOut'>('checking');
  const [user, setUser] = useState<{ username: string; avatar: string; } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customPersonas, setCustomPersonas] = useState<Persona[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  const [isMemoryManagerOpen, setIsMemoryManagerOpen] = useState(false);
  const [memory, setMemory] = useState<Memory>({});
  const [isFullScreen, setIsFullScreen] = useState(false);

  const { getMemory, setMemory: saveMemoryToPuter } = usePuter();
  
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(settings.defaultSidebarCollapsed);

  // A ref to prevent multiple saves at the same time
  const isSaving = useRef(false);
  const saveQueue = useRef<Conversation[] | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
        if (typeof puter !== 'undefined' && puter.auth) {
            const signedIn = await puter.auth.isSignedIn();
            setAuthStatus(signedIn ? 'signedIn' : 'signedOut');
        } else {
            setAuthStatus('signedIn'); // Fallback for local dev
        }
    };
    setTimeout(checkAuth, 100);
  }, []);

  useEffect(() => {
    if (authStatus === 'signedIn' && typeof puter !== 'undefined' && puter.auth) {
        puter.auth.getUser().then((userInfo: any) => {
            if (userInfo) setUser(userInfo);
        });
    } else {
        setUser(null);
    }
  }, [authStatus]);
  
  // Persist settings to cloud
  useEffect(() => {
      const saveSettings = async () => {
          if (typeof puter !== 'undefined' && puter.kv && authStatus === 'signedIn') {
              await puter.kv.set(SETTINGS_KEY, JSON.stringify(settings));
          } else {
              localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); // Fallback
          }
      };
      saveSettings();
  }, [settings, authStatus]);

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


  const handleUpdateCustomPersonas = async (updatedPersonas: Persona[]) => {
    setCustomPersonas(updatedPersonas);
    await saveCustomPersonas(updatedPersonas);
  };
  
  const handleUpdateMemory = useCallback(async (newMemory: Memory) => {
    setMemory(newMemory);
    await saveMemoryToPuter(newMemory);
  }, [saveMemoryToPuter]);

  const saveConversations = useCallback(async (convs: Conversation[]) => {
    saveQueue.current = convs;
    if (isSaving.current) return;

    isSaving.current = true;
    
    while(saveQueue.current !== null) {
        const dataToSave = saveQueue.current;
        saveQueue.current = null;
        try {
            if (typeof puter !== 'undefined' && puter.fs) {
                await puter.fs.write(CONVERSATIONS_PATH, JSON.stringify(dataToSave, null, 2), {
                    createMissingParents: true,
                });
            }
        } catch (err: any) {
            console.error("Failed to save conversations to Puter FS:", err);
            setError("Could not save chats. Please check your connection or permissions.");
        }
    }
    
    isSaving.current = false;
  }, []);

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      model: 'openrouter/auto',
      persona: DEFAULT_PERSONA_ID,
      temperature: settings.defaultTemperature,
      maxTokens: settings.defaultMaxTokens,
      selectedTools: [],
      supertextsEnabled: false,
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

    const loadAllData = async () => {
        setIsLoading(true);
        if (!isMounted) return;

        if (typeof puter === 'undefined' || !puter.fs) {
            console.warn("Puter SDK not available, using fallback.");
            if (isMounted) {
                // Fallback to localStorage for local dev
                const localSettings = localStorage.getItem(SETTINGS_KEY);
                if (localSettings) setSettings({ ...defaultSettings, ...JSON.parse(localSettings) });
                setCustomPersonas(await loadCustomPersonas()); // Will use localStorage
                createNewConversation();
                setIsLoading(false);
            }
            return;
        }

        try {
            // Load settings, personas, and memory concurrently
            const [savedSettings, loadedPersonas, storedMemory] = await Promise.all([
                puter.kv.get(SETTINGS_KEY),
                loadCustomPersonas(),
                getMemory()
            ]);
             if (!isMounted) return;

            if (savedSettings) setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
            setCustomPersonas(loadedPersonas);
            setMemory(storedMemory);
            
            // Load conversations
            const blob = await puter.fs.read(CONVERSATIONS_PATH);
            if (!isMounted) return;

            let parsedConvs: Conversation[] = [];
            if (blob) {
                const savedConversations = await blob.text();
                if (savedConversations) parsedConvs = JSON.parse(savedConversations);
            }

            if (Array.isArray(parsedConvs) && parsedConvs.length > 0) {
                setConversations(parsedConvs);
                const lastActiveId = await puter.kv.get(ACTIVE_ID_KEY);
                const activeExists = parsedConvs.some(c => c.id === lastActiveId);
                setActiveConversationId(activeExists ? lastActiveId : parsedConvs[0].id);
            } else {
                createNewConversation();
            }
        } catch (error) {
            if (isMounted) {
                console.log("No saved data found or error reading, creating new conversation.", error);
                createNewConversation();
            }
        } finally {
            if (isMounted) setIsLoading(false);
        }
    };

    if (authStatus === 'signedIn') {
        loadAllData();
    }
    
    return () => { isMounted = false; };
  }, [authStatus, createNewConversation, getMemory]);

  useEffect(() => {
    const isAnyStreaming = conversations.some(c => c.messages.some(m => m.isStreaming));

    if (conversations.length > 0 && !isLoading && !isAnyStreaming && authStatus === 'signedIn') {
      saveConversations(conversations);
    }
    
    const saveActiveId = async () => {
        if(activeConversationId) {
            if (typeof puter !== 'undefined' && puter.kv && authStatus === 'signedIn') {
                await puter.kv.set(ACTIVE_ID_KEY, activeConversationId);
            } else {
                localStorage.setItem('pichat-active-id', activeConversationId);
            }
        }
    };
    saveActiveId();
  }, [conversations, activeConversationId, isLoading, authStatus, saveConversations]);

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

  useEffect(() => {
    if(!isLoading && conversations.length === 0 && authStatus === 'signedIn'){
      createNewConversation();
    }
  }, [conversations, isLoading, authStatus, createNewConversation]);

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
  
  const handleExportData = useCallback(async () => { /* ... unchanged ... */ }, [conversations, customPersonas, memory]);
  const handleExportConversation = useCallback(async (conversationId: string, format: 'md' | 'html') => { /* ... unchanged ... */ }, [conversations, customPersonas]);
  const handleImportData = useCallback(async () => { /* ... unchanged ... */ }, [handleUpdateCustomPersonas, handleUpdateMemory]);

  const handleClearAllData = useCallback(async () => {
      if (window.confirm('DANGER: This will delete all your conversations, custom personas and memory from your Puter account permanently. Are you sure?')) {
          setConversations([]);
          await handleUpdateCustomPersonas([]);
          await handleUpdateMemory({});
          if (typeof puter !== 'undefined' && puter.kv) {
              await puter.kv.delete(ACTIVE_ID_KEY);
          } else {
              localStorage.removeItem('pichat-active-id');
          }
          setTimeout(() => createNewConversation(), 0);
          puter.ui.showNotification('Success', 'All data has been cleared.');
      }
  }, [createNewConversation, handleUpdateMemory, handleUpdateCustomPersonas]);

  const handleSignIn = useCallback(async () => { /* ... unchanged ... */ }, []);
  
  const handleSignOut = useCallback(async () => {
    if (typeof puter !== 'undefined' && puter.auth) {
        await puter.auth.signOut();
        setAuthStatus('signedOut');
        setUser(null);
        setConversations([]);
        setActiveConversationId(null);
        setMemory({});
    }
  }, []);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  if (authStatus === 'checking' || (authStatus === 'signedIn' && isLoading)) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-theme-bg">
            <LoadingIcon className="w-10 h-10 text-puter-blue" />
            <p className="ml-4 text-lg text-theme-text-secondary">
                {authStatus === 'checking' ? 'Checking authentication...' : 'Loading from the cloud...'}
            </p>
        </div>
    );
  }
  
  if (authStatus === 'signedOut') {
      return <SignInPage onSignIn={() => setAuthStatus('signedIn')} />;
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
       <MemoryManager
        isOpen={isMemoryManagerOpen}
        onClose={() => setIsMemoryManagerOpen(false)}
        memory={memory}
        onUpdateMemory={handleUpdateMemory}
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
        onOpenMemory={() => setIsMemoryManagerOpen(true)}
        isFullScreen={isFullScreen}
        user={user}
        onSignOut={handleSignOut}
      />
      <main className={`flex-1 flex flex-col bg-theme-surface backdrop-blur-2xl rounded-4xl overflow-hidden transition-all duration-300 ease-in-out ${isFullScreen ? 'ml-0' : 'ml-4'}`}>
        {error && <div className="bg-red-500/80 text-white text-center p-2 text-sm">{error}</div>}
        {activeConversation && activeConversation.messages.length > 0 ? (
          <ChatView
            key={activeConversation.id}
            conversation={activeConversation}
            setConversation={updateConversation}
            onBranch={branchConversation}
            customPersonas={customPersonas}
            onUpdateCustomPersonas={handleUpdateCustomPersonas}
            onOpenVoiceChat={() => setIsVoiceChatOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            memory={memory}
            onUpdateMemory={handleUpdateMemory}
            onExportConversation={handleExportConversation}
            isFullScreen={isFullScreen}
            onToggleFullScreen={() => setIsFullScreen(p => !p)}
          />
        ) : (
          <MainPage
            activeConversation={activeConversation}
            setConversation={updateConversation}
            conversations={conversations.filter(c => c.id !== activeConversation?.id && c.messages.length > 0).slice(0, 4)}
            onSelectConversation={setActiveConversationId}
            customPersonas={customPersonas}
            memory={memory}
            onUpdateMemory={handleUpdateMemory}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenVoiceChat={() => setIsVoiceChatOpen(true)}
            user={user}
          />
        )}
      </main>
    </div>
  );
};

export default App;
