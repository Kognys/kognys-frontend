import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, User, Menu } from 'lucide-react';
import { useKognysChat } from '@/hooks/useKognysChat';
import { ChatInput } from '@/components/ChatInput';
import { Sidebar } from '@/components/Sidebar';
import { chatStore, type Chat } from '@/lib/chatStore';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);


  // Initialize or get existing chat
  useEffect(() => {
    if (chatId) {
      let chat = chatStore.getChat(chatId);
      if (!chat) {
        // Chat doesn't exist, create a new one with this ID
        const newChat = chatStore.createChat();
        navigate(`/chat/${newChat.id}`, { replace: true });
        return;
      }
      setCurrentChat(chat);
    } else {
      // No chatId, create new chat and redirect
      const newChat = chatStore.createChat();
      navigate(`/chat/${newChat.id}`, { replace: true });
    }
  }, [chatId, navigate]);

  const { 
    messages, 
    input, 
    status, 
    setInput,
    sendMessage,
    stop,
    isLoading 
  } = useKognysChat({
    throttle: 10,
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

  // Handle initial message from navigation state
  useEffect(() => {
    const initialMessage = location.state?.initialMessage;
    // Only auto-submit if we have an initial message and this is truly a new chat
    if (initialMessage && messages.length === 0 && currentChat && (!currentChat.messages || currentChat.messages.length === 0)) {
      setInput(initialMessage);
      // Auto-submit after a short delay
      setTimeout(() => {
        sendMessage({ content: initialMessage });
      }, 100);
      // Clear the location state to prevent re-submission
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, messages.length, currentChat, setInput, sendMessage, navigate, location.pathname]);

  const handleSubmit = async () => {
    if (!input.trim() || !chatId) return;
    
    const messageContent = input;
    setInput('');
    await sendMessage({ content: messageContent });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };


  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      
      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-200",
        sidebarOpen ? "md:ml-64" : "md:ml-0"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              className="md:hidden h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
              {currentChat?.title || 'New Chat'}
            </h1>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-950">
          <ScrollArea className="h-full">
            <div className="max-w-3xl mx-auto px-6 py-6 pb-32">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center max-w-md">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-4">
                      <Bot className="w-6 h-6 text-orange-600 dark:text-orange-400" strokeWidth={1.5} />
                    </div>
                    <h2 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">How can I help you today?</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">I can help you with research papers, scientific analysis, and academic writing.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((message, index) => (
                    <div key={message.id} className="group">
                      {message.role === 'user' ? (
                        <div className="flex gap-4 items-start">
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                            <User className="w-4 h-4 text-white" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">You</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap select-text" style={{ userSelect: 'text' }}>
                              {message.content}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-4 items-start">
                          <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-white" strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Kognys</div>
                            <div className="text-sm text-gray-900 dark:text-gray-100 leading-relaxed select-text" style={{ userSelect: 'text' }}>
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                                  h1: ({ children }) => <h1 className="text-lg font-semibold mb-3 mt-6 first:mt-0">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-base font-semibold mb-2 mt-5 first:mt-0">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-4 first:mt-0">{children}</h3>,
                                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                                  li: ({ children }) => <li className="text-sm">{children}</li>,
                                  code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                                  pre: ({ children }) => <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto mb-3">{children}</pre>,
                                  a: ({ children, href, ...props }) => <a className="text-blue-600 dark:text-blue-400 hover:underline" href={href} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>,
                                  img: ({ src, alt, ...props }) => <img className="inline-block w-5 h-5 mr-1 align-text-bottom" src={src} alt={alt} {...props} />
                                }}
                              >
                                {message.content}
                              </ReactMarkdown>
                              {(status === 'streaming' && index === messages.length - 1 && message.content) && (
                                <span className="inline-block w-0.5 h-4 bg-orange-500 ml-1 animate-pulse" />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {status === 'submitted' && (
                    <div className="flex gap-4 items-start">
                      <div className="w-7 h-7 rounded-full bg-orange-600 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Kognys</div>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                            <div className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Input - Fixed at bottom */}
        <ChatInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          onStop={stop}
          disabled={isLoading}
          isLoading={isLoading}
          canStop={status === 'streaming' || status === 'submitted'}
          placeholder="Message Kognys..."
        />
      </div>
    </div>
  );
};

export default ChatPage;