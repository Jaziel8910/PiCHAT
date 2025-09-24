import { MODEL_IDS } from './models';
import * as Icons from './components/Icons';

export type MessageRole = 'user' | 'assistant';
export type IconName = keyof typeof Icons;

export interface Message {
  id: string;
  role: MessageRole;
  content: string; // The text part of the message
  attachments?: {
    puter_path: string;
    preview_url: string; // For rendering in the UI before it's sent
  }[];
  imageUrl?: string; // For image generation
  isGenerating?: boolean; // For image generation loading state
  isStreaming?: boolean; // For text streaming state
  thinkingContent?: string; // For model's thought process
  isCurrentlyThinking?: boolean; // To know if the model is in a think block
}

export type PuterModel = string;

export type ImageGenerationModel = 'gpt-image-1' | 'dall-e-3' | 'gemini-2.5-flash-image-preview';

export interface GenerateImageOptions {
  prompt: string;
  model: ImageGenerationModel;
  quality?: 'low' | 'medium' | 'high' | 'standard' | 'hd';
  input_image?: string; // base64
  input_image_mime_type?: string;
}


export type ModelCategory = 'multimodal' | 'image' | 'text' | 'specialized' | 'deep-thought';

export interface ModelInfo {
  id: string;
  provider: string;
  providerIcon: IconName;
  name: string;
  isFree: boolean;
  description?: string;
  contextLength?: number;
  isRecommended?: boolean;
  isLegacy?: boolean;
  isSupported?: boolean;
  category: ModelCategory;
  tags: string[];
}

