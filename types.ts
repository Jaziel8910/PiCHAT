

import { MODEL_IDS } from './models';
import * as Icons from './components/Icons';

export type MessageRole = 'user' | 'assistant' | 'tool';
export type IconName = keyof typeof Icons;

export interface Message {
  id: string;
  role: MessageRole;
  content: string; 
  attachments?: {
    puter_path: string;
    preview_url: string; 
  }[];
  imageUrl?: string; 
  isGenerating?: boolean; 
  isStreaming?: boolean; 
  thinkingContent?: string; 
  isCurrentlyThinking?: boolean; 
}

export type PuterModel = string;

export type ImageGenerationModel = 'gpt-image-1' | 'openrouter:google/gemini-2.5-flash-image-preview';

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
  speed?: number;
  intelligence?: number;
}

export const AUTO_ROUTER_SYSTEM_PROMPT = `You are an expert AI model routing expert. Your only task is to analyze the user's prompt and determine the best-suited AI model from the provided list. Respond with ONLY the model ID string and nothing else. Do not add explanations, greetings, or any other text.

Here is the list of available models and their strengths:

### Category: Quick & General Chat / Simple Questions
For fast, conversational responses, summarization, and simple questions.
- openrouter:openai/gpt-4o-mini: Fast, capable, and affordable. Good default for general chat.
- openrouter:google/gemini-2.5-flash: Extremely fast and cost-effective for high-throughput tasks.
- openrouter:mistralai/mistral-7b-instruct: Very fast, open-source model, great for simple instructions.
- openrouter:x-ai/grok-4-fast:free: A free, high-speed version of Grok, perfect for real-time conversation.
- openrouter:anthropic/claude-3-haiku-20240307: Anthropic's fastest model, good for quick and accurate responses.

### Category: Creative Writing & Brainstorming
For stories, marketing copy, imaginative ideas, and text generation.
- openrouter:openai/gpt-4o: Top-tier creativity, nuance, and writing ability. The best choice for high-quality creative tasks.
- openrouter:anthropic/claude-3.5-sonnet-20240620: Excellent for nuanced writing, character development, and long-form content.
- openrouter:mistralai/mistral-large: Strong multilingual and creative writing capabilities.
- openrouter:x-ai/grok-4: Can generate creative text with a unique, sometimes humorous, personality.

### Category: Deep Reasoning & Complex Problem Solving
For analysis, math, logic, multi-step problems, and advanced instruction following.
- openrouter:anthropic/claude-3-opus-20240229: Anthropic's most powerful model, excels at complex analysis and long-context reasoning.
- openrouter:google/gemini-2.5-pro: Google's flagship, great for multimodal reasoning and handling vast amounts of information.
- openrouter:meta-llama/llama-3.1-405b-instruct: Meta's largest model, for deep, complex reasoning.
- openrouter:x-ai/grok-4: A frontier model with powerful reasoning capabilities.

### Category: Basic Coding & Scripting
For simple scripts, boilerplate, debugging small issues, and code explanations.
- openrouter:openai/gpt-4o-mini: Capable of handling simple coding tasks quickly.
- openrouter:google/gemini-2.5-flash: Fast enough for real-time code completion and simple script generation.
- openrouter:mistralai/codestral-latest: Mistral's specialized code model, very fast and accurate for its size.
- Qwen/Qwen2.5-Coder-32B-Instruct: A strong, dedicated coding model.

### Category: Advanced Coding & Software Architecture
For complex algorithms, new projects, architectural design, and challenging debugging.
- openrouter:anthropic/claude-3.5-sonnet-20240620: Can reason about large codebases and complex architectures effectively. Excellent for coding tasks.
- openrouter:google/gemini-2.5-pro: Excellent at understanding and generating code within large contexts.
- openrouter:meta-llama/llama-3.1-405b-instruct: Its massive size allows it to grasp complex programming logic.
- openrouter:deepseek/deepseek-coder: A highly capable model specialized in code generation and understanding.

### Category: Image Analysis (Multimodal)
For prompts that include images that need to be understood or analyzed.
- openrouter:openai/gpt-4o: State-of-the-art vision understanding.
- openrouter:anthropic/claude-3.5-sonnet-20240620: Excellent at interpreting charts, graphs, and complex images.
- openrouter:google/gemini-2.5-pro: Top-tier vision capabilities, especially with dense information.
- Qwen/Qwen2.5-VL-72B-Instruct: A powerful open-source vision-language model.

Based on the user's prompt, choose the most appropriate model ID from the list above and return ONLY the ID.
`;

