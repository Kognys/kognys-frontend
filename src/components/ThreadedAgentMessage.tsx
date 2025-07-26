import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, MessageSquare, Brain, FileText, Search, Zap } from 'lucide-react';
import { AgentInteractionMessage } from '@/types/agentInteraction';

interface ThreadedAgentMessageProps {
  id?: string;
  agentName: string;
  agentRole?: string;
  message: string;
  messageType?: 'thinking' | 'speaking' | 'analyzing' | 'concluding';
  targetAgent?: string;
  isHighlighted?: boolean;
  isReply?: boolean;
  showConnector?: boolean;
  connectorType?: 'direct' | 'indirect' | 'critique';
  className?: string;
}

// Enhanced agent emoji and icon mapping
const getAgentIcon = (name: string, role?: string) => {
  const nameLower = name.toLowerCase();
  const roleLower = role?.toLowerCase() || '';
  
  if (nameLower.includes('validator') || nameLower.includes('input')) {
    return { emoji: '🕵️‍♂️', icon: <MessageSquare className="w-4 h-4" /> };
  } else if (nameLower.includes('retriever') || nameLower.includes('document')) {
    return { emoji: '📚', icon: <Search className="w-4 h-4" /> };
  } else if (nameLower.includes('synthesizer') || nameLower.includes('synthesis')) {
    return { emoji: '📝', icon: <FileText className="w-4 h-4" /> };
  } else if (nameLower.includes('challenger') || nameLower.includes('review')) {
    return { emoji: '🧠', icon: <Brain className="w-4 h-4" /> };
  } else if (nameLower.includes('orchestrator') || nameLower.includes('coordinator')) {
    return { emoji: '🧑‍⚖️', icon: <Zap className="w-4 h-4" /> };
  } else if (nameLower.includes('query') || nameLower.includes('refiner')) {
    return { emoji: '🔍', icon: <Search className="w-4 h-4" /> };
  }
  return { emoji: '👤', icon: null };
};

// Enhanced color scheme for better distinction
const getAgentColor = (name: string) => {
  const baseColors: Record<string, string> = {
    'orchestrator': 'from-purple-500 to-purple-600',
    'validator': 'from-blue-500 to-blue-600',
    'retriever': 'from-green-500 to-green-600',
    'synthesizer': 'from-amber-500 to-amber-600',
    'challenger': 'from-red-500 to-red-600',
    'query': 'from-indigo-500 to-indigo-600',
    'refiner': 'from-indigo-500 to-indigo-600',
  };
  
  const nameLower = name.toLowerCase();
  for (const [key, color] of Object.entries(baseColors)) {
    if (nameLower.includes(key)) {
      return color;
    }
  }
  
  // Fallback gradient
  return 'from-gray-500 to-gray-600';
};

export const ThreadedAgentMessage = ({ 
  id,
  agentName, 
  agentRole,
  message,
  messageType = 'speaking',
  targetAgent,
  isHighlighted = false,
  isReply = false,
  showConnector = false,
  connectorType = 'direct',
  className
}: ThreadedAgentMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { emoji, icon } = getAgentIcon(agentName, agentRole);
  const agentGradient = getAgentColor(agentName);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const getMessageTypeStyle = () => {
    switch (messageType) {
      case 'thinking':
        return 'opacity-70 italic';
      case 'analyzing':
        return 'font-medium';
      case 'concluding':
        return 'font-semibold';
      default:
        return '';
    }
  };

  const getConnectorStyle = () => {
    switch (connectorType) {
      case 'critique':
        return 'border-red-400 border-dashed';
      case 'indirect':
        return 'border-gray-300 border-dotted';
      default:
        return 'border-gray-400';
    }
  };

  return (
    <div
      className={cn(
        'relative transition-all duration-300 agent-message-enter',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        isHighlighted && 'message-highlight',
        isReply && 'ml-12',
        className
      )}
    >
      {/* Connector Line */}
      {showConnector && (
        <div 
          className={cn(
            'absolute -left-6 top-5 w-6 h-0.5',
            getConnectorStyle(),
            'transition-all duration-200'
          )}
        />
      )}

      {/* Message Container */}
      <div
        id={`msg-${id || agentName + Date.now()}`}
        className={cn(
          'flex items-start gap-3 p-3 rounded-lg transition-all duration-200',
          isHighlighted && 'bg-primary/5 border border-primary/20'
        )}
      >
        {/* Enhanced Agent Avatar */}
        <div className="flex-shrink-0 relative">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shadow-md text-lg',
            'bg-gradient-to-br text-white agent-avatar',
            agentGradient
          )}>
            {icon || emoji}
          </div>
        </div>

        {/* Message Content */}
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{agentName}</span>
            {agentRole && (
              <span className="text-xs text-muted-foreground">({agentRole})</span>
            )}
            {targetAgent && (
              <>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{targetAgent}</span>
              </>
            )}
            {messageType === 'thinking' && (
              <span className="text-xs text-muted-foreground italic agent-thinking">thinking</span>
            )}
          </div>
          
          <div className={cn(
            'text-sm text-foreground/90 leading-relaxed prose prose-sm dark:prose-invert max-w-none',
            getMessageTypeStyle()
          )}>
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside ml-2 space-y-1 mb-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside ml-2 space-y-1 mb-2" {...props} />,
                li: ({node, ...props}) => <li className="text-sm" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-primary/30 pl-2 my-2 italic text-muted-foreground text-sm" {...props} />
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
};

// Thread Container Component
interface AgentThreadContainerProps {
  messages: AgentInteractionMessage[];
  className?: string;
}

export const AgentThreadContainer = ({ 
  messages, 
  className
}: AgentThreadContainerProps) => {
  return (
    <div className={cn(
      'relative border-l-2 border-muted ml-5 pl-6 space-y-2',
      className
    )}>
      {/* Thread Messages */}
      {messages.map((message, index) => {
        const isReply = index > 0;
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showConnector = isReply && prevMessage?.agentName !== message.agentName;
        
        return (
          <ThreadedAgentMessage
            key={message.id}
            id={message.id}
            agentName={message.agentName || 'Agent'}
            agentRole={message.agentRole}
            message={message.content}
            messageType={message.messageType as 'thinking' | 'speaking' | 'analyzing' | 'concluding'}
            targetAgent={message.targetAgent}
            isHighlighted={message.isHighlighted}
            isReply={isReply}
            showConnector={showConnector}
            connectorType={message.messageType === 'criticisms_received' ? 'critique' : 'direct'}
          />
        );
      })}
    </div>
  );
};