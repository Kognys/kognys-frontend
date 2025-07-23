import { useState, useCallback, useRef, useEffect } from 'react';
import { kognysChatStreamTransport } from '@/lib/kognysChatStreamTransport';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'status' | 'agent';
  content: string;
  eventType?: string;
  temporary?: boolean;
  agentName?: string;
  agentRole?: string;
  messageType?: string;
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
  const messageTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Update messages when initialMessages changes (e.g., when switching chats)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Clear all message timeouts
  const clearAllTimeouts = useCallback(() => {
    messageTimeouts.current.forEach(timeout => clearTimeout(timeout));
    messageTimeouts.current.clear();
  }, []);

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    clearAllTimeouts();
    setStatus('ready');
    setStreamingMessageId(null);
  }, [clearAllTimeouts]);

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
          
          // Don't add the assistant message during streaming
          // We'll add it at the end in onComplete
        },
        onStatus: (statusText: string, eventType: string) => {
          if (!showStatusMessages || abortControllerRef.current?.signal.aborted) return;
          
          const statusMessageId = `status-${Date.now()}`;
          
          // Check for duplicate status messages
          setMessages(prev => {
            const isDuplicate = prev.some(msg => 
              msg.role === 'status' && 
              msg.content === statusText &&
              msg.eventType === eventType &&
              msg.temporary === true
            );
            
            if (isDuplicate) {
              console.log('Skipping duplicate status message:', eventType, statusText);
              return prev;
            }
            
            return [...prev, {
              id: statusMessageId,
              role: 'status' as const,
              content: statusText,
              eventType,
              temporary: true
            }];
          });
          
          // Remove status message after exactly 5 seconds for all types
          const timeout = setTimeout(() => {
            setMessages(prev => prev.filter(msg => msg.id !== statusMessageId));
            messageTimeouts.current.delete(statusMessageId);
          }, 5000);
          
          messageTimeouts.current.set(statusMessageId, timeout);
        },
        onAgentMessage: (agentName: string, message: string, agentRole?: string, messageType?: string) => {
          console.log('🎭 Agent Message Received:', { agentName, message, agentRole, messageType });
          
          if (!showStatusMessages) return;
          
          // Check if we already have this exact message from the same agent
          const agentMessageId = `agent-${Date.now()}-${Math.random()}`;
          let messageAdded = false;
          
          setMessages(prev => {
            const isDuplicate = prev.some(msg => 
              msg.role === 'agent' && 
              msg.agentName === agentName && 
              msg.content === message &&
              msg.temporary === true
            );
            
            if (isDuplicate) {
              console.log('Skipping duplicate agent message:', agentName, message);
              return prev;
            }
            
            messageAdded = true;
            return [...prev, {
              id: agentMessageId,
              role: 'agent' as const,
              content: message,
              agentName,
              agentRole,
              messageType,
              temporary: true
            }];
          });
          
          // Auto-remove agent messages after exactly 5 seconds
          // Only set timeout if message was actually added
          if (messageAdded) {
            const timeout = setTimeout(() => {
              setMessages(prev => prev.filter(msg => msg.id !== agentMessageId));
              messageTimeouts.current.delete(agentMessageId);
            }, 5000); // Exactly 5 seconds
            
            messageTimeouts.current.set(agentMessageId, timeout);
          }
        },
        onAgentDebate: (agents: any[], topic?: string) => {
          // Optionally show agent debate panel
          console.log('Agents in debate:', agents, 'Topic:', topic);
        },
        onComplete: (fullResponse: string) => {
          if (abortControllerRef.current?.signal.aborted) return;
          
          // Clear all timeouts immediately when research is complete
          clearAllTimeouts();
          
          // Remove all temporary messages immediately and add the final assistant message
          setMessages(prev => {
            // Filter out temporary messages and add the final assistant message
            const filteredMessages = prev.filter(msg => !msg.temporary);
            return [...filteredMessages, { 
              id: assistantMessageId, 
              role: 'assistant' as const, 
              content: fullResponse 
            }];
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
          
          // Clear all timeouts on error
          clearAllTimeouts();
          
          // Remove all temporary status messages and add error message
          setMessages(prev => {
            const filteredMessages = prev.filter(msg => !msg.temporary);
            return [...filteredMessages, { 
              id: assistantMessageId, 
              role: 'assistant' as const, 
              content: errorContent 
            }];
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