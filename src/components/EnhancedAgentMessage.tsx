import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { ArrowRight, MessageSquare, Brain, FileText, Search, Zap, ChevronDown, ChevronRight, FileCode, Database } from 'lucide-react';
import { AgentInteractionMessage } from '@/types/agentInteraction';

interface EnhancedAgentMessageProps {
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

// Enhanced color palette with more vibrant separators
const getAgentColorScheme = (name: string) => {
  const colorSchemes: Record<string, { gradient: string; border: string; text: string; bg: string }> = {
    'orchestrator': {
      gradient: 'from-purple-500 to-purple-600',
      border: 'border-purple-400',
      text: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-950/30'
    },
    'validator': {
      gradient: 'from-blue-500 to-blue-600',
      border: 'border-blue-400',
      text: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-950/30'
    },
    'retriever': {
      gradient: 'from-emerald-500 to-emerald-600',
      border: 'border-emerald-400',
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: ''
    },
    'synthesizer': {
      gradient: 'from-amber-500 to-amber-600',
      border: 'border-amber-400',
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30'
    },
    'challenger': {
      gradient: 'from-rose-500 to-rose-600',
      border: 'border-rose-400',
      text: 'text-rose-600 dark:text-rose-400',
      bg: ''
    },
    'query': {
      gradient: 'from-indigo-500 to-indigo-600',
      border: 'border-indigo-400',
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30'
    },
    'refiner': {
      gradient: 'from-teal-500 to-teal-600',
      border: 'border-teal-400',
      text: 'text-teal-600 dark:text-teal-400',
      bg: 'bg-teal-50 dark:bg-teal-950/30'
    }
  };
  
  const nameLower = name.toLowerCase();
  for (const [key, scheme] of Object.entries(colorSchemes)) {
    if (nameLower.includes(key)) {
      return scheme;
    }
  }
  
  // Fallback scheme
  return {
    gradient: 'from-gray-500 to-gray-600',
    border: 'border-gray-400',
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-50 dark:bg-gray-950/30'
  };
};

// Enhanced agent icon mapping
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

// Collapsible section for complex content
interface CollapsibleSectionProps {
  title: string;
  content: string;
  type: 'query' | 'results' | 'documents';
  colorScheme: ReturnType<typeof getAgentColorScheme>;
}

const CollapsibleSection = ({ title, content, type, colorScheme }: CollapsibleSectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getIcon = () => {
    switch (type) {
      case 'query':
        return <FileCode className="w-4 h-4" />;
      case 'results':
        return <Search className="w-4 h-4" />;
      case 'documents':
        return <Database className="w-4 h-4" />;
    }
  };
  
  return (
    <div className={cn(
      "rounded-lg overflow-hidden transition-all duration-200",
      colorScheme.bg
    )}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center gap-2 p-3 hover:opacity-90 transition-opacity",
          colorScheme.text
        )}
      >
        {getIcon()}
        <span className="font-medium text-sm">{title}</span>
        <div className="ml-auto">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-0">
          <div className="text-sm opacity-80 font-mono whitespace-pre-wrap">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export const EnhancedAgentMessage = ({ 
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
}: EnhancedAgentMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { emoji, icon } = getAgentIcon(agentName, agentRole);
  const colorScheme = getAgentColorScheme(agentName);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Parse message for special sections
  const parseMessage = (content: string) => {
    const sections: { type: 'text' | 'query' | 'results' | 'documents'; content: string; title?: string }[] = [];
    
    // Check for query sections
    const queryMatch = content.match(/(?:OpenAlex|Semantic Scholar|arXiv):\s*([^]+?)(?=\n\n|$)/g);
    if (queryMatch) {
      queryMatch.forEach(match => {
        const [source, query] = match.split(/:\s*/, 2);
        sections.push({
          type: 'query',
          title: `${source} Query`,
          content: query.trim()
        });
      });
    }
    
    // Check for results sections
    const resultsMatch = content.match(/Found \d+ results.*$/m);
    if (resultsMatch) {
      const resultsIndex = content.indexOf(resultsMatch[0]);
      const resultsContent = content.substring(resultsIndex);
      sections.push({
        type: 'results',
        title: resultsMatch[0],
        content: resultsContent
      });
    }
    
    // Check for document lists
    const docsMatch = content.match(/(?:Retrieved|Selected) documents?:([^]+?)(?=\n\n|$)/);
    if (docsMatch) {
      sections.push({
        type: 'documents',
        title: 'Retrieved Documents',
        content: docsMatch[1].trim()
      });
    }
    
    // Add remaining text
    let remainingText = content;
    sections.forEach(section => {
      if (section.content) {
        remainingText = remainingText.replace(section.content, '');
      }
    });
    
    if (remainingText.trim()) {
      sections.unshift({
        type: 'text',
        content: remainingText.trim()
      });
    }
    
    return sections;
  };

  const messageSections = parseMessage(message);

  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        isReply && 'ml-12',
        className
      )}
    >
      {/* Colored connector line */}
      {showConnector && (
        <div 
          className={cn(
            'absolute -left-6 top-5 w-6 h-0.5',
            connectorType === 'critique' ? 'bg-rose-400' : colorScheme.border.replace('border-', 'bg-'),
            'transition-all duration-200'
          )}
        />
      )}

      {/* Message Container with colored border */}
      <div
        id={`msg-${id || agentName + Date.now()}`}
        className={cn(
          'rounded-lg border-l-4 transition-all duration-200',
          colorScheme.border
        )}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Enhanced Agent Avatar */}
          <div className="flex-shrink-0">
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center shadow-lg text-white',
              'bg-gradient-to-br',
              colorScheme.gradient
            )}>
              {icon || emoji}
            </div>
          </div>

          {/* Message Content */}
          <div className="flex-1 space-y-3">
            {/* Agent Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("font-semibold text-sm", colorScheme.text)}>{agentName}</span>
              {agentRole && (
                <span className="text-xs text-muted-foreground opacity-70">({agentRole})</span>
              )}
              {targetAgent && (
                <>
                  <ArrowRight className={cn("w-3 h-3", colorScheme.text)} />
                  <span className="text-xs font-medium">{targetAgent}</span>
                </>
              )}
              {messageType === 'thinking' && (
                <span className="text-xs text-muted-foreground italic opacity-60">thinking...</span>
              )}
            </div>
            
            {/* Message Body with sections */}
            <div className="space-y-3">
              {messageSections.map((section, idx) => {
                if (section.type === 'text') {
                  return (
                    <div 
                      key={idx}
                      className={cn(
                        'text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none',
                        messageType === 'thinking' && 'opacity-70 italic',
                        messageType === 'analyzing' && 'font-medium opacity-90',
                        messageType === 'concluding' && 'font-semibold'
                      )}
                    >
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside ml-2 space-y-1 mb-2" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside ml-2 space-y-1 mb-2" {...props} />,
                          li: ({node, ...props}) => <li className="text-sm opacity-90" {...props} />,
                          blockquote: ({node, ...props}) => (
                            <blockquote 
                              className={cn("border-l-2 pl-2 my-2 italic opacity-80", colorScheme.border)} 
                              {...props} 
                            />
                          )
                        }}
                      >
                        {section.content}
                      </ReactMarkdown>
                    </div>
                  );
                } else {
                  return (
                    <CollapsibleSection
                      key={idx}
                      title={section.title || section.type}
                      content={section.content}
                      type={section.type as 'query' | 'results' | 'documents'}
                      colorScheme={colorScheme}
                    />
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Thread Container Component
interface EnhancedAgentThreadContainerProps {
  messages: AgentInteractionMessage[];
  className?: string;
}

export const EnhancedAgentThreadContainer = ({ 
  messages, 
  className
}: EnhancedAgentThreadContainerProps) => {
  // Group messages by agent for better visual organization
  const messageGroups: { agent: string; messages: AgentInteractionMessage[] }[] = [];
  let currentGroup: { agent: string; messages: AgentInteractionMessage[] } | null = null;
  
  messages.forEach(msg => {
    if (!currentGroup || currentGroup.agent !== msg.agentName) {
      if (currentGroup) messageGroups.push(currentGroup);
      currentGroup = { agent: msg.agentName || 'Agent', messages: [msg] };
    } else {
      currentGroup.messages.push(msg);
    }
  });
  
  if (currentGroup) messageGroups.push(currentGroup);
  
  return (
    <div className={cn('space-y-4', className)}>
      {messages.map((message, index) => {
        const isReply = index > 0;
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const showConnector = false; // Disable connector lines in EnhancedAgentMessage
        
        return (
          <EnhancedAgentMessage
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