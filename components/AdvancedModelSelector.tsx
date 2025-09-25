import React, { useState, useMemo } from 'react';
import type { PuterModel, ModelInfo } from '../types';
import { MODELS } from '../types';
import { SearchIcon, XIcon, StarIcon, CheckIcon } from './Icons';
import * as Icons from './Icons';

interface ModelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: PuterModel;
  onModelChange: (model: PuterModel) => void;
  position?: 'top' | 'bottom';
}

const FILTER_TAGS = ['Recommended', 'All', 'Multimodal', 'Text', 'Image', 'Free'];

const ModelListItem: React.FC<{ model: ModelInfo, isSelected: boolean, onSelect: (id: string) => void }> = ({ model, isSelected, onSelect }) => {
    const ProviderIcon = Icons[model.providerIcon];
    return (
        <button
            onClick={() => onSelect(model.id)}
            className={`w-full flex items-center gap-3 text-left p-2 rounded-xl transition-colors ${isSelected ? 'bg-blue-500/10' : 'hover:bg-black/5'}`}
        >
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center bg-black/5 rounded-full">
                <ProviderIcon className="w-4 h-4 text-theme-text" />
            </div>
            <div className="flex-1 truncate">
                <h4 className={`font-medium text-sm truncate ${isSelected ? 'text-puter-blue' : 'text-theme-text'}`}>{model.name}</h4>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {model.isRecommended && <StarIcon className="w-3 h-3 text-yellow-500" title="Recommended"/>}
                {isSelected && <CheckIcon className="w-4 h-4 text-puter-blue" />}
            </div>
        </button>
    );
};


export const AdvancedModelSelector: React.FC<ModelManagerProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onModelChange,
  position = 'bottom',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Recommended');

  const filteredModels = useMemo(() => {
    return MODELS.filter(model => {
      if (model.isSupported === false) return false;
      
      const lowerSearch = searchTerm.toLowerCase();
      const matchesSearch = searchTerm ? (
          model.name.toLowerCase().includes(lowerSearch) ||
          model.provider.toLowerCase().includes(lowerSearch) ||
          model.tags?.some(tag => tag.toLowerCase().includes(lowerSearch))
        ) : true;

      if (!matchesSearch) return false;

      switch(activeFilter) {
          case 'Recommended': return model.isRecommended;
          case 'Free': return model.isFree;
          case 'Multimodal': return model.category === 'multimodal' || model.tags.includes('vision');
          case 'Text': return model.category === 'text' || model.category === 'deep-thought';
          case 'Image': return model.category === 'image';
          case 'All': return true;
          default: return true;
      }
    });
  }, [searchTerm, activeFilter]);
  
  if (!isOpen) return null;

  return (
    <div
      className={`absolute z-20 w-80 bg-theme-surface/95 backdrop-blur-2xl border border-theme-border rounded-3xl shadow-2xl flex flex-col max-h-[60vh] animate-[blur-in_0.2s_ease-out] ${
        position === 'bottom'
            ? 'top-full right-0 mt-2 origin-top-right'
            : 'bottom-full left-0 mb-2 origin-bottom-left'
      }`}
      onClick={e => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
        <div className="p-2 border-b border-black/10 flex-shrink-0">
            <div className="relative w-full mb-2">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-4 h-4 text-theme-text-secondary" />
                </div>
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/5 text-theme-text rounded-full py-1.5 pl-9 pr-4 text-sm focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent placeholder-theme-text-secondary"
                />
            </div>
            <div className="flex flex-wrap gap-1.5">
                {FILTER_TAGS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setActiveFilter(tag)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${activeFilter === tag ? 'bg-puter-blue text-white' : 'bg-black/5 text-theme-text-secondary hover:bg-black/10'}`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        </div>
        
        <main className="flex-1 overflow-y-auto p-2">
          {filteredModels.length > 0 ? (
              <div className="space-y-0.5">
                  {filteredModels.map(model => (
                      <ModelListItem
                          key={model.id}
                          model={model}
                          isSelected={selectedModel === model.id}
                          onSelect={onModelChange}
                      />
                  ))}
              </div>
          ) : (
               <div className='text-center text-theme-text-secondary p-4 h-full flex flex-col items-center justify-center'>
                  <p className='font-semibold'>No models found</p>
                  <p className="text-sm">Try a different filter.</p>
              </div>
          )}
        </main>
    </div>
  );
};
