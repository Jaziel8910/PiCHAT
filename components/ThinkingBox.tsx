import React, { useState } from 'react';
import { BrainIcon, ChevronDownIcon } from './Icons';

interface ThinkingBoxProps {
  content: string;
}

export const ThinkingBox: React.FC<ThinkingBoxProps> = ({ content }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!content?.trim()) return null;

  return (
    <div className="border border-theme-border bg-black/5 rounded-2xl my-2 text-sm text-theme-text">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 text-left hover:bg-black/5 rounded-t-2xl transition-colors"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2 font-medium">
          <BrainIcon className="w-5 h-5 text-theme-text-secondary" />
          <span>Thinking</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-theme-text-secondary">
            <span>{isExpanded ? 'Hide' : 'Show'}</span>
            <ChevronDownIcon className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
            <div className="p-3 pt-0">
                <pre className="whitespace-pre-wrap bg-black/5 p-3 rounded-lg font-mono text-xs text-theme-text-secondary overflow-x-auto max-h-60">
                    <code>{content}</code>
                </pre>
            </div>
        </div>
      </div>
    </div>
  );
};
