import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User } from 'lucide-react';

const Chat = () => {
  const location = useLocation();
  const [customMessages, setCustomMessages] = useState<any[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [customLoading, setCustomLoading] = useState(false);
  
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: customInput,
    };

    setCustomMessages(prev => [...prev, userMessage]);
    setCustomLoading(true);
    setCustomInput('');

    // Create streaming AI response
    const assistantMessageId = (Date.now() + 1).toString();
    const fullResponse = `This is a mock AI response for your research request. In a real implementation, this would be connected to an actual AI service like OpenAI, Anthropic, or your custom AI agents.

Your request: "${userMessage.content}"

This would typically generate a detailed research paper or analysis based on your prompt. The streaming effect makes it feel more interactive and engaging, simulating how real AI models generate responses token by token.

Here's some additional content to demonstrate the streaming effect working with longer responses that would typically take more time to generate in a real AI application.`;

    // Add empty assistant message first
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    setCustomMessages(prev => [...prev, assistantMessage]);
    setCustomLoading(false);

    // Stream the response character by character
    let currentIndex = 0;
    const streamingInterval = setInterval(() => {
      if (currentIndex < fullResponse.length) {
        const chunk = fullResponse.slice(0, currentIndex + 1);
        setCustomMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: chunk }
              : msg
          )
        );
        currentIndex++;
      } else {
        clearInterval(streamingInterval);
      }
    }, 20); // Adjust speed by changing interval (lower = faster)
  };
  
  useEffect(() => {
    const initialMessage = location.state?.initialMessage;
    if (initialMessage && customMessages.length === 0) {
      setCustomInput(initialMessage);
      // Auto-submit the initial message
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }, 100);
    }
  }, [location.state, customMessages.length]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-3xl mx-auto px-4 py-8">
            {customMessages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation to see results here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {customMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-2xl p-4 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-secondary/30 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                
                {customLoading && (
                  <div className="flex gap-4 justify-start">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Input */}
      <div className="border-t bg-background/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <form onSubmit={handleCustomSubmit} className="flex gap-2">
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1"
              disabled={customLoading}
            />
            <Button type="submit" disabled={!customInput.trim() || customLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;