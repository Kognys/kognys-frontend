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
    }, 8); // Faster streaming speed
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
    <div className="min-h-screen bg-background font-inter flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto px-6 py-16">
            {customMessages.length === 0 ? (
              <div className="text-center py-32">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/5 mb-6">
                  <Bot className="w-8 h-8 text-primary/60" strokeWidth={1.5} />
                </div>
                <p className="text-muted-foreground/60 text-sm font-light">Ready to assist with your research</p>
              </div>
            ) : (
              <div className="space-y-12">
                {customMessages.map((message, index) => (
                  <div key={message.id} className="group">
                    {message.role === 'user' ? (
                      <div className="flex items-start gap-4 justify-end">
                        <div className="text-right">
                          <div className="inline-block text-sm font-medium text-primary/80 mb-2">You</div>
                          <div className="text-foreground/90 text-lg font-medium leading-relaxed">
                            {message.content}
                          </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mt-1">
                          <User className="w-5 h-5 text-primary/70" strokeWidth={1.5} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center mt-1">
                          <Bot className="w-5 h-5 text-muted-foreground/70" strokeWidth={1.5} />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-muted-foreground/80 mb-3">Assistant</div>
                          <div className="prose prose-neutral dark:prose-invert max-w-none">
                            <div className="text-foreground/90 text-base font-light leading-relaxed whitespace-pre-wrap">
                              {message.content}
                              {message.content && (
                                <span className="inline-block w-0.5 h-5 bg-primary/60 ml-0.5 animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {customLoading && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-muted-foreground/70" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground/80 mb-3">Assistant</div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-primary/40 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-primary/30 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-xs text-muted-foreground/60 font-light">Thinking...</span>
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
      <div className="border-t border-border/40 bg-background/60 backdrop-blur-lg">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <form onSubmit={handleCustomSubmit} className="relative">
            <div className="relative">
              <Input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full h-14 px-6 pr-14 text-base font-light bg-muted/30 border-border/40 rounded-2xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/50"
                disabled={customLoading}
              />
              <Button 
                type="submit" 
                disabled={!customInput.trim() || customLoading}
                className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary/90 hover:bg-primary disabled:opacity-30 transition-all duration-200"
                size="sm"
              >
                <Send className="w-4 h-4" strokeWidth={2} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;