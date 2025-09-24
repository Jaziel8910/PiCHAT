import React, { useState, useMemo, useEffect } from 'react';
import type { PuterModel, ModelInfo, ModelCategory } from '../types';
import { MODELS } from '../types';
import { SearchIcon, XIcon, StarIcon, BrainIcon, ImageIcon } from './Icons';
import { ModelDetailView } from './ModelDetailView';

interface ModelManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: PuterModel;
  onModelChange: (model: PuterModel) => void;
}

const CATEGORIES: { id: ModelCategory, name: string }[] = [
    { id: 'deep-thought', name: 'Deep Thought' },
    { id: 'multimodal', name: 'Multimodal' },
    { id: 'image', name: 'Image' },
    { id: 'text', name: 'Text' },
    { id: 'specialized', name: 'Specialized' },
];

const FilterCheckbox: React.FC<{id: string, label: string, checked: boolean, onChange: (checked: boolean) => void}> = ({ id, label, checked, onChange }) => (
    <label htmlFor={id} className="flex items-center space-x-2 cursor-pointer p-1.5 rounded-lg hover:bg-black/5">
        <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-puter-blue focus:ring-puter-blue"
        />
        <span className="text-sm text-theme-text-secondary">{label}</span>
    </label>
);

const initialFilters = {
    categories: new Set<ModelCategory>(),
    providers: new Set<string>(),
    tags: new Set<string>(),
    isRecommended: false,
    isFree: false,
};

const PromoBanners: React.FC<{ onBannerClick: (filters: any, searchTerm?: string) => void }> = ({ onBannerClick }) => {
    return (
        <div className="flex space-x-4 overflow-x-auto pb-4 -mx-6 px-6">
            <div className="flex-shrink-0 w-72 h-36 p-4 rounded-3xl flex flex-col justify-between text-white bg-gradient-to-br from-gray-800 to-black animate-blur-in">
                <div>
                    <h4 className="font-bold">The Future is Coming</h4>
                    <p className="text-xs opacity-80">Hypothetical models like GPT-5</p>
                </div>
                <span className="text-xs font-semibold self-start bg-white/20 px-2 py-0.5 rounded-full">Coming Soon</span>
            </div>
            <button onClick={() => onBannerClick({}, 'grok 4 fast')} className="flex-shrink-0 w-72 h-36 p-4 rounded-3xl flex flex-col justify-between text-left text-white bg-gradient-to-br from-blue-500 to-purple-600 animate-blur-in hover:scale-105 transition-transform" style={{animationDelay: '100ms'}}>
                <div>
                    <h4 className="font-bold">Model of the Day: Grok 4 Fast</h4>
                    <p className="text-xs opacity-80">Blazing fast & free for real-time chat.</p>
                </div>
                <span className="text-xs font-semibold self-start bg-white/20 px-2 py-0.5 rounded-full">Try Now</span>
            </button>
            <button onClick={() => onBannerClick({})} className="flex-shrink-0 w-72 h-36 p-4 rounded-3xl flex flex-col justify-between text-left text-theme-text bg-gradient-to-br from-yellow-300 to-orange-400 animate-blur-in hover:scale-105 transition-transform" style={{animationDelay: '200ms'}}>
                <div>
                    <h4 className="font-bold">Explore & Discover</h4>
                    <p className="text-xs opacity-80">Tired of the same old AI? Find powerful new models.</p>
                </div>
                <span className="text-xs font-semibold self-start bg-black/10 px-2 py-0.5 rounded-full">Dive In</span>
            </button>
             <button onClick={() => onBannerClick({ categories: new Set(['deep-thought']) })} className="flex-shrink-0 w-72 h-36 p-4 rounded-3xl flex flex-col justify-between text-left text-white bg-gradient-to-br from-red-500 to-red-800 animate-blur-in hover:scale-105 transition-transform" style={{animationDelay: '300ms'}}>
                <div>
                    <h4 className="font-bold">For Complex Problems</h4>
                    <p className="text-xs opacity-80">Unleash Deep Thought models like Claude 4.1 Opus.</p>
                </div>
                <div className="self-start flex items-center gap-1 text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full"><BrainIcon className="w-3 h-3"/> Deep Thought</div>
            </button>
             <button onClick={() => onBannerClick({ categories: new Set(['multimodal']) })} className="flex-shrink-0 w-72 h-36 p-4 rounded-3xl flex flex-col justify-between text-left text-white bg-gradient-to-br from-teal-500 to-cyan-700 animate-blur-in hover:scale-105 transition-transform" style={{animationDelay: '400ms'}}>
                <div>
                    <h4 className="font-bold">Go Beyond Text</h4>
                    <p className="text-xs opacity-80">Analyze images with powerful vision-enabled models.</p>
                </div>
                <div className="self-start flex items-center gap-1 text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full"><ImageIcon className="w-3 h-3"/> Multimodal</div>
            </button>
            <button onClick={() => onBannerClick({ isFree: true })} className="flex-shrink-0 w-72 h-36 p-4 rounded-3xl flex flex-col justify-between text-left text-white bg-gradient-to-br from-green-500 to-blue-500 animate-blur-in hover:scale-105 transition-transform" style={{animationDelay: '500ms'}}>
                <div>
                    <h4 className="font-bold">Powerful & Free</h4>
                    <p className="text-xs opacity-80">Get started with top-tier models at no cost.</p>
                </div>
                <span className="text-xs font-semibold self-start bg-white/20 px-2 py-0.5 rounded-full">Free Tier</span>
            </button>
        </div>
    );
};

