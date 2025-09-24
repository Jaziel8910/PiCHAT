import React, { useState, useMemo } from 'react';
import { PERSONAS, Persona } from '../personas';
import * as Icons from './Icons';
import { MODELS } from '../types';

type IconName = keyof typeof Icons;
const ALL_ICONS: IconName[] = Object.keys(Icons) as IconName[];

const getIconComponent = (iconName: IconName) => {
    return Icons[iconName] || Icons.BrainIcon;
}

interface PersonaManagerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPersonaId: string;
  onPersonaSelect: (persona: Persona) => void;
  customPersonas: Persona[];
  onUpdateCustomPersonas: (personas: Persona[]) => void;
  disabled?: boolean;
}

interface PersonaFormState {
  id?: string;
  name: string;
  prompt: string;
  icon: IconName;
  starModel: string;
}

export const PersonaManager: React.FC<PersonaManagerProps> = ({
  isOpen,
  onClose,
  selectedPersonaId,
  onPersonaSelect,
  customPersonas,
  onUpdateCustomPersonas,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'featured' | 'custom'>('featured');
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingPersona, setEditingPersona] = useState<PersonaFormState | null>(null);

  const allPersonas = useMemo(() => [...PERSONAS, ...customPersonas], [customPersonas]);

  const handleSelectPersona = (persona: Persona) => {
    if (disabled) return;
    onPersonaSelect(persona);
    onClose();
  };

  const handleAddNew = () => {
    setEditingPersona({ name: '', prompt: '', icon: 'SmileIcon', starModel: 'gpt-4o' });
    setView('form');
  }
  
  const handleEdit = (persona: Persona) => {
    setEditingPersona({ ...persona, icon: persona.icon as IconName });
    setView('form');
  }

  const handleDelete = (personaId: string) => {
    if (window.confirm('Are you sure you want to delete this persona?')) {
        const updated = customPersonas.filter(p => p.id !== personaId);
        onUpdateCustomPersonas(updated);
    }
  }

  const handleSave = () => {
    if (!editingPersona || !editingPersona.name || !editingPersona.prompt) {
        alert("Please fill in all fields.");
        return;
    }

    const isEditing = !!editingPersona.id;
    let updated: Persona[];

    if (isEditing) {
        updated = customPersonas.map(p => p.id === editingPersona.id ? { ...editingPersona, isCustom: true } as Persona : p);
    } else {
        const newPersona: Persona = {
            ...editingPersona,
            id: `custom-${Date.now()}`,
            isCustom: true,
        };
        updated = [...customPersonas, newPersona];
    }
    
    onUpdateCustomPersonas(updated);
    setView('list');
    setEditingPersona(null);
  }

  if (!isOpen) return null;

  const renderPersonaCard = (persona: Persona) => {
    const IconComponent = getIconComponent(persona.icon as IconName);
    const isSelected = selectedPersonaId === persona.id;

    return (
      <button
        key={persona.id}
        onClick={() => handleSelectPersona(persona)}
        disabled={disabled}
        className={`relative group p-4 rounded-3xl border-2 transition-all duration-200 text-left w-full ${isSelected ? 'bg-blue-500/10 border-puter-blue' : 'bg-black/5 border-transparent hover:border-black/10'} disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-3">
          <div className="bg-white/50 p-2 rounded-full"><IconComponent className="w-5 h-5 text-theme-text" /></div>
          <h4 className="font-semibold text-theme-text truncate">{persona.name}</h4>
        </div>
        <p className="text-xs text-theme-text-secondary mt-2 line-clamp-2">{persona.prompt}</p>
        {persona.isCustom && view === 'list' && (
             <div className="absolute top-2 right-2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={(e) => { e.stopPropagation(); handleEdit(persona); }} className="p-1.5 text-theme-text-secondary hover:text-theme-text"><Icons.EditIcon className="w-3 h-3"/></button>
                <button onClick={(e) => { e.stopPropagation(); handleDelete(persona.id); }} className="p-1.5 text-theme-text-secondary hover:text-red-500"><Icons.TrashIcon className="w-3 h-3"/></button>
            </div>
        )}
      </button>
    );
  };
  
  const renderForm = () => {
    if (!editingPersona) return null;
    return (
        <div className="p-6">
            <button onClick={() => setView('list')} className="flex items-center gap-2 mb-4 text-sm font-medium text-theme-text-secondary hover:text-theme-text">
                <Icons.ArrowLeftIcon className="w-4 h-4" />
                Back to Personas
            </button>
            <h2 className="text-xl font-bold mb-4">{editingPersona.id ? 'Edit Persona' : 'Create New Persona'}</h2>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">Name</label>
                    <input type="text" value={editingPersona.name} onChange={e => setEditingPersona({...editingPersona, name: e.target.value})} className="w-full bg-black/5 text-theme-text rounded-2xl p-2 focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-theme-text mb-1">System Prompt</label>
                    <textarea value={editingPersona.prompt} onChange={e => setEditingPersona({...editingPersona, prompt: e.target.value})} rows={4} className="w-full bg-black/5 text-theme-text rounded-2xl p-2 focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent resize-y" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-theme-text mb-1">Icon</label>
                         <select value={editingPersona.icon} onChange={e => setEditingPersona({...editingPersona, icon: e.target.value as IconName})} className="w-full appearance-none bg-black/5 text-theme-text rounded-2xl p-2 focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent">
                            {ALL_ICONS.map(name => <option key={name} value={name}>{name.replace('Icon', '')}</option>)}
                         </select>
                     </div>
                      <div>
                        <label className="block text-sm font-medium text-theme-text mb-1">Star Model</label>
                         <select value={editingPersona.starModel} onChange={e => setEditingPersona({...editingPersona, starModel: e.target.value})} className="w-full appearance-none bg-black/5 text-theme-text rounded-2xl p-2 focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent">
                            {MODELS.filter(m => m.isSupported).map(model => <option key={model.id} value={model.id}>{model.provider} / {model.name}</option>)}
                         </select>
                     </div>
                 </div>
                 <div className="flex justify-end">
                    <button onClick={handleSave} className="px-4 py-2 bg-puter-blue text-white rounded-2xl hover:bg-blue-600 transition-colors">Save Persona</button>
                 </div>
            </div>
        </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-theme-surface/90 backdrop-blur-2xl border border-theme-border rounded-4xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {view === 'list' ? (
          <>
            <header className="flex items-center justify-between p-4 border-b border-black/10 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <button onClick={() => setActiveTab('featured')} className={`px-3 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'featured' ? 'bg-puter-blue text-white' : 'text-theme-text-secondary hover:bg-black/5'}`}>Featured</button>
                    <button onClick={() => setActiveTab('custom')} className={`px-3 py-1.5 text-sm font-semibold rounded-full ${activeTab === 'custom' ? 'bg-puter-blue text-white' : 'text-theme-text-secondary hover:bg-black/5'}`}>My Personas ({customPersonas.length})</button>
                </div>
                 <button onClick={onClose} className="p-1 text-theme-text-secondary rounded-full hover:bg-black/5 hover:text-theme-text" aria-label="Close">
                    <Icons.XIcon className="w-6 h-6" />
                </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'featured' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {PERSONAS.map(renderPersonaCard)}
                  </div>
              ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customPersonas.map(renderPersonaCard)}
                         <button onClick={handleAddNew} className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-dashed border-black/10 hover:border-puter-blue hover:bg-blue-500/5 transition-colors text-theme-text-secondary">
                            <Icons.PlusIcon className="w-8 h-8 mb-2"/>
                            <span className="font-semibold text-theme-text">Create New Persona</span>
                        </button>
                    </div>
                   
                </>
              )}
            </div>
          </>
        ) : (
           renderForm()
        )}
      </div>
    </div>
  );
};