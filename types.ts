
import { MODEL_IDS } from './models';

export type MessageRole = 'user' | 'assistant';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
}

export type PuterModel = string;

export interface ModelInfo {
  id: string;
  provider: string;
  name: string;
  isFree: boolean;
}

function parseModelId(id: string): ModelInfo {
  const isFree = id.endsWith(':free');
  const cleanId = isFree ? id.slice(0, -5) : id;
  
  let provider = 'Unknown';
  let name = cleanId;

  const parts = cleanId.split(/[:/]/);
  
  if (parts.length > 1) {
    if (parts[0] === 'openrouter') {
      provider = parts[1];
      name = parts.slice(2).join('/');
    } else {
      // Handles cases like 'mistralai/Mixtral-8x7B-Instruct-v0.1'
      const potentialProvider = parts[0];
      if (potentialProvider.length > 1 && !potentialProvider.includes(' ') && parts.length > 1) {
        provider = potentialProvider;
        name = parts.slice(1).join('/');
      }
    }
  }

  // Capitalize provider for display
  const displayProvider = provider.charAt(0).toUpperCase() + provider.slice(1);

  return { id, provider: displayProvider, name, isFree };
}

export const MODELS: ModelInfo[] = MODEL_IDS.map(parseModelId).sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name));

export const MODEL_PROVIDERS: string[] = ['All', ...Array.from(new Set(MODELS.map(m => m.provider))).sort()];


export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: PuterModel;
}
