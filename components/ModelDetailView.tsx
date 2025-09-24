import React, { useState } from 'react';
import type { ModelInfo } from '../types';
import * as Icons from './Icons';

interface ModelDetailViewProps {
  model: ModelInfo;
  onClose: () => void;
  onSelect: (modelId: string) => void;
}

export const ModelDetailView: React.FC<ModelDetailViewProps> = ({ model, onClose, onSelect }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const ProviderIcon = Icons[model.providerIcon] || Icons.AssistantIcon;

  const testLatency = () => {
    // In a real app, this would ping an endpoint.
    alert('Latency test feature is not yet implemented.');
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="bg-theme-surface/95 backdrop-blur-2xl border border-theme-border rounded-4xl shadow-2xl w-full max-w-2xl h-auto max-h-[80vh] flex flex-col overflow-hidden animate-blur-in" 
        onClick={e => e.stopPropagation()}
      >
        <header className="p-6 border-b border-black/10">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-black/5 rounded-2xl flex items-center justify-center">
                    <ProviderIcon className="w-8 h-8 text-theme-text" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-theme-text">{model.name}</h2>
                    <p className="text-md text-theme-text-secondary">{model.provider}</p>
                </div>
                <button onClick={onClose} className="ml-auto p-2 text-theme-text-secondary rounded-full hover:bg-black/5" aria-label="Close">
                    <Icons.XIcon className="w-6 h-6" />
                </button>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
                <h3 className="font-semibold text-theme-text mb-2">Description</h3>
                <p className="text-sm text-theme-text-secondary">{model.description}</p>
            </div>
            <div>
                <h3 className="font-semibold text-theme-text mb-2">Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-black/5 p-3 rounded-lg">
                        <p className="text-xs text-theme-text-secondary">Category</p>
                        <p className="font-medium text-theme-text capitalize">{model.category}</p>
                    </div>
                    <div className="bg-black/5 p-3 rounded-lg">
                        <p className="text-xs text-theme-text-secondary">Context Length</p>
                        <p className="font-medium text-theme-text">{model.contextLength ? `${(model.contextLength / 1000).toLocaleString()}k tokens` : 'N/A'}</p>
                    </div>
                </div>
            </div>
             <div>
                <h3 className="font-semibold text-theme-text mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                    {model.tags.map(tag => (
                        <span key={tag} className="text-xs font-medium bg-black/10 text-theme-text-secondary px-2 py-1 rounded-full">{tag}</span>
                    ))}
                    {model.isFree && <span className="text-xs font-medium bg-green-500/20 text-green-700 px-2 py-1 rounded-full">Free</span>}
                    {model.isRecommended && <span className="text-xs font-medium bg-yellow-500/20 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1"><Icons.StarIcon className="w-3 h-3"/> Recommended</span>}
                </div>
            </div>
        </main>
        <footer className="p-6 border-t border-black/10 flex items-center justify-between gap-4">
            <div className="flex gap-2">
                 <button onClick={() => setIsFavorite(!isFavorite)} className={`p-3 rounded-full transition-colors ${isFavorite ? 'text-yellow-500 bg-yellow-500/10' : 'text-theme-text-secondary hover:bg-black/5'}`} aria-label="Add to favorites">
                    <Icons.StarIcon className="w-5 h-5" />
                </button>
                 <button onClick={testLatency} className="p-3 text-theme-text-secondary hover:bg-black/5 rounded-full">
                    Test Latency
                </button>
            </div>
            <button onClick={() => onSelect(model.id)} className="px-6 py-3 bg-puter-blue text-white rounded-2xl hover:bg-blue-600 font-semibold transition-colors">
                Select Model
            </button>
        </footer>
      </div>
    </div>
  );
};
