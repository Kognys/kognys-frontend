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
    const initializeChat = async () => {
      try {
        await kognysChatService.initializeConnection();
        setIsConnected(true);
        console.log('Kognys chat initialized, ready to send messages');
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        setIsConnected(false);
      }
    };

    initializeChat();

    return () => {
      kognysChatService.disconnect();
    };
  }, []);

  const sendMessage = useCallback((content: string) => {
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

    if (!isConnected) {
      // Fallback for offline mode
      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm currently in offline mode. Please check your connection to access the full Kognys AI capabilities.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setIsLoading(false);
      }, 1500);
      return;
    }

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
  }, [isConnected]);

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