import { useState, useCallback, useRef, useEffect } from 'react';
import { kognysChatStreamTransport } from '@/lib/kognysChatStreamTransport';
import { AgentInteractionMessage, getTargetAgent } from '@/types/agentInteraction';

type Message = AgentInteractionMessage;

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
  const accumulatedResponseRef = useRef<string>('');
  const chatInstanceIdRef = useRef<string>(Date.now().toString());

  // Update messages when initialMessages changes (e.g., when switching chats)
  useEffect(() => {
    // Stop any ongoing operations when switching chats
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Reset state
    setStatus('ready');
    setStreamingMessageId(null);
    accumulatedResponseRef.current = '';
    
    // Generate new instance ID to prevent cross-chat contamination
    chatInstanceIdRef.current = Date.now().toString();
    
    // Set new messages
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
      timestamp: Date.now(),
    };

    // Add only user message initially
    setMessages(prev => [...prev, userMessage]);
    
    // Notify parent component about new message
    onMessage?.({ role: 'user', content: content.trim() });
    
    const assistantMessageId = (Date.now() + 1).toString();

    // Create abort controller for this request
    abortControllerRef.current = new AbortController();
    
    // Reset accumulated response
    accumulatedResponseRef.current = '';
    
    // Capture current instance ID to prevent cross-chat contamination
    const currentInstanceId = chatInstanceIdRef.current;

    try {
      await kognysChatStreamTransport.sendMessages({
        messages: [...messages, userMessage],
        signal: abortControllerRef.current.signal,
        onChunk: (chunk: string) => {
          if (abortControllerRef.current?.signal.aborted) return;
          
          // Check if this response belongs to the current chat instance
          if (currentInstanceId !== chatInstanceIdRef.current) {
            return;
          }
          
          setStatus('streaming');
          setStreamingMessageId(assistantMessageId);
          
          // Accumulate the response
          accumulatedResponseRef.current += chunk;
          
          // Update the message in real-time during streaming
          setMessages(prev => {
            const existingIndex = prev.findIndex(msg => msg.id === assistantMessageId);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                content: accumulatedResponseRef.current,
              };
              return updated;
            } else {
              // Add new assistant message if it doesn't exist
              return [...prev, {
                id: assistantMessageId,
                role: 'assistant',
                content: accumulatedResponseRef.current,
                timestamp: Date.now(),
              }];
            }
          });
        },
        onStatus: (statusText: string, eventType: string) => {
          if (!showStatusMessages || abortControllerRef.current?.signal.aborted) return;
          
          // Check if this response belongs to the current chat instance
          if (currentInstanceId !== chatInstanceIdRef.current) {
            return;
          }
          
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
        },
        onAgentMessage: (agentName: string, message: string, agentRole?: string, messageType?: string) => {
          if (!showStatusMessages) return;
          
          // Check if this response belongs to the current chat instance
          if (currentInstanceId !== chatInstanceIdRef.current) {
            return;
          }
          
          // Determine target agent from message content
          const targetAgent = getTargetAgent(agentName.toLowerCase(), message);
          
          // Check if we already have this exact message from the same agent
          const agentMessageId = `agent-${Date.now()}-${Math.random()}`;
          
          setMessages(prev => {
            const isDuplicate = prev.some(msg => 
              msg.role === 'agent' && 
              msg.agentName === agentName && 
              msg.content === message &&
              msg.temporary === true
            );
            
            if (isDuplicate) {
              return prev;
            }
            
            const newMessage: Message = {
              id: agentMessageId,
              role: 'agent' as const,
              content: message,
              agentName,
              agentRole,
              messageType,
              temporary: false,
              timestamp: Date.now(),
              targetAgent,
              // Highlight important interactions
              isHighlighted: messageType === 'orchestrator_decision' ||
                           message.toLowerCase().includes('error') ||
                           message.toLowerCase().includes('issue'),
            };
            
            return [...prev, newMessage];
          });
        },
        onAgentDebate: (agents: any[], topic?: string) => {
          // Optionally show agent debate panel
        },
        onComplete: (fullResponse: string, transactionHash?: string) => {
          if (abortControllerRef.current?.signal.aborted) return;
          
          // Check if this response belongs to the current chat instance
          if (currentInstanceId !== chatInstanceIdRef.current) {
            return;
          }
          
          // Add the complete response message
          setMessages(prev => {
            // Build the final content
            let finalContent = fullResponse;
            
            // Check if transaction hash is already in the content
            const txHashInContent = fullResponse.match(/0x[a-fA-F0-9]{64}/);
            
            // If we have a transaction hash, append it to the content with BSC testnet link
            // Skip if already in content
            if (transactionHash && transactionHash !== 'async_pending' && !txHashInContent) {
              const bscTestnetUrl = `https://testnet.bscscan.com/tx/${transactionHash}`;
              finalContent += `\n\n---\n\n![BNB Logo](/bnb-bnb-logo.png) **Transaction Hash:** [\`${transactionHash}\`](${bscTestnetUrl})`;
            } else if (transactionHash && transactionHash !== 'async_pending' && txHashInContent) {
              // Transaction hash is in the content, make it clickable
              finalContent = finalContent.replace(/Transaction Hash:\s*(0x[a-fA-F0-9]{64})/g, (match, hash) => {
                const bscTestnetUrl = `https://testnet.bscscan.com/tx/${hash}`;
                return `Transaction Hash: [\`${hash}\`](${bscTestnetUrl})`;
              });
              // Add BNB logo if present
              finalContent = finalContent.replace(/🔗\s*Transaction Hash:/g, '![BNB Logo](/bnb-bnb-logo.png) Transaction Hash:');
            } else if (transactionHash === 'async_pending' && !txHashInContent) {
              // Only show processing message if no actual hash found
              finalContent += `\n\n---\n\n⏳ **Transaction Status:** Processing on blockchain...`;
            }
            
            // Update the existing streaming message or add new one
            const existingIndex = prev.findIndex(msg => msg.id === assistantMessageId);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                content: finalContent,
                transactionHash,
              };
              return updated;
            } else {
              // Add the complete assistant message
              const assistantMessage: Message = { 
                id: assistantMessageId, 
                role: 'assistant', 
                content: finalContent,
                transactionHash,
                timestamp: Date.now(),
              };
              return [...prev, assistantMessage];
            }
          });
          
          setStatus('ready');
          setStreamingMessageId(null);
          
          // Build final content with transaction hash link if available
          let finalContentForCallback = fullResponse;
          const txHashInCallback = fullResponse.match(/0x[a-fA-F0-9]{64}/);
          
          if (transactionHash && transactionHash !== 'async_pending' && !txHashInCallback) {
            const bscTestnetUrl = `https://testnet.bscscan.com/tx/${transactionHash}`;
            finalContentForCallback += `\n\n---\n\n![BNB Logo](/bnb-bnb-logo.png) **Transaction Hash:** [\`${transactionHash}\`](${bscTestnetUrl})`;
          } else if (transactionHash && transactionHash !== 'async_pending' && txHashInCallback) {
            // Transaction hash is in the content, make it clickable
            finalContentForCallback = finalContentForCallback.replace(/Transaction Hash:\s*(0x[a-fA-F0-9]{64})/g, (match, hash) => {
              const bscTestnetUrl = `https://testnet.bscscan.com/tx/${hash}`;
              return `Transaction Hash: [\`${hash}\`](${bscTestnetUrl})`;
            });
            // Add BNB logo if present
            finalContentForCallback = finalContentForCallback.replace(/🔗\s*Transaction Hash:/g, '![BNB Logo](/bnb-bnb-logo.png) Transaction Hash:');
          } else if (transactionHash === 'async_pending' && !txHashInCallback) {
            finalContentForCallback += `\n\n---\n\n⏳ **Transaction Status:** Processing on blockchain...`;
          }
          
          // Notify parent component about assistant message with transaction hash
          onMessage?.({ 
            role: 'assistant', 
            content: finalContentForCallback,
            transactionHash 
          });
        },
        onError: (error: Error) => {
          if (abortControllerRef.current?.signal.aborted) return;
          
          console.error('Error generating paper:', error);
          const errorContent = `Sorry, I encountered an error while generating your research paper: ${error.message}. Please try again.`;
          
          // Add error message
          setMessages(prev => {
            return [...prev, { 
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
      console.error('[useKognysChat] Error in sendMessage:', err);
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