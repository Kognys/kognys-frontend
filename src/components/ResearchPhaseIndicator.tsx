import { cn } from '@/lib/utils';
import { RefreshCw, FileText, Brain, CheckCircle } from 'lucide-react';

interface ResearchPhaseIndicatorProps {
  phase: 'research' | 'validation' | 'synthesis' | 'critique' | 'finalize';
  iterationNumber?: number;
  className?: string;
}

export const ResearchPhaseIndicator = ({
  phase,
  iterationNumber,
  className
}: ResearchPhaseIndicatorProps) => {
  const getPhaseInfo = () => {
    switch (phase) {
      case 'research':
        return {
          icon: <FileText className="w-3 h-3" />,
          label: 'Research Phase',
          color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        };
      case 'validation':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Validation Phase',
          color: 'text-green-500 bg-green-500/10 border-green-500/20'
        };
      case 'synthesis':
        return {
          icon: <RefreshCw className="w-3 h-3" />,
          label: 'Synthesis Phase',
          color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
        };
      case 'critique':
        return {
          icon: <Brain className="w-3 h-3" />,
          label: 'Critique Phase',
          color: 'text-red-500 bg-red-500/10 border-red-500/20'
        };
      case 'finalize':
        return {
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Finalizing',
          color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
        };
    }
  };

  const { icon, label, color } = getPhaseInfo();

  return (
    <div className={cn(
      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
      color,
      'transition-all duration-200 animate-in fade-in slide-in-from-left-2',
      className
    )}>
      {icon}
      <span>{label}</span>
      {iterationNumber !== undefined && (
        <span className="opacity-70">• Iteration {iterationNumber}</span>
      )}
    </div>
  );
};