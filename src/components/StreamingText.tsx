import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

interface StreamingTextProps {
  content: string;
  isStreaming?: boolean;
  speed?: number;
  onComplete?: () => void;
}

export const StreamingText = ({ 
  content, 
  isStreaming = false,
  speed = 7,
  onComplete 
}: StreamingTextProps) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const indexRef = useRef(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    // If we're streaming from the server, just show content as is
    if (isStreaming) {
      setDisplayedContent(content);
      return;
    }

    // If content hasn't changed significantly, don't re-animate
    if (displayedContent === content) {
      return;
    }

    // Check if this is a new complete message (content is complete and we haven't animated it yet)
    if (content && displayedContent.length === 0) {
      setIsAnimating(true);
      indexRef.current = 0;

      const animate = () => {
        if (indexRef.current < content.length) {
          setDisplayedContent(content.slice(0, indexRef.current + 1));
          indexRef.current++;
          animationRef.current = requestAnimationFrame(() => {
            setTimeout(animate, speed);
          });
        } else {
          setIsAnimating(false);
          onComplete?.();
        }
      };

      animate();
    } else {
      // Content changed but we've already shown something, just update
      setDisplayedContent(content);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [content, isStreaming, speed, onComplete]);

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