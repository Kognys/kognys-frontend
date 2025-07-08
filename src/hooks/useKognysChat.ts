import { useState, useEffect, useCallback } from 'react';
import { kognysChatService } from '@/services/kognysChatService';
import { ChatMessage } from '@/types/kognys';
import { toast } from 'sonner';

export function useKognysChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentStreamContent, setCurrentStreamContent] = useState('');

  useEffect(() => {
    setIsConnected(kognysChatService.getConnectionStatus());
    
    return () => {
      kognysChatService.disconnect();
    };
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setCurrentStreamContent('');

    try {
      // 1. Primeiro cria a sessão se não existir
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        currentSessionId = await kognysChatService.createSession();
        setSessionId(currentSessionId);
      }

      // 2. Envia a mensagem com o sessionId
      kognysChatService.sendMessage(
        content,
        (chunk) => {
          setCurrentStreamContent(prev => prev + chunk.content);
        },
        (response) => {
          setMessages(prev => [...prev, response]);
          setCurrentStreamContent('');
          setIsLoading(false);
        },
        (error) => {
          console.error('Chat error:', error);
          toast.error('Failed to send message. Please try again.');
          setIsLoading(false);
          setCurrentStreamContent('');
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message. Please try again.');
      setIsLoading(false);
      setCurrentStreamContent('');
    }
  }, [sessionId]);

  const stopGeneration = useCallback(() => {
    setIsLoading(false);
    setCurrentStreamContent('');
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentStreamContent('');
  }, []);

  const loadChatHistory = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const history = await kognysChatService.getChatHistory(sessionId);
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Failed to load chat history');
    }
  }, [sessionId]);

  return {
    messages,
    isLoading,
    isConnected,
    sessionId,
    currentStreamContent,
    sendMessage,
    stopGeneration,
    clearMessages,
    loadChatHistory
  };
}