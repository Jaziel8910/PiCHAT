
import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { PuterModel, ModelInfo } from '../types';
import { MODELS, MODEL_PROVIDERS } from '../types';
import { ChevronDownIcon, SearchIcon, CheckIcon } from './Icons';

interface AdvancedModelSelectorProps {
  selectedModel: PuterModel;
  onModelChange: (model: PuterModel) => void;
  disabled?: boolean;
}

export const AdvancedModelSelector: React.FC<AdvancedModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [showFreeOnly, setShowFreeOnly] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedModelInfo = useMemo(() => MODELS.find(m => m.id === selectedModel), [selectedModel]);

  const filteredModels = useMemo(() => {
    return MODELS.filter(model => {
      const matchesProvider = selectedProvider === 'All' || model.provider === selectedProvider;
      const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) || model.provider.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFree = !showFreeOnly || model.isFree;
      return matchesProvider && matchesSearch && matchesFree;
    });
  }, [searchTerm, selectedProvider, showFreeOnly]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const handleSelectModel = (model: ModelInfo) => {
    onModelChange(model.id);
    setIsOpen(false);
  };

  return (
    <div className="relative w-64" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between bg-puter-gray-700 text-white text-sm font-medium rounded-md py-2 pl-3 pr-2 focus:outline-none focus:ring-2 focus:ring-puter-blue disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="truncate">{selectedModelInfo?.provider} / {selectedModelInfo?.name}</span>
        <ChevronDownIcon className={`w-5 h-5 text-puter-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1 w-full md:w-96 bg-puter-gray-800 border border-puter-gray-700 rounded-md shadow-lg right-0">
            <div className='p-2 space-y-2 border-b border-puter-gray-700'>
                 <div className="relative">
                    <input
                    type="text"
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-puter-gray-900 text-puter-gray-300 rounded-md py-2 pl-8 pr-2 text-sm focus:ring-1 focus:ring-puter-blue focus:outline-none"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
                        <SearchIcon className="w-4 h-4 text-puter-gray-400" />
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="flex-1 appearance-none bg-puter-gray-700 text-white text-xs font-medium rounded-md py-1.5 pl-2 pr-8 focus:outline-none focus:ring-1 focus:ring-puter-blue cursor-pointer"
                    >
                        {MODEL_PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <label className='flex items-center gap-1.5 text-xs text-puter-gray-300 cursor-pointer'>
                        <input 
                            type="checkbox" 
                            checked={showFreeOnly}
                            onChange={(e) => setShowFreeOnly(e.target.checked)}
                            className='h-4 w-4 rounded bg-puter-gray-700 border-puter-gray-600 text-puter-blue focus:ring-puter-blue'
                        />
                        Free only
                    </label>
                </div>
            </div>
           
          <ul className="max-h-60 overflow-y-auto p-1">
            {filteredModels.map(model => (
              <li
                key={model.id}
                onClick={() => handleSelectModel(model)}
                className="flex items-center justify-between text-sm text-puter-gray-300 p-2 rounded-md hover:bg-puter-gray-700 cursor-pointer"
              >
                <div className='truncate'>
                    <span className='font-medium text-white'>{model.name}</span>
                    <span className='text-xs text-puter-gray-400 block'>{model.provider}</span>
                </div>
                <div className='flex items-center flex-shrink-0 ml-2'>
                    {model.isFree && <span className='text-xs font-semibold bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full'>Free</span>}
                    {model.id === selectedModel && <CheckIcon className="w-5 h-5 text-puter-blue ml-2" />}
                </div>
              </li>
            ))}
            {filteredModels.length === 0 && (
                <li className='text-center text-sm text-puter-gray-400 p-4'>No models found.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
