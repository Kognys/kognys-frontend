import { useChat } from 'ai/react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  Square, 
  RotateCcw, 
  Paperclip, 
  X, 
  AlertCircle,
  ArrowLeft,
  Copy,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';

const ChatRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    status, 
    error,
    stop,
    reload,
    setInput,
    setMessages
  } = useChat({
    api: '/api/chat',
    streamProtocol: 'text',
    id: id || undefined,
    initialMessages: [],
    onFinish: (message, { usage, finishReason }) => {
      console.log('Message finished:', { usage, finishReason });
    },
    onError: (error) => {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
    onResponse: (response) => {
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle initial message from homepage
  useEffect(() => {
    const initialMessage = location.state?.initialMessage;
    if (initialMessage && messages.length === 0) {
      setInput(initialMessage);
      // Auto-submit after a brief delay
      setTimeout(() => {
        const syntheticEvent = new Event('submit') as any;
        syntheticEvent.preventDefault = () => {};
        handleSubmit(syntheticEvent, {
          experimental_attachments: files,
        });
      }, 500);
    }
  }, [location.state, messages.length, setInput, handleSubmit, files]);

  const handleFileSubmit = (event: React.FormEvent) => {
    handleSubmit(event, {
      experimental_attachments: files,
    });
    
    // Reset files
    setFiles(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCopyMessage = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(messages.filter(message => message.id !== messageId));
  };

  const removeFile = (index: number) => {
    if (files) {
      const newFiles = Array.from(files);
      newFiles.splice(index, 1);
      const dt = new DataTransfer();
      newFiles.forEach(file => dt.items.add(file));
      setFiles(dt.files);
    }
  };

  const isLoading = status === 'submitted' || status === 'streaming';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              <span className="font-semibold">AI Research Assistant</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={status === 'ready' ? 'default' : 'secondary'}>
              {status === 'ready' && '🟢 Ready'}
              {status === 'submitted' && '🟡 Thinking...'}
              {status === 'streaming' && '🔵 Responding...'}
              {status === 'error' && '🔴 Error'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="max-w-4xl mx-auto px-4 py-8">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Ready to assist</h3>
                <p className="text-muted-foreground">
                  Ask me anything about research, DeSci, or any other topic
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <Card key={message.id} className={`p-6 ${
                    message.role === 'user' 
                      ? 'ml-12 bg-primary/5 border-primary/20' 
                      : 'mr-12 bg-card border-border/30'
                  }`}>
                    <div className="flex gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user' 
                          ? 'bg-primary/20 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-4 h-4" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          <time className="text-xs text-muted-foreground">
                            {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
                          </time>
                        </div>
                        
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <p className="whitespace-pre-wrap text-foreground leading-relaxed">
                            {message.content}
                          </p>
                        </div>

                        {/* Attachments */}
                        {message.experimental_attachments && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {message.experimental_attachments
                              .filter(attachment => attachment.contentType?.startsWith('image/'))
                              .map((attachment, index) => (
                                <img
                                  key={`${message.id}-${index}`}
                                  src={attachment.url}
                                  alt={attachment.name}
                                  className="max-w-xs rounded-lg border border-border/30"
                                />
                              ))}
                          </div>
                        )}

                        {/* Message Actions */}
                        <div className="flex items-center gap-1 mt-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyMessage(message.content, message.id)}
                            className="h-8 px-2"
                          >
                            {copiedMessageId === message.id ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                          
                          {message.role === 'assistant' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteMessage(message.id)}
                              className="h-8 px-2 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                
                {/* Loading State */}
                {isLoading && (
                  <Card className="mr-12 bg-card border-border/30 p-6">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">AI Assistant</span>
                          <Badge variant="secondary" className="text-xs">
                            {status === 'submitted' ? 'Thinking...' : 'Typing...'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}
            
            {/* Error State */}
            {error && (
              <Card className="mr-12 bg-destructive/5 border-destructive/20 p-6">
                <div className="flex gap-4">
                  <AlertCircle className="w-6 h-6 text-destructive flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-destructive mb-2">Something went wrong</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      We encountered an error while processing your request.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reload()}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-md border-t border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* File Attachments Preview */}
          {files && files.length > 0 && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Attachments</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.from(files).map((file, index) => (
                  <div key={index} className="flex items-center gap-1 bg-background px-2 py-1 rounded text-sm">
                    <span className="truncate max-w-[100px]">{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-5 w-5 p-0 hover:bg-destructive/20"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isLoading && (
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => stop()}
                className="flex items-center gap-2"
              >
                <Square className="w-3 h-3" />
                Stop Generation
              </Button>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleFileSubmit} className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask me anything about research, DeSci, or any topic..."
                className="min-h-[60px] pr-12 resize-none"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleFileSubmit(e);
                  }
                }}
              />
              
              {/* File Input */}
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(e.target.files);
                  }
                }}
                multiple
                accept="image/*,text/*"
                className="hidden"
              />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-2 top-2 h-8 w-8 p-0"
                disabled={isLoading}
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              type="submit"
              disabled={(!input.trim() && !files?.length) || isLoading}
              className="h-[60px] px-6"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;