export const AdvancedModelSelector: React.FC<ModelManagerProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onModelChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [viewingModel, setViewingModel] = useState<ModelInfo | null>(null);

  const { providers, tags } = useMemo(() => {
    const providerSet = new Set<string>();
    const tagSet = new Set<string>();
    MODELS.forEach(model => {
      providerSet.add(model.provider);
      model.tags.forEach(tag => tagSet.add(tag));
    });
    return {
      providers: Array.from(providerSet).sort(),
      tags: Array.from(tagSet).sort(),
    };
  }, []);

  const filteredModels = useMemo(() => {
    return MODELS.filter(model => {
      if (model.isSupported === false) return false;
      if (filters.isRecommended && !model.isRecommended) return false;
      if (filters.isFree && !model.isFree) return false;
      if (filters.categories.size > 0 && !filters.categories.has(model.category)) return false;
      if (filters.providers.size > 0 && !filters.providers.has(model.provider)) return false;
      if (filters.tags.size > 0 && ![...filters.tags].every(tag => model.tags.includes(tag))) return false;

      const lowerSearch = searchTerm.toLowerCase();
      if (searchTerm && !(
          model.name.toLowerCase().includes(lowerSearch) ||
          model.provider.toLowerCase().includes(lowerSearch) ||
          model.description?.toLowerCase().includes(lowerSearch) ||
          model.tags?.some(tag => tag.toLowerCase().includes(lowerSearch))
        )) {
        return false;
      }
      return true;
    });
  }, [searchTerm, filters]);

  const groupedModels = useMemo(() => {
    return CATEGORIES.map(category => ({
        ...category,
        models: filteredModels.filter(m => m.category === category.id)
    })).filter(group => group.models.length > 0);
  }, [filteredModels]);

  const handleFilterChange = <K extends keyof typeof filters>(key: K, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSetChange = (key: 'categories' | 'providers' | 'tags', item: string) => {
    setFilters(prev => {
        const newSet = new Set(prev[key]);
        if (newSet.has(item)) {
            newSet.delete(item);
        } else {
            newSet.add(item);
        }
        return { ...prev, [key]: newSet };
    });
  };
  
  const handleBannerClick = (filtersToApply: Partial<typeof filters>, newSearchTerm: string = '') => {
    setFilters({ ...initialFilters, ...filtersToApply });
    setSearchTerm(newSearchTerm);
  }

  if (!isOpen) {
    return null;
  }

  const handleSelectModel = (modelId: string) => {
    onModelChange(modelId);
  };

  return (
    <>
      {viewingModel && (
        <ModelDetailView 
            model={viewingModel}
            onClose={() => setViewingModel(null)}
            onSelect={(modelId) => {
                handleSelectModel(modelId);
                setViewingModel(null);
                onClose();
            }}
        />
      )}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
        <div 
          className="bg-theme-surface/90 backdrop-blur-2xl border border-theme-border rounded-4xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col overflow-hidden animate-blur-in" 
          onClick={e => e.stopPropagation()}
        >
          <header className="flex items-center justify-between p-4 border-b border-black/10 flex-shrink-0">
            <h2 className="text-xl font-bold text-theme-text">Model Explorer</h2>
             <div className="relative flex-1 max-w-xl mx-8">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="w-5 h-5 text-theme-text-secondary" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name, provider, or tag (e.g., 'vision', 'coding', 'fast')..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/5 text-theme-text rounded-2xl py-2.5 pl-10 pr-4 text-base focus:ring-2 focus:ring-puter-blue focus:outline-none border-transparent placeholder-theme-text-secondary"
                />
            </div>
            <button onClick={onClose} className="p-1 text-theme-text-secondary rounded-full hover:bg-black/5 hover:text-theme-text" aria-label="Close">
                <XIcon className="w-6 h-6" />
            </button>
          </header>
          
          <div className="flex flex-1 overflow-hidden">
              <aside className="w-64 border-r border-black/10 p-4 overflow-y-auto space-y-4">
                  <details className="space-y-2" open>
                      <summary className="font-semibold text-theme-text cursor-pointer list-none flex items-center justify-between">Special</summary>
                      <FilterCheckbox id="filter-recommended" label="Recommended" checked={filters.isRecommended} onChange={c => handleFilterChange('isRecommended', c)} />
                      <FilterCheckbox id="filter-free" label="Free" checked={filters.isFree} onChange={c => handleFilterChange('isFree', c)} />
                  </details>
                  <details className="space-y-2" open>
                      <summary className="font-semibold text-theme-text cursor-pointer list-none flex items-center justify-between">Category</summary>
                      {CATEGORIES.map(cat => <FilterCheckbox key={cat.id} id={`cat-${cat.id}`} label={cat.name} checked={filters.categories.has(cat.id)} onChange={() => handleSetChange('categories', cat.id)} />)}
                  </details>
                   <details className="space-y-2">
                      <summary className="font-semibold text-theme-text cursor-pointer list-none flex items-center justify-between">Provider</summary>
                      {providers.map(p => <FilterCheckbox key={p} id={`prov-${p}`} label={p} checked={filters.providers.has(p)} onChange={() => handleSetChange('providers', p)} />)}
                  </details>
                  <details className="space-y-2">
                      <summary className="font-semibold text-theme-text cursor-pointer list-none flex items-center justify-between">Tags</summary>
                      {tags.map(t => <FilterCheckbox key={t} id={`tag-${t}`} label={t} checked={filters.tags.has(t)} onChange={() => handleSetChange('tags', t)} />)}
                  </details>
              </aside>
              <main className="flex-1 overflow-y-auto p-6">
                  <PromoBanners onBannerClick={handleBannerClick} />
                  {groupedModels.length > 0 ? (
                      <div className="space-y-8 mt-6">
                          {groupedModels.map(group => (
                               <section key={group.id}>
                                  <h3 className="text-lg font-bold text-theme-text mb-4">{group.name}</h3>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                                      {group.models.map(model => (
                                          <div
                                              key={model.id}
                                              onClick={() => handleSelectModel(model.id)}
                                              className={`relative flex flex-col p-4 rounded-3xl border-2 transition-all duration-200 cursor-pointer group ${selectedModel === model.id ? 'bg-blue-500/10 border-puter-blue shadow-lg shadow-blue-500/10' : 'bg-black/5 border-transparent hover:border-black/10'}`}
                                          >
                                              {model.isLegacy && <div className="absolute top-2 right-2 text-xs font-semibold bg-gray-500/20 text-gray-700 px-1.5 py-0.5 rounded-full">Legacy</div>}
                                              <div className='flex items-start justify-between'>
                                                  <div className="flex-1 truncate pr-2">
                                                      <div className="flex items-center gap-1.5">
                                                          {model.isRecommended && <StarIcon className="w-4 h-4 text-yellow-500 flex-shrink-0" title="Recommended"/>}
                                                          <h4 className="font-semibold text-theme-text truncate">{model.name}</h4>
                                                      </div>
                                                      <p className="text-xs text-theme-text-secondary truncate">{model.provider}</p>
                                                  </div>
                                                  {model.isFree && <span className='text-xs font-semibold bg-green-500/20 text-green-700 px-1.5 py-0.5 rounded-full flex-shrink-0'>Free</span>}
                                              </div>

                                              <p className="text-xs text-theme-text-secondary mt-2 flex-1 line-clamp-3 min-h-[45px]">{model.description}</p>
                                              
                                              <div className="flex items-center justify-between mt-3">
                                                  <div className="flex items-center gap-1.5 flex-wrap">
                                                      {model.contextLength && <span className='text-xs font-mono bg-black/10 text-theme-text-secondary px-1.5 py-0.5 rounded-full'>{Math.round(model.contextLength / 1000)}k</span>}
                                                      {model.tags?.slice(0, 2).map(tag => (
                                                          <span key={tag} className='text-xs font-medium bg-black/10 text-theme-text-secondary px-1.5 py-0.5 rounded-full'>{tag}</span>
                                                      ))}
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                      <button onClick={(e) => { e.stopPropagation(); setViewingModel(model); }} className="text-xs font-semibold px-2 py-1 rounded-full bg-black/10 text-theme-text-secondary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/20">
                                                          Info
                                                      </button>
                                                      <button onClick={(e) => { e.stopPropagation(); handleSelectModel(model.id); }} className={`text-sm font-semibold px-3 py-1 rounded-full ${selectedModel === model.id ? 'bg-puter-blue text-white' : 'bg-black/10 text-theme-text-secondary'}`}>
                                                          {selectedModel === model.id ? 'Selected' : 'Select'}
                                                      </button>
                                                  </div>
                                              </div>
                                          </div>
                                      ))}
                                  </div>
                               </section>
                          ))}
                      </div>
                  ) : (
                      <div className='text-center text-sm text-theme-text-secondary p-4 col-span-full h-full flex flex-col items-center justify-center'>
                          <p className='text-lg font-semibold'>No models found</p>
                          <p>Try adjusting your search or filters.</p>
                      </div>
                  )}
              </main>
          </div>
        </div>
      </div>
    </>
  );
};