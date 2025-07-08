
import { useState, useEffect } from 'react';
import { ChatInput, ChatInputTextArea, ChatInputSubmit } from './SimpleChatInput';
import { kognysChatService } from '@/services/kognysChatService';
import { ChatMessage } from '@/types/kognys';
import { toast } from 'sonner';

const SimpleChat = () => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStreamContent, setCurrentStreamContent] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        await kognysChatService.initializeConnection();
        setIsConnected(true);
        console.log('Ready to send messages to Kognys API');
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

  const handleSubmit = () => {
    if (!value.trim()) return;
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: value,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setCurrentStreamContent('');
    
    const messageContent = value;
    setValue('');

    if (!isConnected) {
      // Fallback simulation for offline mode
      setTimeout(() => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I'm currently in offline mode. Please check your connection to access the full Kognys AI capabilities.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        setLoading(false);
      }, 1500);
      return;
    }

    kognysChatService.sendMessage(
      messageContent,
      (chunk) => {
        setCurrentStreamContent(prev => prev + chunk.content);
      },
      (response) => {
        setMessages(prev => [...prev, response]);
        setCurrentStreamContent('');
        setLoading(false);
      },
      (error) => {
        console.error('Chat error:', error);
        toast.error('Failed to send message. Please try again.');
        setLoading(false);
        setCurrentStreamContent('');
      }
    );
  };

  const handleStop = () => {
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Connection Status */}
      {!isConnected && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-center">
          <p className="text-yellow-200 text-sm">
            ⚠️ Offline Mode - Limited functionality available
          </p>
        </div>
      )}

      {/* Messages Display */}
      {messages.length > 0 && (
        <div className="bg-card/20 backdrop-blur-md border border-border/30 rounded-2xl p-4 max-h-96 overflow-y-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-secondary-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.context?.knowledgeUsed && message.context.knowledgeUsed.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {message.context.knowledgeUsed.slice(0, 3).map((knowledge) => (
                      <span
                        key={knowledge.id}
                        className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full"
                      >
                        {knowledge.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Streaming Response */}
          {loading && currentStreamContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-4 py-2 rounded-2xl bg-secondary/50 text-secondary-foreground">
                <p className="text-sm whitespace-pre-wrap">{currentStreamContent}</p>
                <div className="inline-block w-2 h-4 bg-primary animate-pulse ml-1" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Chat Input */}
      <ChatInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSubmit={handleSubmit}
        loading={loading}
        onStop={handleStop}
        className="bg-card/30 backdrop-blur-md border-border/30"
      >
        <ChatInputTextArea 
          placeholder={isConnected ? "Ask about blockchain or AI..." : "Ask a question (offline mode)..."}
          className="text-foreground placeholder:text-muted-foreground"
        />
        <ChatInputSubmit />
      </ChatInput>
    </div>
  );
};

export default SimpleChat;
