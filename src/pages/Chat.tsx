import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, StopCircle, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKognysChat } from '@/hooks/useKognysChat';
import { chatStore, type Chat as ChatType } from '@/lib/chatStore';
import { ClaudeSidebar } from '@/components/ClaudeSidebar';
import ReactMarkdown from 'react-markdown';
import { PageLoader } from '@/components/PageLoader';
import { ThreadedAgentMessage, AgentThreadContainer } from '@/components/ThreadedAgentMessage';
import { ConnectableMessage, AgentInteractionConnector } from '@/components/AgentInteractionConnector';
import { ReasoningToggle } from '@/components/ReasoningToggle';
import { ResearchPhaseIndicator } from '@/components/ResearchPhaseIndicator';
import type { AgentInteractionMessage } from '@/types/agentInteraction';

const Chat = () => {
  const location = useLocation();
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [currentChat, setCurrentChat] = useState<ChatType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // On desktop, default to open; on mobile, default to closed
    const isDesktop = window.innerWidth >= 768;
    const savedState = localStorage.getItem('kognys_sidebar_open');
    if (savedState !== null) {
      return JSON.parse(savedState);
    }
    return isDesktop;
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [showReasoning, setShowReasoning] = useState(() => {
    const savedState = localStorage.getItem('kognys_show_reasoning');
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  
  // Refs for scrolling
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  // Initialize or get existing chat
  useEffect(() => {
    setIsInitializing(true);
    
    // Stop any ongoing streaming when switching chats
    if (stop) {
      stop();
    }
    
    if (chatId) {
      let chat = chatStore.getChat(chatId);
      if (!chat) {
        // Chat doesn't exist, create it with the current ID
        chat = chatStore.createChatWithId(chatId);
      }
      setCurrentChat(chat);
    }
    // If no chatId, don't redirect - just stay on the current route
    setIsInitializing(false);
  }, [chatId]);
  // Load messages from chat store when currentChat changes
  const [loadedMessages, setLoadedMessages] = useState<typeof currentChat.messages>([]);
  
  useEffect(() => {
    if (currentChat?.messages) {
      const nonTempMessages = currentChat.messages.filter(msg => !msg.temporary);
      setLoadedMessages(nonTempMessages);
    }
  }, [currentChat]);

  const { 
    messages, 
    input, 
    status, 
    handleInputChange, 
    handleSubmit: originalHandleSubmit, 
    setInput,
    stop,
    isLoading 
  } = useKognysChat({
    throttle: 50,
    initialMessages: loadedMessages,
    onMessage: (message) => {
      // Save message to chat store (excluding temporary status messages)
      if (chatId && !message.temporary) {
        chatStore.addMessage(chatId, message);
        // Update current chat state
        const updatedChat = chatStore.getChat(chatId);
        if (updatedChat) {
          setCurrentChat(updatedChat);
        }
      }
    }
  });
  
  // Cleanup on unmount or chat change
  useEffect(() => {
    return () => {
      // Stop any ongoing streaming when component unmounts or chat changes
      if (stop) {
        stop();
      }
    };
  }, [chatId, stop]);
  
  // Wrap handleSubmit to add scrolling
  const handleSubmit = async (e: React.FormEvent) => {
    await originalHandleSubmit(e);
    // Scroll to bottom when submitting
    setTimeout(() => scrollToBottom(), 100);
  };
  
  useEffect(() => {
    const initialMessage = location.state?.initialMessage;
    // Only auto-submit if we have an initial message and this is a new chat (no loaded messages)
    if (initialMessage && messages.length === 0 && loadedMessages.length === 0 && !isInitializing) {
      setInput(initialMessage);
      // Auto-submit the initial message
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          form.dispatchEvent(new Event('submit', { bubbles: true }));
        }
      }, 100);
      // Clear the location state to prevent re-submission on subsequent navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, messages.length, loadedMessages.length, setInput, isInitializing, navigate, location.pathname]);

  // Auto-hide reasoning when streaming completes
  useEffect(() => {
    if (status === 'ready' && messages.some(msg => msg.role === 'agent')) {
      // Auto-hide reasoning when a response is complete
      setShowReasoning(false);
    } else if (status === 'streaming' || status === 'submitted') {
      // Auto-show reasoning when starting a new request
      setShowReasoning(true);
    }
  }, [status, messages]);

  const toggleReasoning = () => {
    const newState = !showReasoning;
    setShowReasoning(newState);
    localStorage.setItem('kognys_show_reasoning', JSON.stringify(newState));
    
    // Don't auto-scroll when user manually toggles
    // They might want to read from their current position
  };

  // Process messages and group agent conversations
  const { visibleMessages, agentThreads, phaseIndicators } = useMemo(() => {
    const threads: AgentInteractionMessage[][] = [];
    let currentThread: AgentInteractionMessage[] = [];
    const phases: { phase: string; iteration: number; messageIndex: number }[] = [];
    let currentIteration = 0;
    
    messages.forEach((msg, index) => {
      if (msg.role === 'agent') {
        currentThread.push(msg as AgentInteractionMessage);
        
        // Detect phase changes
        const msgLower = msg.content.toLowerCase();
        const agentLower = msg.agentName?.toLowerCase() || '';
        
        if (msg.messageType === 'research_started' || msgLower.includes('starting research')) {
          phases.push({ phase: 'research', iteration: currentIteration, messageIndex: index });
        } else if (agentLower.includes('validator') && !phases.some(p => p.phase === 'validation' && p.iteration === currentIteration)) {
          phases.push({ phase: 'validation', iteration: currentIteration, messageIndex: index });
        } else if (agentLower.includes('synthesizer') && !phases.some(p => p.phase === 'synthesis' && p.iteration === currentIteration)) {
          phases.push({ phase: 'synthesis', iteration: currentIteration, messageIndex: index });
        } else if ((agentLower.includes('challenger') || msg.messageType === 'criticisms_received') && !phases.some(p => p.phase === 'critique' && p.iteration === currentIteration)) {
          phases.push({ phase: 'critique', iteration: currentIteration, messageIndex: index });
        } else if (msgLower.includes('finalizing') || msgLower.includes('complete')) {
          phases.push({ phase: 'finalize', iteration: currentIteration, messageIndex: index });
        } else if (msgLower.includes('another round') || msgLower.includes('additional research')) {
          currentIteration++;
        }
      } else if (currentThread.length > 0) {
        threads.push(currentThread);
        currentThread = [];
      }
    });
    
    if (currentThread.length > 0) {
      threads.push(currentThread);
    }
    
    // Filter visible messages
    const visible = messages.filter(msg => {
      // Always hide status messages (orange logs)
      if (msg.role === 'status') {
        return false;
      }
      // Hide agent messages if reasoning is hidden
      if (msg.role === 'agent' && !showReasoning) {
        return false;
      }
      return true;
    });
    
    return { visibleMessages: visible, agentThreads: threads, phaseIndicators: phases };
  }, [messages, showReasoning]);

  // Smooth scroll to bottom function
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    // Check if we have new messages
    if (messages.length > lastMessageCountRef.current) {
      // Only auto-scroll if user is near the bottom or if it's a reasoning message
      const shouldScroll = () => {
        if (!scrollAreaRef.current) return true;
        
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (!scrollContainer) return true;
        
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        
        // Always scroll for agent messages when visible
        const lastMessage = messages[messages.length - 1];
        const isAgentMessage = lastMessage && lastMessage.role === 'agent';
        
        return isNearBottom || (isAgentMessage && showReasoning);
      };
      
      if (shouldScroll()) {
        // Use a small delay to ensure DOM has updated
        setTimeout(() => scrollToBottom(), 100);
      }
    }
    
    lastMessageCountRef.current = messages.length;
  }, [messages, showReasoning]);

  if (isInitializing) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-background font-inter flex">
      {/* Sidebar */}
      <ClaudeSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-200",
        sidebarOpen ? "md:ml-64" : "md:ml-0"
      )}>
        {/* Header with menu button - Fixed */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/40">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newState = !sidebarOpen;
                setSidebarOpen(newState);
                localStorage.setItem('kognys_sidebar_open', JSON.stringify(newState));
              }}
              className="h-8 w-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <h1 className="font-medium text-sm md:hidden">Kognys</h1>
            <div className="w-8 md:hidden" /> {/* Spacer for centering on mobile */}
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-hidden pb-24">
          <ScrollArea ref={scrollAreaRef} className="h-full">
            <div className="w-full flex justify-center">
              <div className="w-full max-w-4xl px-6 py-16">
            {visibleMessages.length === 0 ? (
              <div className="text-center py-32">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/5 mb-6">
                  <Bot className="w-8 h-8 text-primary/60" strokeWidth={1.5} />
                </div>
                <p className="text-muted-foreground/60 text-sm font-light">Ready to assist with your research</p>
              </div>
            ) : (
              <div className="space-y-12">
                
                {(() => {
                  let toggleShown = false;
                  let threadIndex = 0;
                  
                  return messages.map((message, index) => {
                    // Skip rendering status messages entirely
                    if (message.role === 'status') {
                      return null;
                    }
                    
                    // Check if this is the very first agent message
                    const isFirstAgentMessage = message.role === 'agent' && 
                      !messages.slice(0, index).some(m => m.role === 'agent');
                    
                    // Skip rendering if it's an agent message and reasoning is hidden
                    if (message.role === 'agent' && !showReasoning) {
                      // Show toggle only for the very first agent message when hidden
                      if (isFirstAgentMessage && !toggleShown) {
                        toggleShown = true;
                        return (
                          <div key={`toggle-${message.id}`} className="flex justify-center my-4">
                            <ReasoningToggle
                              isVisible={showReasoning}
                              onToggle={toggleReasoning}
                            />
                          </div>
                        );
                      }
                      return null;
                    }
                    
                    return (
                      <React.Fragment key={message.id}>
                        {/* Show toggle only before the very first agent message when visible */}
                        {isFirstAgentMessage && message.role === 'agent' && !toggleShown && (() => {
                          toggleShown = true;
                          return (
                            <div className="flex justify-center my-4">
                              <ReasoningToggle
                                isVisible={showReasoning}
                                onToggle={toggleReasoning}
                              />
                            </div>
                          );
                        })()}
                        
                        {message.role === 'user' ? (
                          <div className="group transition-all duration-300">
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
                          </div>
                        ) : message.role === 'agent' ? (
                          // Check if this is the start of a new thread
                          (() => {
                            const prevMessage = index > 0 ? messages[index - 1] : null;
                            const isNewThread = !prevMessage || prevMessage.role !== 'agent';
                            const currentAgentThread = isNewThread && threadIndex < agentThreads.length ? agentThreads[threadIndex++] : null;
                            
                            if (currentAgentThread && isNewThread) {
                              // Check if we should show a phase indicator
                              const phaseForThisMessage = phaseIndicators.find(p => p.messageIndex === index);
                              
                              // Render the entire thread at once
                              return (
                                <div className="my-6 relative">
                                  {/* Show phase indicator if this is the start of a new phase */}
                                  {phaseForThisMessage && (
                                    <div className="mb-4 flex justify-center">
                                      <ResearchPhaseIndicator 
                                        phase={phaseForThisMessage.phase as any}
                                        iterationNumber={phaseForThisMessage.iteration > 0 ? phaseForThisMessage.iteration : undefined}
                                      />
                                    </div>
                                  )}
                                  
                                  <AgentThreadContainer messages={currentAgentThread} />
                                  
                                  {/* Add connectors between messages */}
                                  {currentAgentThread.map((msg, idx) => {
                                    if (idx === 0) return null;
                                    const prevMsg = currentAgentThread[idx - 1];
                                    if (prevMsg.targetAgent === msg.agentName) {
                                      return (
                                        <AgentInteractionConnector
                                          key={`connector-${prevMsg.id}-${msg.id}`}
                                          fromElement={`msg-${prevMsg.id}`}
                                          toElement={`msg-${msg.id}`}
                                          type={msg.messageType === 'criticisms_received' ? 'critique' : 'direct'}
                                          animated={true}
                                        />
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              );
                            }
                            return null;
                          })()
                        ) : (
                          <div className="group transition-all duration-300">
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
                                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-primary/30 pl-4 my-4 italic text-muted-foreground" {...props} />,
                                      a: ({node, ...props}) => <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props} />
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                  {(status === 'streaming' && messages.findIndex(m => m.id === message.id) === messages.length - 1) && (
                                    <span className="inline-block w-0.5 h-5 bg-primary/60 ml-0.5 animate-pulse" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  });
                })()}
                
                {(status === 'submitted' || (status === 'streaming' && messages[messages.length - 1]?.role !== 'assistant')) && (
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
              {/* Scroll anchor */}
              <div ref={messagesEndRef} className="h-4" />
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Chat Input - Fixed at bottom */}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 border-t border-border/40 bg-background/95 backdrop-blur-lg z-10 transition-all duration-200",
          sidebarOpen ? "md:left-64" : "md:left-0"
        )}>
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