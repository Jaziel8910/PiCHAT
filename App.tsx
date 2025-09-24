
import React, { useState, useEffect, useCallback } from 'react';
import { HistorySidebar } from './components/HistorySidebar';
import { ChatView } from './components/ChatView';
import type { Conversation } from './types';
import { PlusIcon } from './components/Icons';

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedConversations = localStorage.getItem('puter-chat-conversations');
      if (savedConversations) {
        const parsed = JSON.parse(savedConversations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          const lastActiveId = localStorage.getItem('puter-chat-active-id');
          setActiveConversationId(lastActiveId || parsed[0].id);
        } else {
            createNewConversation();
        }
      } else {
        createNewConversation();
      }
    } catch (error) {
      console.error("Failed to load conversations from localStorage:", error);
      createNewConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (conversations.length > 0) {
        localStorage.setItem('puter-chat-conversations', JSON.stringify(conversations));
    }
    if(activeConversationId) {
        localStorage.setItem('puter-chat-active-id', activeConversationId);
    }
  }, [conversations, activeConversationId]);

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      model: 'openrouter:google/gemma-2-9b-it:free', // A sensible, free default model
    };
    setConversations(prev => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => {
      const newConversations = prev.filter(c => c.id !== id);
      if (activeConversationId === id) {
        if (newConversations.length > 0) {
          setActiveConversationId(newConversations[0].id);
        } else {
          createNewConversation();
        }
      }
      if(newConversations.length === 0){
        createNewConversation();
      }
      return newConversations;
    });
  }, [activeConversationId, createNewConversation]);

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
  
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex h-screen w-full font-sans">
      <HistorySidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onCreateConversation={createNewConversation}
        onSelectConversation={setActiveConversationId}
        onDeleteConversation={deleteConversation}
      />
      <main className="flex-1 flex flex-col bg-puter-gray-800">
        {activeConversation ? (
          <ChatView
            key={activeConversation.id}
            conversation={activeConversation}
            setConversation={updateConversation}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-puter-gray-400">
            <h1 className="text-2xl font-semibold mb-4">Puter AI Chat</h1>
            <p className="mb-6">Select a chat or start a new one.</p>
             <button
                onClick={createNewConversation}
                className="flex items-center gap-2 px-4 py-2 bg-puter-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
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
