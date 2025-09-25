
import { useCallback } from 'react';
import type { Message, PuterModel, GenerateImageOptions, Memory } from '../types';

declare const puter: any;

interface StreamChatResponseParams {
  model: PuterModel;
  messages: Omit<Message, 'id' | 'imageUrl' | 'isGenerating' | 'isStreaming'>[];
  systemPrompt?: string;
  onChunk: (chunk: string) => void;
  onError: (error: Error) => void;
  onDone?: () => void;
  temperature?: number;
  max_tokens?: number;
  abortSignal?: AbortSignal;
}

interface GetChatResponseParams {
  model: PuterModel;
  messages: any[]; // Can include tool messages
  systemPrompt?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: any[];
}


export const usePuter = () => {
  const streamChatResponse = useCallback(
    async ({ model, messages, systemPrompt, onChunk, onError, onDone, temperature, max_tokens, abortSignal }: StreamChatResponseParams) => {
      if (typeof puter === 'undefined' || !puter.ai) {
        const error = new Error('Puter SDK is not available.');
        console.error(error);
        onError(error);
        return;
      }
      
      try {
        const chatMessages = messages.map(message => {
            if (message.attachments && message.attachments.length > 0) {
                const contentParts: any[] = message.attachments.map(att => ({
                    type: 'file',
                    puter_path: att.puter_path,
                }));
                if (message.content) {
                    contentParts.push({ type: 'text', text: message.content });
                }
                return { role: message.role, content: contentParts };
            }
            return { role: message.role, content: message.content };
        });
        
        // Prepend system message if provided
        const apiMessages = systemPrompt 
            ? [{ role: 'system', content: systemPrompt }, ...chatMessages] 
            : chatMessages;
        
        const options: { model: string; stream: boolean; temperature?: number; max_tokens?: number; } = {
          model,
          stream: true,
        };

        if (temperature !== undefined) options.temperature = temperature;
        if (max_tokens !== undefined) options.max_tokens = max_tokens;

        const stream = await puter.ai.chat(apiMessages, options);
        
        for await (const chunk of stream) {
            if (abortSignal?.aborted) {
                // The async iterator does not have a standard way to be "closed" from the outside.
                // We just break the loop. The underlying request might continue until completion on the server.
                break;
            }
            if (chunk && chunk.text) {
                onChunk(chunk.text);
            }
        }
        
        if (!abortSignal?.aborted) {
            onDone?.();
        }

      } catch (error: any) {
        if (error.name !== 'AbortError') {
            console.error('Puter AI stream failed:', error);
            const errorMessage = error?.message || (typeof error === 'object' && error !== null ? JSON.stringify(error) : 'An unknown error occurred');
            onError(new Error(errorMessage));
        }
      }
    },
    []
  );

   const getChatResponse = useCallback(async ({ model, messages, systemPrompt, temperature, max_tokens, tools }: GetChatResponseParams): Promise<any | null> => {
      if (typeof puter === 'undefined' || !puter.ai) {
        throw new Error('Puter SDK is not available.');
      }
      
      const apiMessages = systemPrompt 
          ? [{ role: 'system', content: systemPrompt }, ...messages] 
          : messages;
      
      const options: any = { model, stream: false };
      if (temperature !== undefined) options.temperature = temperature;
      if (max_tokens !== undefined) options.max_tokens = max_tokens;
      if (tools) options.tools = tools;

      const response = await puter.ai.chat(apiMessages, options);
      return response || null;
   }, []);
  
  const generateImage = useCallback(async (options: GenerateImageOptions): Promise<string> => {
      if (typeof puter === 'undefined' || !puter.ai) {
        throw new Error('Puter SDK is not available.');
      }
      try {
        const { prompt, ...apiOptions } = options;
        const result = await puter.ai.txt2img(prompt, apiOptions);
        
        if (result && typeof result.src === 'string') {
          return result.src;
        }
        throw new Error('Invalid response from txt2img API.');
      } catch (error: any) {
        console.error('Puter AI txt2img failed:', error);
        const errorMessage = error?.message || (typeof error === 'object' && error !== null ? JSON.stringify(error) : 'An unknown error occurred');
        throw new Error(errorMessage);
      }
    }, []);

  const img2txt = useCallback(async (image: File | Blob | string): Promise<string> => {
    if (typeof puter === 'undefined' || !puter.ai) {
        throw new Error('Puter SDK is not available.');
    }
    try {
        const text = await puter.ai.img2txt(image);
        return text;
    } catch (error: any) {
        console.error('Puter AI img2txt failed:', error);
        const errorMessage = error?.message || (typeof error === 'object' && error !== null ? JSON.stringify(error) : 'An unknown error occurred');
        throw new Error(errorMessage);
    }
  }, []);

  const txt2speech = useCallback(async (text: string, options?: any): Promise<HTMLAudioElement | null> => {
      if (typeof puter === 'undefined' || !puter.ai) {
          throw new Error('Puter SDK is not available.');
      }
      try {
          return await puter.ai.txt2speech(text, options);
      } catch(e: any) {
          console.error("Text to speech failed", e);
          return null;
      }
  }, []);

  const zipAndDownload = useCallback(async (files: { [path: string]: string }, zipFileName: string) => {
    if (typeof puter === 'undefined' || !puter.fs) {
        throw new Error('Puter SDK is not available.');
    }
    try {
        const tempDir = `.puter/pichat/generated_projects/${Date.now()}`;
        for (const path in files) {
            await puter.fs.write(`${tempDir}/${path}`, files[path], { createMissingParents: true });
        }
        const zipBlob = await puter.fs.zip(tempDir);
        await puter.fs.download(zipBlob, zipFileName);
        await puter.fs.rm(tempDir, { recursive: true });
    } catch (e: any) {
        console.error("Failed to zip and download:", e);
        throw new Error(e.message || "Could not create or download project zip.");
    }
  }, []);

  const MEMORY_KEY = 'pichat-memory-store';

  const getMemory = useCallback(async (): Promise<Memory> => {
      if (typeof puter === 'undefined' || !puter.kv) {
          console.warn('Puter.kv not available, cannot load memory.');
          return {};
      }
      try {
          const memory = await puter.kv.get(MEMORY_KEY);
          return memory ? JSON.parse(memory) : {};
      } catch (e) {
          console.error("Failed to get memory from kv store:", e);
          return {};
      }
  }, []);

  const setMemory = useCallback(async (memory: Memory): Promise<void> => {
      if (typeof puter === 'undefined' || !puter.kv) {
          console.warn('Puter.kv not available, cannot save memory.');
          return;
      }
      try {
          await puter.kv.set(MEMORY_KEY, JSON.stringify(memory));
      } catch (e) {
          console.error("Failed to set memory in kv store:", e);
      }
  }, []);


  return { streamChatResponse, getChatResponse, generateImage, img2txt, txt2speech, zipAndDownload, getMemory, setMemory };
};