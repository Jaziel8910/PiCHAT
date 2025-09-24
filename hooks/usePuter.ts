import { useCallback } from 'react';
import type { Message, PuterModel } from '../types';

declare const puter: any;

interface StreamChatResponseParams {
  model: PuterModel;
  messages: Omit<Message, 'id'>[];
  onChunk: (chunk: string) => void;
  onError: (error: Error) => void;
}

export const usePuter = () => {
  const streamChatResponse = useCallback(
    async ({ model, messages, onChunk, onError }: StreamChatResponseParams) => {
      if (typeof puter === 'undefined' || !puter.ai) {
        const error = new Error('Puter SDK is not available.');
        console.error(error);
        onError(error);
        return;
      }
      
      try {
        const chatMessages = messages.map(({ role, content }) => ({ role, content }));
        const stream = await puter.ai.chat(chatMessages, {
          model,
          stream: true,
        });

        for await (const part of stream) {
          if (part && typeof part.text === 'string') {
            onChunk(part.text);
          }
        }
      } catch (error: any) {
        console.error('Puter AI stream failed:', error);
        const errorMessage = error?.message || (typeof error === 'object' && error !== null ? JSON.stringify(error) : 'An unknown error occurred');
        onError(new Error(errorMessage));
      }
    },
    []
  );

  return { streamChatResponse };
};