const MODEL_METADATA: Record<string, Partial<Omit<ModelInfo, 'id' | 'provider' | 'isFree' | 'providerIcon'>>> = {
    // Auto Router
    'openrouter/auto': { 
        name: "Auto (Model Router)", 
        description: "Automatically selects the best model for your prompt from a curated list of top performers. Powered by Llama 3.2 1B.", 
        isRecommended: true, 
        category: 'specialized', 
        tags: ['router', 'smart', 'best choice'],
        speed: 5, 
        intelligence: 5,
    },
    
    // Recommended & Popular
    'openrouter:openai/gpt-4o': { name: "GPT-4o", description: "OpenAI's flagship multimodal model, balancing speed, intelligence, and vision capabilities.", isRecommended: true, contextLength: 128000, category: 'multimodal', tags: ['vision', 'fast', 'powerful', 'openai'], speed: 4, intelligence: 5 },
    'openrouter:anthropic/claude-3-opus-20240229': { name: "Claude 3 Opus", description: "Anthropic's most powerful model for complex analysis, long documents, and demanding tasks.", isRecommended: true, contextLength: 200000, category: 'deep-thought', tags: ['vision', 'writing', 'analysis', 'anthropic', 'reasoning'], speed: 3, intelligence: 5 },
    'openrouter:google/gemini-2.5-pro': { name: "Gemini 2.5 Pro", description: "Google's next-generation model for large-scale multimodal reasoning and long context understanding.", isRecommended: true, contextLength: 1000000, category: 'multimodal', tags: ['vision', 'long context', 'google'], speed: 4, intelligence: 5 },
    'openrouter:anthropic/claude-3.5-sonnet-20240620': { name: "Claude 3.5 Sonnet", description: "Anthropic's fastest and most balanced model, ideal for enterprise workloads and most everyday tasks.", isRecommended: true, contextLength: 200000, category: 'multimodal', tags: ['vision', 'fast', 'balanced', 'anthropic'], speed: 5, intelligence: 4 },
    'openrouter:mistralai/mistral-large': { name: "Mistral Large", description: "Mistral's top-tier model, excellent for complex multilingual tasks and reasoning.", contextLength: 32000, category: 'text', tags: ['multilingual', 'reasoning', 'mistral'], isRecommended: true, speed: 4, intelligence: 4 },
    'openrouter:x-ai/grok-4': { name: 'Grok 4', description: "xAI's latest frontier model, offering powerful reasoning and efficiency for a wide range of complex tasks.", isRecommended: true, contextLength: 128000, category: 'deep-thought', tags: ['reasoning', 'powerful', 'grok'], speed: 3, intelligence: 5 },
    'openrouter:x-ai/grok-4-fast:free': { name: 'Grok 4 Fast (Free)', description: "A free, high-speed version of xAI's powerful Grok 4 model, perfect for real-time conversation.", isRecommended: true, category: 'text', tags: ['fast', 'reasoning', 'grok', 'free'], speed: 5, intelligence: 3 },
    'openrouter:meta-llama/llama-3.1-405b-instruct': { name: 'Llama 3.1 405B Instruct', description: 'Meta\'s largest and most capable model for deep, complex reasoning and generation.', category: 'deep-thought', tags: ['reasoning', 'powerful', 'meta', 'llama'], contextLength: 128000, isRecommended: true, speed: 2, intelligence: 5 },
    
    // Image Generation
    'dall-e-3': { name: 'DALL-E 3', description: 'OpenAI\'s high-quality image generation model, great for complex and detailed scenes.', category: 'image', tags: ['image generation', 'openai', 'high quality'], speed: 3, intelligence: 5 },
    'gpt-image-1': { name: 'GPT Image 1', description: 'A fast and versatile image generation model from OpenAI.', category: 'image', tags: ['image generation', 'fast', 'openai'], speed: 4, intelligence: 4 },
    'openrouter:google/gemini-2.5-flash-image-preview': { name: 'Nano Banana', description: "Google's nimble model for quick and creative image editing and manipulation tasks (image-to-image).", category: 'image', tags: ['image editing', 'vision', 'google', 'fast'], isRecommended: true, speed: 5, intelligence: 4 },

    // Multimodal
    'openrouter:openai/gpt-4o-mini': { name: "GPT-4o mini", description: "A smaller, faster, and more affordable version of GPT-4o with multimodal capabilities.", category: 'multimodal', tags: ['vision', 'fast', 'openai'], speed: 5, intelligence: 3 },
    'openrouter:google/gemini-2.5-flash': { name: "Gemini 2.5 Flash", description: "A lightweight, fast and cost-efficient multimodal model from Google.", category: 'multimodal', tags: ['vision', 'fast', 'google'], speed: 5, intelligence: 3 },
    'Qwen/Qwen2.5-VL-72B-Instruct': { name: 'Qwen 2.5 VL Instruct', description: 'A powerful vision-language model from Alibaba for understanding image content.', category: 'multimodal', tags: ['vision', 'qwen'] },
    'meta-llama/Llama-3.2-90b-vision-instruct': { name: 'Llama 3.2 90B Vision', description: 'Meta\'s large-scale vision model for advanced image understanding.', category: 'multimodal', tags: ['vision', 'meta', 'llama'] },

    // Specialized - Code
    'openrouter:mistralai/codestral-latest': { name: 'Codestral', description: 'Mistral\'s flagship model specialized in code generation, completion, and explanation.', category: 'specialized', tags: ['code', 'programming', 'mistral'], isRecommended: true, speed: 5, intelligence: 4 },
    'Qwen/Qwen2.5-Coder-32B-Instruct': { name: 'Qwen 2.5 Coder 32B', description: 'A 32B parameter coding model from Alibaba.', category: 'specialized', tags: ['code', 'programming', 'qwen'] },
    'openrouter:deepseek/deepseek-coder': { name: 'DeepSeek Coder', description: 'A powerful and specialized model for code-related tasks.', category: 'specialized', tags: ['code', 'programming', 'deepseek'], speed: 4, intelligence: 4 },

    // Other notable models
    'meta-llama/Llama-3.2-1B-Instruct': { name: 'Llama 3.2 1B Instruct', description: 'Meta\'s smallest and fastest model, perfect for routing, classification, or simple agentic tasks.', category: 'text', tags: ['fast', 'small', 'meta', 'llama'], speed: 5, intelligence: 2 },
    'openrouter:google/gemma-2-9b-it:free': { name: 'Gemma 2 9B (Free)', description: 'A free, high-performance open model from Google, suitable for a variety of tasks.', category: 'text', tags: ['free', 'balanced', 'google'], speed: 4, intelligence: 3 },
    
    // Legacy Models
    'openrouter:openai/gpt-4-turbo': { name: 'GPT-4 Turbo', description: "Legacy. The previous version of OpenAI's GPT-4 Turbo model, offering a large context window and strong performance.", isLegacy: true, contextLength: 128000, category: 'text', tags: ['legacy', 'powerful', 'openai'] },
    'openrouter:openai/gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', description: 'Legacy. A fast and affordable model from OpenAI, suitable for a wide range of general tasks.', isLegacy: true, contextLength: 16000, category: 'text', tags: ['legacy', 'fast', 'openai'] },
    'openrouter:anthropic/claude-3-opus': { name: 'Claude 3 Opus (Legacy)', description: "Legacy. Anthropic's powerful model for complex tasks, preceding the 3.5 Sonnet release.", isLegacy: true, contextLength: 200000, category: 'multimodal', tags: ['legacy', 'vision', 'writing', 'analysis', 'anthropic'] },
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
  else if (lowerProvider.includes('qwen')) providerIcon = 'QwenIcon';
  else if (lowerProvider.includes('deepseek')) providerIcon = 'DeepseekIcon';
  else if (lowerProvider.includes('cohere')) providerIcon = 'CohereIcon';
  else if (lowerProvider.includes('microsoft')) providerIcon = 'MicrosoftIcon';
  else if (lowerProvider.includes('nvidia')) providerIcon = 'NvidiaIcon';
  else if (lowerProvider.includes('baidu')) providerIcon = 'BaiduIcon';
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
      speed: Math.floor(Math.random() * 3) + 2,
      intelligence: Math.floor(Math.random() * 3) + 2,
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
  pinnedMessageId?: string | null;
  supertextsEnabled?: boolean;
}

export interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    defaultSidebarCollapsed: boolean;
    defaultTemperature: number;
    defaultMaxTokens: number;
}

export type Memory = Record<string, string>;