import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { CopyIcon, CheckIcon } from './Icons';

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="bg-gray-900/5 rounded-2xl my-4 text-gray-800">
      <div className="flex items-center justify-between text-xs text-theme-text-secondary px-4 py-2 border-b border-black/10">
        <span>{language || 'code'}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 hover:text-theme-text transition-colors">
          {copied ? (
            <>
              <CheckIcon className="w-4 h-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <CopyIcon className="w-4 h-4" />
              Copy code
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const MarkdownParser: React.FC<{ text: string }> = ({ text }) => {
    const segments = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g).filter(Boolean);
    return (<>{segments.map((segment, i) => {
        if (segment.startsWith('**') && segment.endsWith('**')) return <strong key={i}>{segment.slice(2, -2)}</strong>;
        if (segment.startsWith('*') && segment.endsWith('*')) return <em key={i}>{segment.slice(1, -1)}</em>;
        if (segment.startsWith('`') && segment.endsWith('`')) return <code key={i} className="bg-black/10 px-1.5 py-0.5 rounded text-sm font-mono">{segment.slice(1, -1)}</code>;
        return segment;
    })}</>);
};

const StreamingRenderer: React.FC<{ text: string }> = ({ text }) => {
    const [stableText, setStableText] = useState('');
    const [newChunk, setNewChunk] = useState('');
    const prevTextRef = useRef('');

    useEffect(() => {
        if (text.startsWith(prevTextRef.current)) {
            const incomingChunk = text.substring(prevTextRef.current.length);
            setStableText(prevTextRef.current);
            setNewChunk(incomingChunk);
        } else {
            // Full re-render if history is changed
            setStableText('');
            setNewChunk(text);
        }
        prevTextRef.current = text;
    }, [text]);

    const animatedWords = useMemo(() => {
        // Split by space but keep the space to maintain correct spacing
        return newChunk.split(/(\s+)/).filter(Boolean);
    }, [newChunk]);

    return (
        <>
            <MarkdownParser text={stableText} />
            {animatedWords.map((word, index) => (
                <span
                    key={index}
                    className="streaming-text-chunk"
                    style={{ animationDelay: `${index * 0.05}s` }}
                >
                    <MarkdownParser text={word} />
                </span>
            ))}
        </>
    );
};

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content, isStreaming = false }) => {
  const parts = useMemo(() => content.split(/(```[\w-]*\n[\s\S]*?\n```)/g), [content]);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        const codeBlockMatch = part.match(/^```([\w-]*)?\n([\s\S]*?)\n```$/);
        if (codeBlockMatch) {
          const language = codeBlockMatch[1] || '';
          const code = codeBlockMatch[2];
          return <CodeBlock key={index} language={language} code={code} />;
        } else {
          const isLastPart = index === parts.length - 1;
          if (isStreaming && isLastPart) {
            return <StreamingRenderer key={index} text={part} />
          }
          return <MarkdownParser key={index} text={part} />;
        }
      })}
    </>
  );
});