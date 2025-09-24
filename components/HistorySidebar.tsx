
import React from 'react';
import type { Conversation } from '../types';
import { PlusIcon, MessageIcon, TrashIcon } from './Icons';

interface HistorySidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onCreateConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  conversations,
  activeConversationId,
  onCreateConversation,
  onSelectConversation,
  onDeleteConversation,
}) => {
  return (
    <aside className="w-72 bg-puter-gray-900 flex flex-col p-4 border-r border-puter-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Puter Chat</h1>
      </div>
      <button
        onClick={onCreateConversation}
        className="flex items-center justify-center w-full gap-2 px-4 py-2 mb-4 bg-puter-blue text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
      >
        <PlusIcon className="w-5 h-5" />
        New Chat
      </button>
      <nav className="flex-1 overflow-y-auto space-y-2 -mr-2 pr-2">
        {conversations.map(conv => (
          <div
            key={conv.id}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
              activeConversationId === conv.id
                ? 'bg-puter-gray-700'
                : 'hover:bg-puter-gray-800'
            }`}
            onClick={() => onSelectConversation(conv.id)}
          >
            <div className="flex items-center gap-3 truncate">
              <MessageIcon className="w-5 h-5 flex-shrink-0 text-puter-gray-400" />
              <span className="truncate text-sm font-medium">{conv.title}</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDeleteConversation(conv.id);
              }}
              className="opacity-0 group-hover:opacity-100 text-puter-gray-400 hover:text-red-500 transition-opacity p-1"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </nav>
      <div className="mt-auto text-center text-xs text-puter-gray-600">
        <p>Powered by Puter.js</p>
      </div>
    </aside>
  );
};