const MODEL_METADATA: Record<string, Partial<Omit<ModelInfo, 'id' | 'provider' | 'isFree' | 'providerIcon'>>> = {
    // Hypothetical / Unsupported
    'gpt-5': { name: 'GPT-5 (Hypothetical)', isSupported: false, description: 'This model is hypothetical and not yet available.' },
    'gpt-5-mini': { name: 'GPT-5 Mini (Hypothetical)', isSupported: false, description: 'This model is hypothetical and not yet available.' },
    'gpt-5-nano': { name: 'GPT-5 Nano (Hypothetical)', isSupported: false, description: 'This model is hypothetical and not yet available.' },
    'gpt-5-chat-latest': { name: 'GPT-5 Chat (Hypothetical)', isSupported: false, description: 'This model is hypothetical and not yet available.' },
    'gpt-5-2025-08-07': { name: 'GPT-5 (Hypothetical)', isSupported: false, description: 'This model is hypothetical and not yet available.' },
    'gpt-5-mini-2025-08-07': { name: 'GPT-5 Mini (Hypothetical)', isSupported: false, description: 'This model is hypothetical and not yet available.' },
    'gpt-5-nano-2025-08-07': { name: 'GPT-5 Nano (Hypothetical)', isSupported: false, description: 'This model is hypothetical and not yet available.' },
    'o1': { name: 'O1', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'o1-mini': { name: 'O1-Mini', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'o1-pro': { name: "O1-Pro", description: "OpenAI's new flagship model for advanced reasoning, instruction following, and complex problem-solving. NOTE: Currently not supported by the chat API.", isRecommended: true, contextLength: 256000, category: 'deep-thought', tags: ['reasoning', 'powerful', 'openai'], isSupported: false },
    'o3': { name: 'O3', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'o3-mini': { name: 'O3-Mini', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'o4-mini': { name: 'O4-Mini', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'openrouter:openai/o1': { name: 'O1', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'openrouter:openai/o1-mini': { name: 'O1-Mini', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'openrouter:openai/o1-pro': { name: 'O1-Pro', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'openrouter:openai/o3': { name: 'O3', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'openrouter:openai/o3-mini': { name: 'O3-Mini', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'openrouter:openai/o3-pro': { name: 'O3-Pro', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'openrouter:openai/o4-mini': { name: 'O4-Mini', isSupported: false, description: 'This model is currently not supported by the chat API.' },
    'gpt-4.5-preview': { name: 'GPT-4.5 Preview (Unsupported)', isSupported: false, description: 'This model is currently not supported by the chat API.' },

    // Recommended & Popular
    'gpt-4o': { name: "GPT-4o", description: "OpenAI's flagship multimodal model, balancing speed, intelligence, and vision capabilities.", isRecommended: true, contextLength: 128000, category: 'multimodal', tags: ['vision', 'fast', 'powerful', 'openai'] },
    'claude-opus-4-1': { name: "Claude 4.1 Opus", description: "Anthropic's most powerful model for complex analysis, long documents, and demanding tasks.", isRecommended: true, contextLength: 200000, category: 'deep-thought', tags: ['vision', 'writing', 'analysis', 'anthropic', 'reasoning'] },
    'openrouter:google/gemini-2.5-pro': { name: "Gemini 2.5 Pro", description: "Google's next-generation model for large-scale multimodal reasoning and long context understanding.", isRecommended: true, contextLength: 1000000, category: 'multimodal', tags: ['vision', 'long context', 'google'] },
    'claude-3-5-sonnet-20240620': { name: "Claude 3.5 Sonnet", description: "Anthropic's fastest and most balanced model, ideal for enterprise workloads and most everyday tasks.", isRecommended: true, contextLength: 200000, category: 'multimodal', tags: ['vision', 'fast', 'balanced', 'anthropic'] },
    'mistral-large-latest': { name: "Mistral Large", description: "Mistral's top-tier model, excellent for complex multilingual tasks and reasoning.", contextLength: 32000, category: 'text', tags: ['multilingual', 'reasoning', 'mistral'], isRecommended: true },
    'openrouter:x-ai/grok-4': { name: 'Grok 4', description: "xAI's latest frontier model, offering powerful reasoning and efficiency for a wide range of complex tasks.", isRecommended: true, contextLength: 128000, category: 'deep-thought', tags: ['reasoning', 'powerful', 'grok'] },
    'openrouter:x-ai/grok-4-fast:free': { name: 'Grok 4 Fast (Free)', description: "A free, high-speed version of xAI's powerful Grok 4 model, perfect for real-time conversation.", isRecommended: true, category: 'text', tags: ['fast', 'reasoning', 'grok', 'free'] },
    
    // Deep Thought
    'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo': { name: 'Llama 3.1 405B Instruct', description: 'Meta\'s largest and most capable model for deep, complex reasoning and generation.', category: 'deep-thought', tags: ['reasoning', 'powerful', 'meta', 'llama'], contextLength: 128000, isRecommended: true },

    // Image Generation
    'dall-e-3': { name: 'DALL-E 3', description: 'OpenAI\'s high-quality image generation model, great for complex and detailed scenes.', category: 'image', tags: ['image generation', 'openai', 'high quality'], isRecommended: true },
    'gpt-image-1': { name: 'GPT Image 1', description: 'A fast and versatile image generation model from OpenAI.', category: 'image', tags: ['image generation', 'fast', 'openai'] },
    'openrouter:google/gemini-2.5-flash-image-preview': { name: 'Nano Banana', description: "Google's nimble model for quick and creative image editing and manipulation tasks (image-to-image).", category: 'image', tags: ['image editing', 'vision', 'google', 'fast'], isRecommended: true },

    // Multimodal
    'gpt-4o-mini': { name: "GPT-4o mini", description: "A smaller, faster, and more affordable version of GPT-4o with multimodal capabilities.", category: 'multimodal', tags: ['vision', 'fast', 'openai'] },
    'gemini-1.5-flash': { name: "Gemini 1.5 Flash", description: "A lightweight, fast and cost-efficient multimodal model from Google.", category: 'multimodal', tags: ['vision', 'fast', 'google'] },
    'Qwen/Qwen2.5-VL-72B-Instruct': { name: 'Qwen 2.5 VL Instruct', description: 'A powerful vision-language model from Alibaba for understanding image content.', category: 'multimodal', tags: ['vision', 'qwen'] },
    'grok-vision-beta': { name: 'Grok Vision', description: 'The multimodal version of xAI\'s Grok, capable of processing visual information.', category: 'multimodal', tags: ['vision', 'grok'] },
    'meta-llama/Llama-3.2-90b-vision-instruct': { name: 'Llama 3.2 90B Vision', description: 'Meta\'s large-scale vision model for advanced image understanding.', category: 'multimodal', tags: ['vision', 'meta', 'llama'] },

    // Specialized - Audio
    'openai/whisper-large-v3': { name: 'Whisper Large v3', description: 'State-of-the-art audio transcription model from OpenAI. Converts speech to text.', category: 'specialized', tags: ['audio', 'transcription', 'speech-to-text'] },
    'cartesia/sonic': { name: 'Cartesia Sonic', description: 'A model for generating realistic human-like audio from text.', category: 'specialized', tags: ['audio', 'tts', 'text-to-speech'] },

    // Specialized - Code
    'codestral-latest': { name: 'Codestral', description: 'Mistral\'s flagship model specialized in code generation, completion, and explanation.', category: 'specialized', tags: ['code', 'programming', 'mistral'], isRecommended: true },
    'arcee-ai/coder-large': { name: 'Arcee Coder Large', description: 'A large model from Arcee.ai focused on high-quality code generation.', category: 'specialized', tags: ['code', 'programming'] },
    'Qwen/Qwen2.5-Coder-32B-Instruct': { name: 'Qwen 2.5 Coder 32B', description: 'A 32B parameter coding model from Alibaba.', category: 'specialized', tags: ['code', 'programming', 'qwen'] },

    // Specialized - Moderation
    'meta-llama/Llama-Guard-4-12B': { name: 'Llama Guard 4', description: 'Meta\'s model for content moderation and safety classification.', category: 'specialized', tags: ['moderation', 'safety', 'guard', 'meta'] },
    'mistral-moderation-latest': { name: 'Mistral Moderation', description: 'A specialized model from Mistral for content safety and moderation.', category: 'specialized', tags: ['moderation', 'safety', 'mistral'] },

    // Legacy Models
    'gpt-4-turbo-preview': { name: 'GPT-4 Turbo', description: "Legacy. The preview version of OpenAI's GPT-4 Turbo model, offering a large context window and strong performance.", isLegacy: true, contextLength: 128000, category: 'text', tags: ['legacy', 'powerful', 'openai'] },
    'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', description: 'Legacy. A fast and affordable model from OpenAI, suitable for a wide range of general tasks.', isLegacy: true, contextLength: 16000, category: 'text', tags: ['legacy', 'fast', 'openai'] },
    'openrouter:anthropic/claude-3-opus': { name: 'Claude 3 Opus', description: "Legacy. Anthropic's powerful model for complex tasks, preceding the 4.1 release.", isLegacy: true, contextLength: 200000, category: 'multimodal', tags: ['legacy', 'vision', 'writing', 'analysis', 'anthropic'] },
    'openrouter:anthropic/claude-3-sonnet': { name: 'Claude 3 Sonnet', description: 'Legacy. A balanced model from Anthropic, a precursor to the 3.5 version.', isLegacy: true, contextLength: 200000, category: 'multimodal', tags: ['legacy', 'vision', 'balanced', 'anthropic'] },
    'openrouter:anthropic/claude-3-haiku': { name: 'Claude 3 Haiku', description: 'Legacy. The fastest and most compact model in the Claude 3 family, designed for near-instant responsiveness.', isLegacy: true, contextLength: 200000, category: 'text', tags: ['legacy', 'fast', 'anthropic'] },
    'meta-llama/Llama-3-70b-instruct': { name: 'Llama 3 70B Instruct', description: 'Legacy. The 70-billion parameter instruction-tuned model from Meta.', isLegacy: true, contextLength: 8000, category: 'text', tags: ['legacy', 'powerful', 'meta', 'llama'] },
    'openrouter:mistralai/mixtral-8x22b-instruct': { name: 'Mixtral 8x22B Instruct', description: 'Legacy. A powerful Mixture-of-Experts (MoE) model from Mistral AI.', isLegacy: true, contextLength: 64000, category: 'text', tags: ['legacy', 'moe', 'mistral', 'powerful'] },
};

function titleCase(str: string): string {
    if (!str) return '';
    return str.toLowerCase().split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('-');
}

const getGeneratedDescription = (name: string, provider: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('instruct')) return `A versatile instruction-following model from ${provider} for a wide range of tasks.`;
    if (lowerName.includes('chat')) return `A conversational AI from ${provider}, optimized for dialogue and chat applications.`;
    if (lowerName.includes('code')) return `A specialized model from ${provider} for code generation, completion, and programming tasks.`;
    if (lowerName.includes('vision') || lowerName.includes('-vl')) return `A multimodal model from ${provider} capable of understanding and processing visual information.`;
    return `A powerful language model from ${provider}, suitable for various natural language processing tasks.`;
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
      provider = parts[0];
      name = parts.slice(1).join('/');
    }
  } else {
      if (name.startsWith('gpt-')) provider = 'OpenAI';
      else if (name.startsWith('dall-e-')) provider = 'OpenAI';
      else if (name.startsWith('claude-')) provider = 'Anthropic';
      else if (name.startsWith('mistral-') || name.startsWith('open-mistral') || name.startsWith('mixtral') || name.startsWith('codestral') || name.startsWith('pixtral')) provider = 'Mistral';
      else if (name.startsWith('grok-')) provider = 'xAI';
      else if (name.startsWith('gemini-')) provider = 'Google';
      else if (name.startsWith('deepseek-')) provider = 'DeepSeek';
      else if (name.startsWith('o1') || name.startsWith('o3') || name.startsWith('o4')) provider = 'OpenAI';
      else if (name.startsWith('command-')) provider = 'Cohere';
      else if (name.startsWith('meta-llama') || name.startsWith('Llama-')) provider = 'Meta';
      else if (name.startsWith('Qwen')) provider = 'Qwen';
      else provider = 'Community';
  }

  const displayProvider = titleCase(provider);
  const metadata = MODEL_METADATA[id] || MODEL_METADATA[cleanId] || MODEL_METADATA[`openrouter:${cleanId}`];
  
  let providerIcon: IconName = 'AssistantIcon';
  const lowerProvider = displayProvider.toLowerCase();
  if (lowerProvider.includes('google')) providerIcon = 'GoogleIcon';
  else if (lowerProvider.includes('openai')) providerIcon = 'OpenAIIcon';
  else if (lowerProvider.includes('anthropic')) providerIcon = 'AnthropicIcon';
  else if (lowerProvider.includes('meta')) providerIcon = 'MetaIcon';
  else if (lowerProvider.includes('mistral')) providerIcon = 'MistralIcon';
  else if (lowerProvider.includes('xai') || lowerProvider.includes('grok')) providerIcon = 'GrokIcon';
  else providerIcon = 'CommentsIcon';


  // Default values
  const baseInfo = { 
      id, 
      provider: displayProvider,
      providerIcon,
      name: metadata?.name || name, 
      isFree,
      isSupported: true,
      category: 'text' as ModelCategory,
      tags: [] as string[],
      isLegacy: false,
  };
  
  const finalInfo = { ...baseInfo, ...metadata };

  // Generate description if missing
  if (!finalInfo.description) {
      finalInfo.description = getGeneratedDescription(finalInfo.name, finalInfo.provider);
  }

  // Generate tags if missing
  if (finalInfo.tags.length === 0) {
      const lowerName = finalInfo.name.toLowerCase();
      if (lowerName.includes('code')) finalInfo.tags.push('code');
      if (lowerName.includes('instruct')) finalInfo.tags.push('instruct');
      if (lowerName.includes('chat')) finalInfo.tags.push('chat');
      if (lowerName.includes('vision') || lowerName.includes('vl')) finalInfo.tags.push('vision');
      finalInfo.tags.push(finalInfo.provider.toLowerCase());
  }

  return finalInfo as ModelInfo;
}


const parsedModels = MODEL_IDS.map(parseModelId).sort((a, b) => {
    // Recommended models first
    if (a.isRecommended && !b.isRecommended) return -1;
    if (!a.isRecommended && b.isRecommended) return 1;
    // Legacy models last
    if (!a.isLegacy && b.isLegacy) return -1;
    if (a.isLegacy && !b.isLegacy) return 1;
    // Then sort by provider and name
    return a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name);
});
export const MODELS: ModelInfo[] = parsedModels;

export const MODEL_PROVIDERS: string[] = ['All', ...Array.from(new Set(MODELS.map(m => m.provider))).sort()];


export interface Conversation {
  id:string;
  title: string;
  messages: Message[];
  reminders?: { [messageId: string]: { time: number; text: string } };
  model: PuterModel;
  persona: string;
  temperature?: number;
  maxTokens?: number;
  selectedTools?: string[];
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    defaultSidebarCollapsed: boolean;
    defaultTemperature: number;
    defaultMaxTokens: number;
}