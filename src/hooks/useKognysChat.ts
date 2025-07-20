import { useState, useCallback, useRef, useEffect } from 'react';
import { kognysChatStreamTransport } from '@/lib/kognysChatStreamTransport';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'status';
  content: string;
  eventType?: string;
  temporary?: boolean;
}

type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error';

interface UseKognysChatOptions {
  initialMessages?: Message[];
  throttle?: number;
  onError?: (error: Error) => void;
  onMessage?: (message: Omit<Message, 'id'>) => void;
  showStatusMessages?: boolean;
}

interface UseKognysChatReturn {
  messages: Message[];
  input: string;
  status: ChatStatus;
  setInput: (value: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  sendMessage: (message: { content: string }) => Promise<void>;
  stop: () => void;
  isLoading: boolean;
}

/**
 * Custom chat hook that provides useChat-like API while working with Kognys backend
 * Includes built-in streaming, throttling, and error handling
 */
export function useKognysChat({
  initialMessages = [],
  throttle = 50,
  onError,
  onMessage,
  showStatusMessages = true
}: UseKognysChatOptions = {}): UseKognysChatReturn {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<ChatStatus>('ready');
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update messages when initialMessages changes (e.g., when switching chats)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('ready');
    setStreamingMessageId(null);
  }, []);

  const throttledUpdate = useCallback((messageId: string, content: string) => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }
    
    throttleTimeoutRef.current = setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, content }
            : msg
        )
      );
    }, throttle);
  }, [throttle]);

  const sendMessage = useCallback(async ({ content }: { content: string }) => {
    if (!content.trim() || status !== 'ready') return;

    setStatus('submitted');
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
    };

    // Add only user message initially
    setMessages(prev => [...prev, userMessage]);
    
    // Notify parent component about new message
    onMessage?.({ role: 'user', content: content.trim() });
    
    const assistantMessageId = (Date.now() + 1).toString();

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      await kognysChatStreamTransport.sendMessages({
        messages: [...messages, userMessage],
        signal: abortControllerRef.current.signal,
        onChunk: (chunk: string) => {
          if (abortControllerRef.current?.signal.aborted) return;
          
          setStatus('streaming');
          setStreamingMessageId(assistantMessageId);
          
          setMessages(prev => {
            // Check if assistant message exists, if not create it
            const hasAssistantMessage = prev.some(msg => msg.id === assistantMessageId);
            if (!hasAssistantMessage) {
              return [...prev, { id: assistantMessageId, role: 'assistant' as const, content: chunk }];
            }
            
            // Update existing assistant message
            return prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: msg.content + chunk }
                : msg
            );
          });
        },
        onStatus: (statusText: string, eventType: string) => {
          if (!showStatusMessages || abortControllerRef.current?.signal.aborted) return;
          
          const statusMessageId = `status-${Date.now()}`;
          
          // Add status message
          setMessages(prev => [...prev, {
            id: statusMessageId,
            role: 'status' as const,
            content: statusText,
            eventType,
            temporary: true
          }]);
          
          // Remove status message after a delay (except for certain types)
          if (!['research_complete', 'error', 'validation_error'].includes(eventType)) {
            setTimeout(() => {
              setMessages(prev => prev.filter(msg => msg.id !== statusMessageId));
            }, 5000);
          }
        },
        onComplete: (fullResponse: string) => {
          if (abortControllerRef.current?.signal.aborted) return;
          
          // Remove all temporary status messages
          setMessages(prev => prev.filter(msg => !msg.temporary));
          
          setMessages(prev => {
            // Check if assistant message exists, if not create it
            const hasAssistantMessage = prev.some(msg => msg.id === assistantMessageId);
            if (!hasAssistantMessage) {
              return [...prev, { id: assistantMessageId, role: 'assistant' as const, content: fullResponse }];
            }
            
            // Update existing assistant message
            return prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: fullResponse }
                : msg
            );
          });
          setStatus('ready');
          setStreamingMessageId(null);
          
          // Notify parent component about assistant message
          onMessage?.({ role: 'assistant', content: fullResponse });
        },
        onError: (error: Error) => {
          if (abortControllerRef.current?.signal.aborted) return;
          
          console.error('Error generating paper:', error);
          const errorContent = `Sorry, I encountered an error while generating your research paper: ${error.message}. Please try again.`;
          
          // Remove all temporary status messages
          setMessages(prev => prev.filter(msg => !msg.temporary));
          
          setMessages(prev => {
            // Check if assistant message exists, if not create it
            const hasAssistantMessage = prev.some(msg => msg.id === assistantMessageId);
            if (!hasAssistantMessage) {
              return [...prev, { id: assistantMessageId, role: 'assistant' as const, content: errorContent }];
            }
            
            // Update existing assistant message
            return prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: errorContent }
                : msg
            );
          });
          setStatus('error');
          setStreamingMessageId(null);
          onError?.(error);
        }
      });
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) return;
      
      const err = error instanceof Error ? error : new Error('Unknown error');
      console.error('Error in sendMessage:', err);
      setStatus('error');
      setStreamingMessageId(null);
      onError?.(err);
    }
  }, [messages, status, throttledUpdate, onError]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const messageContent = input;
    setInput('');
    await sendMessage({ content: messageContent });
  }, [input, sendMessage]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const isLoading = status === 'submitted' || status === 'streaming';

  return {
    messages,
    input,
    status,
    setInput,
    handleInputChange,
    handleSubmit,
    sendMessage,
    stop,
    isLoading,
  };
}