import { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, StopCircle, Menu } from 'lucide-react';
import { useKognysChat } from '@/hooks/useKognysChat';
import { chatStore, type Chat as ChatType } from '@/lib/chatStore';
import { ClaudeSidebar } from '@/components/ClaudeSidebar';
import ReactMarkdown from 'react-markdown';

const Chat = () => {
  const location = useLocation();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [currentChat, setCurrentChat] = useState<ChatType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Initialize or get existing chat
  useEffect(() => {
    if (chatId) {
      let chat = chatStore.getChat(chatId);
      if (!chat) {
        // Chat doesn't exist, create it with the current ID
        chat = chatStore.createChatWithId(chatId);
      }
      setCurrentChat(chat);
    }
    // If no chatId, don't redirect - just stay on the current route
  }, [chatId]);
  const { 
    messages, 
    input, 
    status, 
    handleInputChange, 
    handleSubmit, 
    setInput,
    stop,
    isLoading 
  } = useKognysChat({
    throttle: 50,
    initialMessages: currentChat?.messages || [],
    onMessage: (message) => {
      // Save message to chat store
      if (chatId) {
        chatStore.addMessage(chatId, message);
        // Update current chat state
        const updatedChat = chatStore.getChat(chatId);
        if (updatedChat) {
          setCurrentChat(updatedChat);
        }
      }
    }
  });
  
  useEffect(() => {
    const initialMessage = location.state?.initialMessage;
    if (initialMessage && messages.length === 0) {
      setInput(initialMessage);
      // Auto-submit the initial message
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }, 100);
    }
  }, [location.state, messages.length, setInput]);

  return (
    <div className="min-h-screen bg-background font-inter flex">
      {/* Sidebar */}
      <ClaudeSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col md:ml-64 pb-24">
        {/* Header with menu button on mobile */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="font-medium text-sm">Kognys</h1>
          <div className="w-8" /> {/* Spacer for centering */}
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-4xl px-6 py-16">
            {messages.length === 0 ? (
              <div className="text-center py-32">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/5 mb-6">
                  <Bot className="w-8 h-8 text-primary/60" strokeWidth={1.5} />
                </div>
                <p className="text-muted-foreground/60 text-sm font-light">Ready to assist with your research</p>
              </div>
            ) : (
              <div className="space-y-12">
                {messages.map((message, index) => (
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
                          <div className="text-sm font-medium text-muted-foreground/80 mb-3">Kognys Agent</div>
                          <div className="prose prose-neutral dark:prose-invert max-w-none">
                            <ReactMarkdown
                              components={{
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-6 mb-3 text-foreground first:mt-0" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-semibold mt-4 mb-2 text-foreground/90" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-5 space-y-1.5 mb-4" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-5 space-y-1.5 mb-4" {...props} />,
                                li: ({node, ...props}) => <li className="text-foreground/85 leading-relaxed" {...props} />,
                                p: ({node, ...props}) => <p className="mb-3 text-foreground/85 leading-relaxed last:mb-0" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground" {...props} />
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                            {(status === 'streaming' && index === messages.length - 1 && message.content) && (
                              <span className="inline-block w-0.5 h-5 bg-primary/60 ml-0.5 animate-pulse" />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {status === 'submitted' && (
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted/50 to-muted/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-muted-foreground/70" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground/80 mb-3">Kognys Agent</div>
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
            </div>
          </ScrollArea>
        </div>

        {/* Chat Input - Fixed at bottom */}
        <div className="fixed bottom-0 left-0 right-0 border-t border-border/40 bg-background/95 backdrop-blur-lg z-10 md:left-64">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder="Ask me anything..."
                  className="w-full h-14 px-6 pr-24 text-base font-light bg-muted/30 border-border/40 rounded-2xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/50"
                  disabled={isLoading}
                />
                <div className="absolute right-2 top-2 flex gap-1">
                  {(status === 'streaming' || status === 'submitted') && (
                    <Button 
                      type="button"
                      onClick={stop}
                      className="h-10 w-10 rounded-xl bg-red-500/90 hover:bg-red-500 transition-all duration-200"
                      size="sm"
                    >
                      <StopCircle className="w-4 h-4" strokeWidth={2} />
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isLoading}
                    className="h-10 w-10 rounded-xl bg-primary/90 hover:bg-primary disabled:opacity-30 transition-all duration-200"
                    size="sm"
                  >
                    <Send className="w-4 h-4" strokeWidth={2} />
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;