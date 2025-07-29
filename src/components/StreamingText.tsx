import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

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
  speed = 3,
  onComplete,
  onProgress
}: StreamingTextProps) => {
  // Check localStorage for saved progress
  const getStoredProgress = () => {
    const stored = localStorage.getItem(`streaming_progress_${messageId}`);
    if (stored) {
      const { index, completed } = JSON.parse(stored);
      return { index, completed };
    }
    return { index: 0, completed: false };
  };

  const storedProgress = getStoredProgress();
  
  const [displayedContent, setDisplayedContent] = useState(() => {
    // If animation was completed before, show full content
    if (storedProgress.completed) {
      return content;
    }
    // Otherwise show content up to stored index
    return content.slice(0, storedProgress.index);
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const indexRef = useRef(storedProgress.index);
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

    // Check if this is a new complete message or we should continue from stored progress
    const shouldAnimate = content && !storedProgress.completed && indexRef.current < content.length;
    
    if (shouldAnimate) {
      setIsAnimating(true);

      const animate = () => {
        if (indexRef.current < content.length) {
          setDisplayedContent(content.slice(0, indexRef.current + 1));
          indexRef.current++;
          
          // Save progress to localStorage
          localStorage.setItem(`streaming_progress_${messageId}`, JSON.stringify({
            index: indexRef.current,
            completed: false,
            timestamp: Date.now()
          }));
          
          // Call onProgress every 15 characters for smooth scrolling
          if (indexRef.current % 15 === 0) {
            onProgress?.();
          }
          
          animationRef.current = requestAnimationFrame(() => {
            setTimeout(animate, speed);
          });
        } else {
          // Animation completed
          setIsAnimating(false);
          localStorage.setItem(`streaming_progress_${messageId}`, JSON.stringify({
            index: content.length,
            completed: true,
            timestamp: Date.now()
          }));
          onComplete?.();
        }
      };

      animate();
    } else if (content && storedProgress.completed) {
      // Content was already completed, just show it
      setDisplayedContent(content);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // Save current progress when unmounting
      if (isAnimating && indexRef.current > 0 && indexRef.current < content.length) {
        localStorage.setItem(`streaming_progress_${messageId}`, JSON.stringify({
          index: indexRef.current,
          completed: false,
          timestamp: Date.now()
        }));
      }
    };
  }, [content, messageId, isStreaming, speed, onComplete, onProgress, storedProgress.completed]);

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