import { cn } from '@/lib/utils';
import { RefreshCw, FileText, Brain, CheckCircle, Search, Sparkles } from 'lucide-react';

interface EnhancedPhaseIndicatorProps {
  phase: 'research' | 'validation' | 'synthesis' | 'critique' | 'finalize';
  iterationNumber?: number;
  className?: string;
}

export const EnhancedPhaseIndicator = ({
  phase,
  iterationNumber,
  className
}: EnhancedPhaseIndicatorProps) => {
  const getPhaseInfo = () => {
    switch (phase) {
      case 'research':
        return {
          icon: <FileText className="w-4 h-4" />,
          label: 'Research Phase',
          description: 'Gathering and analyzing information',
          gradient: 'from-blue-500 to-blue-600',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          textColor: 'text-blue-600 dark:text-blue-400',
          animation: 'animate-pulse'
        };
      case 'validation':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          label: 'Validation Phase',
          description: 'Verifying and refining queries',
          gradient: 'from-emerald-500 to-emerald-600',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          animation: 'animate-pulse'
        };
      case 'synthesis':
        return {
          icon: <Brain className="w-4 h-4" />,
          label: 'Synthesis Phase',
          description: 'Combining insights and findings',
          gradient: 'from-amber-500 to-amber-600',
          bgColor: 'bg-amber-500/10',
          borderColor: 'border-amber-500/30',
          textColor: 'text-amber-600 dark:text-amber-400',
          animation: 'animate-pulse'
        };
      case 'critique':
        return {
          icon: <RefreshCw className="w-4 h-4" />,
          label: 'Critique Phase',
          description: 'Reviewing and challenging findings',
          gradient: 'from-rose-500 to-rose-600',
          bgColor: 'bg-rose-500/10',
          borderColor: 'border-rose-500/30',
          textColor: 'text-rose-600 dark:text-rose-400',
          animation: 'animate-spin-slow'
        };
      case 'finalize':
        return {
          icon: <Sparkles className="w-4 h-4" />,
          label: 'Finalization',
          description: 'Preparing final response',
          gradient: 'from-purple-500 to-purple-600',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30',
          textColor: 'text-purple-600 dark:text-purple-400',
          animation: 'animate-pulse'
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className={cn(
      'inline-flex items-center gap-4 px-6 py-3 rounded-full border-2 transition-all duration-500',
      phaseInfo.bgColor,
      phaseInfo.borderColor,
      'backdrop-blur-sm shadow-lg',
      className
    )}>
      {/* Animated Icon Container */}
      <div className="relative">
        <div className={cn(
          'absolute inset-0 rounded-full opacity-40',
          'bg-gradient-to-r',
          phaseInfo.gradient,
          phaseInfo.animation
        )} />
        <div className={cn(
          'relative flex items-center justify-center w-10 h-10 rounded-full',
          'bg-gradient-to-br',
          phaseInfo.gradient,
          'text-white shadow-md'
        )}>
          {phaseInfo.icon}
        </div>
      </div>

      {/* Phase Information */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold text-sm', phaseInfo.textColor)}>
            {phaseInfo.label}
          </span>
          {iterationNumber && iterationNumber > 0 && (
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              phaseInfo.bgColor,
              phaseInfo.textColor
            )}>
              Round {iterationNumber + 1}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground opacity-70">
          {phaseInfo.description}
        </span>
      </div>

      {/* Progress Indicator */}
      <div className="ml-auto">
        <div className={cn(
          'w-2 h-2 rounded-full',
          'bg-gradient-to-r',
          phaseInfo.gradient,
          'animate-pulse'
        )} />
      </div>
    </div>
  );
};

// Phase Progress Bar Component
interface PhaseProgressProps {
  currentPhase: 'research' | 'validation' | 'synthesis' | 'critique' | 'finalize';
  className?: string;
}

export const PhaseProgress = ({ currentPhase, className }: PhaseProgressProps) => {
  const phases = ['research', 'validation', 'synthesis', 'critique', 'finalize'] as const;
  const currentIndex = phases.indexOf(currentPhase);

  return (
    <div className={cn('flex items-center gap-2 px-4', className)}>
      {phases.map((phase, index) => {
        const phaseInfo = getPhaseInfo();
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        
        return (
          <div key={phase} className="flex items-center">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                isActive && 'ring-2 ring-offset-2',
                isCompleted && 'bg-gradient-to-br from-green-500 to-green-600 text-white',
                isActive && `bg-gradient-to-br ${phaseInfo.gradient} text-white`,
                !isActive && !isCompleted && 'bg-muted text-muted-foreground'
              )}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
            {index < phases.length - 1 && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-1 transition-all duration-300',
                  isCompleted ? 'bg-green-500' : 'bg-muted'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );

  function getPhaseInfo() {
    switch (currentPhase) {
      case 'research':
        return { gradient: 'from-blue-500 to-blue-600' };
      case 'validation':
        return { gradient: 'from-emerald-500 to-emerald-600' };
      case 'synthesis':
        return { gradient: 'from-amber-500 to-amber-600' };
      case 'critique':
        return { gradient: 'from-rose-500 to-rose-600' };
      case 'finalize':
        return { gradient: 'from-purple-500 to-purple-600' };
    }
  }
};