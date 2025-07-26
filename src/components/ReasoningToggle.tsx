import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ReasoningToggleProps {
  isVisible: boolean;
  onToggle: () => void;
  className?: string;
}

export const ReasoningToggle = ({ isVisible, onToggle, className }: ReasoningToggleProps) => {
  return (
    <Button
      onClick={onToggle}
      variant="ghost"
      size="sm"
      className={cn(
        "h-auto py-1.5 px-3 gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-all duration-200",
        "border border-transparent hover:border-border/50 hover:bg-muted/50",
        isVisible && "text-orange-600 hover:text-orange-700",
        className
      )}
      aria-label="Toggle reasoning visibility"
    >
      <Brain className="h-3.5 w-3.5" />
      <span>
        {isVisible ? 'Hide' : 'Show'} Reasoning
      </span>
      {isVisible ? (
        <ChevronUp className="h-3 w-3" />
      ) : (
        <ChevronDown className="h-3 w-3" />
      )}
    </Button>
  );
};