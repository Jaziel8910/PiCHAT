import React, { useState, useEffect } from 'react';
import type { Memory } from '../types';
import { XIcon, PlusIcon, EditIcon, TrashIcon, CheckIcon, MemoryIcon } from './Icons';

interface MemoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory;
  onUpdateMemory: (newMemory: Memory) => void;
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({ isOpen, onClose, memory, onUpdateMemory }) => {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formState, setFormState] = useState({ key: '', value: '' });

  useEffect(() => {
    // Reset form when opening/closing or when the editing key changes
    if (!isOpen || !editingKey) {
        setFormState({ key: '', value: '' });
        setEditingKey(null);
    }
  }, [isOpen, editingKey]);
  
  const handleStartEdit = (key: string, value: string) => {
    setEditingKey(key);
    setFormState({ key: key.replace(/_/g, ' '), value });
  };
  
  const handleCancelEdit = () => {
    setEditingKey(null);
    setFormState({ key: '', value: '' });
  };

  const handleSave = () => {
    if (!formState.key || !formState.value) return;
    const key = formState.key.trim().replace(/\s+/g, '_');
    const newMemory = { ...memory, [key]: formState.value.trim() };
    if (editingKey && editingKey !== key) {
        delete newMemory[editingKey];
    }
    onUpdateMemory(newMemory);
    handleCancelEdit();
  };

  const handleDelete = (key: string) => {
    if (window.confirm(`Are you sure you want to forget about "${key.replace(/_/g, ' ')}"?`)) {
        const { [key]: _, ...rest } = memory;
        onUpdateMemory(rest);
    }
  };
  
  if (!isOpen) return null;

  const renderForm = () => (
    <div className="p-4 bg-black/5 rounded-2xl">
        <h3 className="text-sm font-semibold mb-2">{editingKey ? 'Edit Memory' : 'Add New Memory'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input 
                type="text"
                placeholder="Memory Key (e.g., Project Name)"
                value={formState.key}
                onChange={(e) => setFormState({...formState, key: e.target.value})}
                className="w-full bg-white/80 text-theme-text rounded-lg p-2 text-sm focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent"
            />
            <input 
                type="text"
                placeholder="Value (e.g., Project Odyssey)"
                value={formState.value}
                onChange={(e) => setFormState({...formState, value: e.target.value})}
                className="w-full bg-white/80 text-theme-text rounded-lg p-2 text-sm focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent"
            />
        </div>
        <div className="flex justify-end gap-2 mt-2">
            {(editingKey || formState.key || formState.value) && (
                 <button onClick={handleCancelEdit} className="px-3 py-1 text-xs font-semibold rounded-lg hover:bg-black/10">Cancel</button>
            )}
            <button onClick={handleSave} className="px-3 py-1 text-xs font-semibold rounded-lg bg-puter-blue text-white hover:bg-blue-600 disabled:bg-gray-400" disabled={!formState.key || !formState.value}>
                {editingKey ? 'Save Changes' : 'Add Memory'}
            </button>
        </div>
    </div>
  );
  
  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
        <div className="bg-theme-surface backdrop-blur-2xl border border-theme-border rounded-4xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex items-center justify-between p-4 border-b border-black/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <MemoryIcon className="w-6 h-6 text-puter-blue" />
                    <h2 className="text-xl font-bold text-theme-text">Long-Term Memory</h2>
                </div>
                <button onClick={onClose} className="p-1 text-theme-text-secondary rounded-full hover:bg-black/5 hover:text-theme-text" aria-label="Close">
                    <XIcon className="w-6 h-6" />
                </button>
            </header>
            <main className="flex-1 overflow-y-auto p-6 space-y-3">
              <p className="text-sm text-theme-text-secondary mb-4 -mt-2">The AI will use this information to provide more personalized responses. It can also add and update memories on its own during conversations.</p>
              {Object.entries(memory).length > 0 ? Object.entries(memory).map(([key, value]) => (
                <div key={key} className="group flex items-center justify-between p-3 bg-black/5 rounded-2xl">
                    <div>
                        <p className="text-xs text-theme-text-secondary">{key.replace(/_/g, ' ')}</p>
                        <p className="text-sm font-medium text-theme-text">{String(value)}</p>
                    </div>
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleStartEdit(key, String(value))} className="p-1.5 text-theme-text-secondary hover:text-theme-text"><EditIcon className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(key)} className="p-1.5 text-theme-text-secondary hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                </div>
              )) : (
                <div className="text-center text-theme-text-secondary py-8">
                    <p className="font-semibold">No memories yet.</p>
                    <p className="text-sm">Start chatting or add a memory below.</p>
                </div>
              )}
            </main>
             <footer className="p-4 border-t border-black/10">
                {renderForm()}
            </footer>
        </div>
    </div>
  );
};