import { useEffect, useState } from 'react';
import { 
  Search, 
  FileSearch, 
  CheckCircle, 
  RefreshCw, 
  Loader2,
  FileText,
  Brain,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResearchStatusMessageProps {
  content: string;
  eventType?: string;
  className?: string;
}

export const ResearchStatusMessage = ({ 
  content, 
  eventType,
  className 
}: ResearchStatusMessageProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = () => {
    switch (eventType) {
      case 'research_started':
        return <Search className="h-4 w-4" />;
      case 'question_validated':
        return <Brain className="h-4 w-4" />;
      case 'documents_retrieved':
        return <FileSearch className="h-4 w-4" />;
      case 'draft_generated':
        return <FileText className="h-4 w-4" />;
      case 'orchestrator_decision':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'research_complete':
        return <CheckCircle className="h-4 w-4" />;
      case 'validation_error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getColorClass = () => {
    switch (eventType) {
      case 'research_complete':
        return 'text-white bg-green-500 border-green-500';
      case 'error':
      case 'validation_error':
        return 'text-white bg-red-500 border-red-500';
      default:
        return 'text-white bg-orange-500 border-orange-500';
    }
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium shadow-sm transition-all duration-300',
        getColorClass(),
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2',
        className
      )}
    >
      {getIcon()}
      <span>{content}</span>
    </div>
  );
};