
import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { Conversation, Message, PuterModel } from '../types';
import { UserIcon, AssistantIcon, SendIcon, LoadingIcon } from './Icons';
import { AdvancedModelSelector } from './AdvancedModelSelector';
import { usePuter } from '../hooks/usePuter';

interface ChatViewProps {
  conversation: Conversation;
  setConversation: (id: string, updatedData: Partial<Conversation> | ((conv: Conversation) => Partial<Conversation>)) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ conversation, setConversation }) => {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const { streamChatResponse } = usePuter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [conversation.messages]);
  
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleModelChange = (model: PuterModel) => {
    setConversation(conversation.id, { model });
  };
  
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userInput: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
    };

    const aiPlaceholder: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
    };
    
    const updatedMessages = [...conversation.messages, userInput, aiPlaceholder];
    let updatedTitle = conversation.title;
    if (conversation.messages.length === 0) {
        updatedTitle = input.trim().substring(0, 30);
    }
    setConversation(conversation.id, { messages: updatedMessages, title: updatedTitle });

    setInput('');
    setIsStreaming(true);

    try {
      await streamChatResponse({
        model: conversation.model,
        messages: [...conversation.messages, userInput],
        onChunk: (chunk) => {
          setConversation(conversation.id, (currentConv) => ({
            messages: currentConv.messages.map((msg, index) => {
              if (index === currentConv.messages.length - 1) {
                return { ...msg, content: msg.content + chunk };
              }
              return msg;
            }),
          }));
        },
        onError: (error) => {
          console.error('Streaming error:', error);
          setConversation(conversation.id, (currentConv) => ({
              messages: currentConv.messages.map((msg, index) => {
                if (index === currentConv.messages.length - 1) {
                  return { ...msg, content: "Sorry, I encountered an error." };
                }
                return msg;
              })
          }));
        },
      });
    } catch(err) {
        console.error("Failed to stream response:", err);
    } finally {
        setIsStreaming(false);
    }
  }, [input, isStreaming, conversation, setConversation, streamChatResponse]);

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b border-puter-gray-700 bg-puter-gray-800 z-10">
        <h2 className="text-lg font-semibold text-white">{conversation.title}</h2>
        <AdvancedModelSelector
            selectedModel={conversation.model}
            onModelChange={handleModelChange}
            disabled={isStreaming || conversation.messages.length > 0}
        />
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {conversation.messages.map((message, index) => (
          <div key={message.id} className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-puter-gray-700 flex items-center justify-center mt-1">
              {message.role === 'user' ? <UserIcon className="w-5 h-5 text-puter-gray-400" /> : <AssistantIcon className="w-5 h-5 text-puter-blue" />}
            </div>
            <div className="flex-1 pt-1">
              <p className="font-semibold text-white capitalize">{message.role}</p>
              <div className="prose prose-invert max-w-none text-puter-gray-300 whitespace-pre-wrap">
                {message.content}
                {isStreaming && index === conversation.messages.length - 1 && <span className="inline-block w-2 h-4 bg-puter-blue animate-pulse ml-1" />}
              </div>
            </div>
          </div>
        ))}
         <div ref={messagesEndRef} />
      </div>
      <div className="px-6 pb-6 pt-4 bg-puter-gray-800 border-t border-puter-gray-700">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                }
            }}
            placeholder="Type your message..."
            rows={1}
            className="w-full bg-puter-gray-700 text-puter-gray-300 rounded-lg p-4 pr-14 resize-none focus:ring-2 focus:ring-puter-blue focus:outline-none transition-all duration-200 overflow-y-hidden"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-puter-blue text-white disabled:bg-puter-gray-600 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {isStreaming ? <LoadingIcon className="w-5 h-5" /> : <SendIcon className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
