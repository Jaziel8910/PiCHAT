import React, { useState } from 'react';
import type { AppSettings } from '../types';
import { XIcon, SunIcon, MoonIcon, DesktopIcon, UploadCloudIcon, DownloadCloudIcon, TrashIcon } from './Icons';

interface SettingsPageProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
  onExport: () => void;
  onImport: () => void;
  onClearAllData: () => void;
}

type SettingsSection = 'appearance' | 'data' | 'defaults' | 'about';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onExport,
  onImport,
  onClearAllData
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('appearance');
  
  const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };
  
  const renderSection = () => {
    switch(activeSection) {
        case 'appearance':
            return (
                <div>
                    <h3 className="text-lg font-semibold text-theme-text mb-4">Appearance</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-theme-text">Theme</label>
                            <p className="text-xs text-theme-text-secondary mb-2">Choose how PiChat looks.</p>
                            <div className="flex gap-2">
                                {(['light', 'dark', 'system'] as const).map(theme => {
                                    const Icon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : DesktopIcon;
                                    const isActive = settings.theme === theme;
                                    return (
                                        <button key={theme} onClick={() => handleSettingChange('theme', theme)} className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl transition-colors ${isActive ? 'bg-puter-blue text-white' : 'bg-black/5 hover:bg-black/10'}`}>
                                            <Icon className="w-5 h-5" />
                                            <span className="capitalize text-sm font-medium">{theme}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                         <div>
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <p className="text-sm font-medium text-theme-text">Collapse sidebar by default</p>
                                    <p className="text-xs text-theme-text-secondary">New sessions will start with a collapsed sidebar.</p>
                                </div>
                                <div className={`relative w-11 h-6 rounded-full transition-colors ${settings.defaultSidebarCollapsed ? 'bg-puter-blue' : 'bg-black/10'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.defaultSidebarCollapsed ? 'translate-x-5' : 'translate-x-0'}`} />
                                    <input type="checkbox" className="opacity-0 w-0 h-0" checked={settings.defaultSidebarCollapsed} onChange={e => handleSettingChange('defaultSidebarCollapsed', e.target.checked)} />
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )
        case 'data':
            return (
                <div>
                    <h3 className="text-lg font-semibold text-theme-text mb-4">Data Management</h3>
                    <div className="space-y-4">
                        <button onClick={onExport} className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/5 hover:bg-black/10">
                            <DownloadCloudIcon className="w-5 h-5 text-puter-blue" />
                            <div>
                                <p className="text-sm font-medium text-theme-text text-left">Export Data</p>
                                <p className="text-xs text-theme-text-secondary text-left">Save all conversations and custom personas to a JSON file.</p>
                            </div>
                        </button>
                        <button onClick={onImport} className="w-full flex items-center gap-3 p-3 rounded-xl bg-black/5 hover:bg-black/10">
                            <UploadCloudIcon className="w-5 h-5 text-puter-blue" />
                             <div>
                                <p className="text-sm font-medium text-theme-text text-left">Import Data</p>
                                <p className="text-xs text-theme-text-secondary text-left">Load conversations and personas from an export file. This will overwrite existing data.</p>
                            </div>
                        </button>
                         <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5">
                            <button onClick={onClearAllData} className="w-full flex items-center gap-3">
                                <TrashIcon className="w-5 h-5 text-red-500" />
                                 <div>
                                    <p className="text-sm font-medium text-red-500 text-left">Clear All Data</p>
                                    <p className="text-xs text-red-500/80 text-left">Permanently delete all conversations and custom personas from this app.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )
        case 'defaults':
            return (
                 <div>
                    <h3 className="text-lg font-semibold text-theme-text mb-4">New Chat Defaults</h3>
                    <p className="text-xs text-theme-text-secondary mb-4">Set the default parameters for any new conversations you create.</p>
                    <div className="space-y-6">
                        <div>
                           <label className="block text-sm font-medium text-theme-text">Default Creativity (temperature)</label>
                           <p className="text-xs text-theme-text-secondary mb-2">Controls the randomness of the model's responses.</p>
                           <div className="flex items-center gap-2">
                            <input
                                type="range"
                                min="0" max="2" step="0.1"
                                value={settings.defaultTemperature}
                                onChange={(e) => handleSettingChange('defaultTemperature', parseFloat(e.target.value))}
                                className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer"
                            />
                            <span className="text-sm font-mono text-theme-text w-10 text-center">{settings.defaultTemperature.toFixed(1)}</span>
                           </div>
                       </div>
                        <div>
                           <label htmlFor="default-max-tokens" className="block text-sm font-medium text-theme-text">Default Max Response Length (tokens)</label>
                           <p className="text-xs text-theme-text-secondary mb-2">The maximum number of tokens to generate in the response.</p>
                           <input
                                id="default-max-tokens"
                                type="number"
                                value={settings.defaultMaxTokens}
                                onChange={(e) => handleSettingChange('defaultMaxTokens', parseInt(e.target.value, 10))}
                                className="w-full mt-1 bg-black/5 text-theme-text rounded-2xl p-2 text-sm focus:ring-1 focus:ring-puter-blue focus:outline-none border-transparent"
                            />
                        </div>
                    </div>
                </div>
            )
        case 'about':
             return (
                <div>
                    <h3 className="text-lg font-semibold text-theme-text mb-4">About PiChat</h3>
                    <div className="space-y-2 text-sm text-theme-text-secondary">
                        <p><strong className="text-theme-text">Version:</strong> 1.2.0</p>
                        <p>A minimalist, animated chatbot interface designed for performance and a great user experience.</p>
                        <p>Powered by the <strong className="text-theme-text">Puter.js SDK</strong>, enabling seamless integration with the Puter cloud operating system.</p>
                    </div>
                </div>
            )
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-theme-surface/90 backdrop-blur-2xl border border-theme-border rounded-4xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <header className="flex items-center justify-between p-4 border-b border-black/10 flex-shrink-0">
          <h2 className="text-xl font-bold text-theme-text">Settings</h2>
          <button onClick={onClose} className="p-1 text-theme-text-secondary rounded-full hover:bg-black/5 hover:text-theme-text" aria-label="Close">
            <XIcon className="w-6 h-6" />
          </button>
        </header>
        <div className="flex flex-1 overflow-hidden">
            <aside className="w-56 border-r border-black/10 p-4">
                <nav className="space-y-1">
                    {(['appearance', 'defaults', 'data', 'about'] as const).map(section => (
                        <button key={section} onClick={() => setActiveSection(section)} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeSection === section ? 'bg-black/10 text-theme-text' : 'text-theme-text-secondary hover:bg-black/5'}`}>
                            <span className="capitalize">{section}</span>
                        </button>
                    ))}
                </nav>
            </aside>
            <main className="flex-1 p-6 overflow-y-auto">
                {renderSection()}
            </main>
        </div>
      </div>
    </div>
  );
};