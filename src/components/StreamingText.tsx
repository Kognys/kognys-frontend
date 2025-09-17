import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

interface StreamingTextProps {
  content: string;
  messageId: string;
  isStreaming?: boolean;
  speed?: number;
  onComplete?: () => void;
  onProgress?: () => void;
}

export const StreamingText = ({ 
  content, 
  messageId,
  isStreaming = false,
  speed = 1,
  onComplete,
  onProgress
}: StreamingTextProps) => {
  const [displayedContent, setDisplayedContent] = useState(content);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Always show full content immediately - no typing animation
    setDisplayedContent(content);
    
    // If streaming, show cursor animation
    if (isStreaming && content) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
      onComplete?.();
    }
  }, [content, isStreaming, onComplete]);

  return (
    <>
      <ReactMarkdown
        components={{
          h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-6 mb-3 text-foreground first:mt-0" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-4 mb-2 text-foreground/90" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 space-y-1.5 mb-4" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 space-y-1.5 mb-4" {...props} />,
          li: ({node, ...props}) => <li className="text-foreground/85 leading-relaxed" {...props} />,
          p: ({node, ...props}) => <p className="mb-3 text-foreground/85 leading-relaxed last:mb-0" {...props} />,
          blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground" {...props} />,
          a: ({node, ...props}) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
          code: ({node, inline, ...props}) => 
            inline ? (
              <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-medium" {...props} />
            ) : (
              <code {...props} />
            ),
          img: ({node, ...props}) => (
            <img 
              className="inline-block w-5 h-5 mr-1 align-text-bottom" 
              {...props} 
            />
          )
        }}
      >
        {displayedContent}
      </ReactMarkdown>
      {isAnimating && (
        <span className="inline-block w-0.5 h-5 bg-primary/60 ml-0.5 animate-pulse" />
      )}
    </>
  );
};