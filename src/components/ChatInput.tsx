import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  canStop?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  disabled = false,
  isLoading = false,
  canStop = false,
  placeholder = "Message Kognys...",
  className
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled && !isLoading) {
        onSubmit();
      }
    }
  };

  const handleSubmit = () => {
    if (value.trim() && !disabled && !isLoading) {
      onSubmit();
    }
  };

  const handleStop = () => {
    if (canStop && onStop) {
      onStop();
    }
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 z-30",
      className
    )}>
      <div className="max-w-3xl mx-auto p-4">
        <div className={cn(
          "relative flex items-end gap-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm transition-all duration-200",
          isFocused && "border-gray-400 dark:border-gray-600 shadow-md"
        )}>
          <div className="flex-1 min-h-0">
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "min-h-[48px] max-h-[200px] resize-none border-0 bg-transparent px-3 py-3 text-sm text-gray-900 dark:text-gray-100",
                "placeholder:text-gray-500 dark:placeholder:text-gray-400 focus-visible:ring-0 focus-visible:ring-offset-0",
                "scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
              )}
              style={{ 
                boxShadow: 'none',
                fieldSizing: 'content' as any
              }}
            />
          </div>
          
          <div className="flex items-center gap-1 pr-2 pb-2">
            {canStop && isLoading ? (
              <Button
                type="button"
                size="sm"
                onClick={handleStop}
                className="h-7 w-7 rounded-md bg-red-500 hover:bg-red-600 text-white p-0"
              >
                <StopCircle className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={!value.trim() || disabled || isLoading}
                className="h-7 w-7 rounded-md bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 text-white dark:text-gray-900 p-0"
              >
                <Send className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
          Kognys can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  );
}