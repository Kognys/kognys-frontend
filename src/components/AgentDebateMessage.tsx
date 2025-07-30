import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface AgentDebateMessageProps {
  agentName: string;
  agentRole?: string;
  message: string;
  messageType?: 'thinking' | 'speaking' | 'analyzing' | 'concluding';
  className?: string;
}

// Agent emoji mapping based on name or role
const getAgentEmoji = (name: string, role?: string) => {
  const nameLower = name.toLowerCase();
  const roleLower = role?.toLowerCase() || '';
  
  if (nameLower.includes('validator') || nameLower.includes('input')) {
    return '🕵️‍♂️';
  } else if (nameLower.includes('retriever') || nameLower.includes('document')) {
    return '📚';
  } else if (nameLower.includes('synthesizer') || nameLower.includes('synthesis')) {
    return '📝';
  } else if (nameLower.includes('challenger') || nameLower.includes('review')) {
    return '🧠';
  } else if (nameLower.includes('orchestrator') || nameLower.includes('coordinator')) {
    return '🧑‍⚖️';
  } else if (nameLower.includes('publisher') || nameLower.includes('archivist')) {
    return '🔗';
  }
  return '👤';
};

// Agent color mapping
const getAgentColor = (name: string) => {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
    'bg-yellow-500',
    'bg-red-500'
  ];
  
  // Generate consistent color based on agent name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const AgentDebateMessage = ({ 
  agentName, 
  agentRole, 
  message, 
  messageType = 'speaking',
  className 
}: AgentDebateMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const emoji = getAgentEmoji(agentName, agentRole);
  const agentColor = getAgentColor(agentName);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
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

  return (
    <div
      className={cn(
        'flex items-start gap-3 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        className
      )}
    >
      {/* Agent Avatar */}
      <div className="flex-shrink-0">
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shadow-md text-lg',
          agentColor
        )}>
          {emoji}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">{agentName}</span>
          {agentRole && (
            <span className="text-xs text-muted-foreground">({agentRole})</span>
          )}
          {messageType === 'thinking' && (
            <span className="text-xs text-muted-foreground italic">thinking...</span>
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
              blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-primary/30 pl-2 my-2 italic text-muted-foreground text-sm" {...props} />,
              img: ({node, ...props}) => (
                <img 
                  className="inline-block w-5 h-5 mr-1 align-text-bottom" 
                  {...props} 
                />
              )
            }}
          >
            {message}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

// Component for showing active debate participants
export const AgentDebatePanel = ({ 
  agents 
}: { 
  agents: Array<{ name: string; role: string; position?: string }> 
}) => {
  return (
    <div className="flex items-center justify-center gap-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground font-medium">Active Agents:</span>
        <div className="flex -space-x-2">
          {agents.map((agent, index) => {
            const emoji = getAgentEmoji(agent.name, agent.role);
            const color = getAgentColor(agent.name);
            return (
              <div
                key={`${agent.name}-${index}`}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center shadow-sm border-2 border-background text-sm',
                  color
                )}
                title={`${agent.name} - ${agent.role}`}
              >
                {emoji}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};