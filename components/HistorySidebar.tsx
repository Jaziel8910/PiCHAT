import React, { useState, useRef, useEffect } from 'react';
import type { Conversation } from '../types';
import { PlusIcon, MessageIcon, TrashIcon, EditIcon, SearchIcon, XIcon, BrainIcon, CodeIcon, QuillIcon, SarcasticIcon, SidebarIcon, CogIcon, MemoryIcon, SignOutIcon, UserIcon } from './Icons';

interface HistorySidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onCreateConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, title: string) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
  onOpenMemory: () => void;
  isFullScreen: boolean;
  user: { username: string; avatar: string; } | null;
  onSignOut: () => void;
}

const personaIcons: { [key: string]: React.FC<React.HTMLProps<HTMLElement>> } = {
  default: BrainIcon,
  code_expert: CodeIcon,
  creative_writer: QuillIcon,
  sarcastic_bot: SarcasticIcon,
};


export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  conversations,
  activeConversationId,
  onCreateConversation,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  isCollapsed,
  onToggle,
  onOpenSettings,
  onOpenMemory,
  isFullScreen,
  user,
  onSignOut,
}) => {
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingConvId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingConvId]);

  const handleStartEditing = (conv: Conversation) => {
    setEditingConvId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleCancelEditing = () => {
    setEditingConvId(null);
    setEditingTitle('');
  };

  const handleSaveTitle = () => {
    if (editingConvId && editingTitle.trim()) {
      onRenameConversation(editingConvId, editingTitle.trim());
    }
    handleCancelEditing();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isFullScreen) return null;

  return (
    <aside className={`bg-theme-surface backdrop-blur-2xl flex flex-col p-4 border border-theme-border rounded-4xl transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="flex items-center justify-between mb-4">
        {!isCollapsed && <h1 className="text-xl font-bold text-theme-text">PiChat</h1>}
        <button onClick={onToggle} className="p-1.5 text-theme-text-secondary hover:text-theme-text hover:bg-black/5 rounded-full" aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
            <SidebarIcon className={`w-5 h-5 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <button
        onClick={onCreateConversation}
        className={`flex items-center w-full gap-2 px-4 py-2 mb-4 bg-puter-blue text-white rounded-2xl hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/20 ${isCollapsed ? 'justify-center' : ''}`}
      >
        <PlusIcon className="w-5 h-5" />
        {!isCollapsed && <span className="whitespace-nowrap">New Chat</span>}
      </button>
      
       {!isCollapsed && (
        <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <SearchIcon className="w-4 h-4 text-theme-text-secondary" />
            </div>
            <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/5 text-theme-text rounded-2xl py-2 pl-9 pr-8 text-sm focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent placeholder-theme-text-secondary"
            />
            {searchQuery && (
                <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                    aria-label="Clear search"
                >
                    <XIcon className="w-4 h-4 text-theme-text-secondary hover:text-theme-text" />
                </button>
            )}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto space-y-2 -mr-2 pr-2">
        {filteredConversations.map(conv => {
            const PersonaIcon = personaIcons[conv.persona] || MessageIcon;
            return (
              <div
                key={conv.id}
                title={isCollapsed ? conv.title : undefined}
                className={`group flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-colors duration-200 ${
                  activeConversationId === conv.id
                    ? 'bg-blue-500/10'
                    : 'hover:bg-black/5'
                } ${isCollapsed ? 'justify-center' : ''}`}
                onClick={() => editingConvId !== conv.id && onSelectConversation(conv.id)}
              >
                <div className="flex items-center gap-3 truncate flex-1">
                  <PersonaIcon className="w-5 h-5 flex-shrink-0 text-theme-text-secondary" />
                  {!isCollapsed && (
                    <>
                        {editingConvId === conv.id ? (
                            <input
                            ref={inputRef}
                            type="text"
                            value={editingTitle}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onBlur={handleSaveTitle}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle();
                                if (e.key === 'Escape') handleCancelEditing();
                            }}
                            className="bg-white/50 text-sm font-medium w-full focus:outline-none ring-1 ring-puter-blue rounded-lg px-1 -my-1"
                            />
                        ) : (
                            <span className={`truncate text-sm font-medium ${activeConversationId === conv.id ? 'text-puter-blue' : 'text-theme-text'}`}>{conv.title}</span>
                        )}
                    </>
                  )}
                </div>

                {!isCollapsed && editingConvId !== conv.id && (
                    <div className="flex-shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleStartEditing(conv);
                            }}
                            className="text-theme-text-secondary hover:text-puter-blue p-1"
                            aria-label="Rename chat"
                        >
                            <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv.id);
                            }}
                            className="text-theme-text-secondary hover:text-red-500 p-1"
                            aria-label="Delete chat"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
              </div>
            )
        })}
         {filteredConversations.length === 0 && searchQuery && !isCollapsed && (
          <div className="text-center text-sm text-gray-400 py-4">
            No chats found.
          </div>
        )}
      </nav>
      <div className="mt-auto pt-4 border-t border-theme-border">
         {!isCollapsed && user && (
            <div className="flex items-center gap-3 p-2 mb-2">
                <div className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-theme-text-secondary" />
                </div>
                <p className="flex-1 text-sm font-semibold text-theme-text truncate">{user.username}</p>
                <button onClick={onSignOut} title="Sign Out" className="p-2 text-theme-text-secondary hover:text-red-500 rounded-full hover:bg-red-500/10 transition-colors">
                    <SignOutIcon className="w-5 h-5" />
                </button>
            </div>
        )}
         <button onClick={onOpenMemory} className={`flex items-center w-full gap-3 p-2 rounded-2xl hover:bg-black/5 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
            <MemoryIcon className="w-5 h-5 text-theme-text-secondary" />
            {!isCollapsed && <span className="text-sm font-medium text-theme-text">Memory</span>}
        </button>
        <button onClick={onOpenSettings} className={`flex items-center w-full gap-3 p-2 rounded-2xl hover:bg-black/5 transition-colors ${isCollapsed ? 'justify-center' : ''}`}>
            <CogIcon className="w-5 h-5 text-theme-text-secondary" />
            {!isCollapsed && <span className="text-sm font-medium text-theme-text">Settings</span>}
        </button>
        {!isCollapsed && (
            <div className="mt-2 text-center text-xs text-gray-400">
                <p>Powered by Puter.js</p>
            </div>
        )}
      </div>
    </aside>
  );
};
