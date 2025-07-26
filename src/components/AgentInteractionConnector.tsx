import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ConnectionPoint {
  x: number;
  y: number;
}

interface AgentInteractionConnectorProps {
  fromElement: string; // ID of the source element
  toElement: string; // ID of the target element
  type?: 'direct' | 'indirect' | 'critique' | 'iteration';
  label?: string;
  animated?: boolean;
  color?: string;
  className?: string;
  offset?: { x: number; y: number };
}

export const AgentInteractionConnector = ({
  fromElement,
  toElement,
  type = 'direct',
  label,
  animated = false,
  color,
  className,
  offset = { x: 0, y: 0 }
}: AgentInteractionConnectorProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [path, setPath] = useState('');
  const [labelPosition, setLabelPosition] = useState<ConnectionPoint>({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePath = () => {
      const from = document.getElementById(fromElement);
      const to = document.getElementById(toElement);
      const svg = svgRef.current;

      if (!from || !to || !svg) return;

      const svgRect = svg.getBoundingClientRect();
      const fromRect = from.getBoundingClientRect();
      const toRect = to.getBoundingClientRect();

      // Calculate connection points (from right side of source to left side of target)
      const fromPoint: ConnectionPoint = {
        x: fromRect.right - svgRect.left + offset.x,
        y: fromRect.top + fromRect.height / 2 - svgRect.top + offset.y
      };

      const toPoint: ConnectionPoint = {
        x: toRect.left - svgRect.left + offset.x,
        y: toRect.top + toRect.height / 2 - svgRect.top + offset.y
      };

      // Create path based on connection type
      let pathData = '';
      switch (type) {
        case 'critique': {
          // Zigzag path for critiques
          const midX = (fromPoint.x + toPoint.x) / 2;
          pathData = `M ${fromPoint.x} ${fromPoint.y} ` +
                     `L ${midX - 10} ${fromPoint.y} ` +
                     `L ${midX + 10} ${toPoint.y} ` +
                     `L ${toPoint.x} ${toPoint.y}`;
          break;
        }
        case 'indirect': {
          // Curved path for indirect connections
          const controlPoint1 = { x: fromPoint.x + 50, y: fromPoint.y };
          const controlPoint2 = { x: toPoint.x - 50, y: toPoint.y };
          pathData = `M ${fromPoint.x} ${fromPoint.y} ` +
                     `C ${controlPoint1.x} ${controlPoint1.y}, ` +
                     `${controlPoint2.x} ${controlPoint2.y}, ` +
                     `${toPoint.x} ${toPoint.y}`;
          break;
        }
        case 'iteration': {
          // Loop-back path for iterations
          const loopHeight = 30;
          pathData = `M ${fromPoint.x} ${fromPoint.y} ` +
                     `Q ${fromPoint.x + 40} ${fromPoint.y - loopHeight}, ` +
                     `${(fromPoint.x + toPoint.x) / 2} ${fromPoint.y} ` +
                     `Q ${toPoint.x - 40} ${toPoint.y + loopHeight}, ` +
                     `${toPoint.x} ${toPoint.y}`;
          break;
        }
        default:
          // Direct straight line
          pathData = `M ${fromPoint.x} ${fromPoint.y} L ${toPoint.x} ${toPoint.y}`;
      }

      setPath(pathData);
      
      // Calculate label position (middle of the path)
      setLabelPosition({
        x: (fromPoint.x + toPoint.x) / 2,
        y: (fromPoint.y + toPoint.y) / 2
      });

      // Trigger visibility animation
      setTimeout(() => setIsVisible(true), 100);
    };

    updatePath();
    
    // Update on window resize
    window.addEventListener('resize', updatePath);
    
    // Update on scroll
    const scrollHandler = () => updatePath();
    document.addEventListener('scroll', scrollHandler, true);

    return () => {
      window.removeEventListener('resize', updatePath);
      document.removeEventListener('scroll', scrollHandler, true);
    };
  }, [fromElement, toElement, type, offset]);

  const getStrokeStyle = () => {
    switch (type) {
      case 'critique':
        return {
          stroke: color || '#ef4444',
          strokeDasharray: '5,5',
          strokeWidth: 2
        };
      case 'indirect':
        return {
          stroke: color || '#9ca3af',
          strokeDasharray: '2,2',
          strokeWidth: 1.5
        };
      case 'iteration':
        return {
          stroke: color || '#8b5cf6',
          strokeWidth: 2
        };
      default:
        return {
          stroke: color || '#6b7280',
          strokeWidth: 2
        };
    }
  };

  const strokeStyle = getStrokeStyle();

  return (
    <svg
      ref={svgRef}
      className={cn(
        'absolute inset-0 pointer-events-none overflow-visible',
        className
      )}
      style={{ zIndex: -1 }}
    >
      <defs>
        {/* Arrow marker */}
        <marker
          id={`arrowhead-${fromElement}-${toElement}`}
          markerWidth="10"
          markerHeight="10"
          refX="10"
          refY="5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 5, 0 10"
            fill={strokeStyle.stroke}
            className={cn(
              'transition-all duration-300',
              isVisible ? 'opacity-100' : 'opacity-0'
            )}
          />
        </marker>

        {/* Gradient for animated connections */}
        {animated && (
          <linearGradient id={`gradient-${fromElement}-${toElement}`}>
            <stop offset="0%" stopColor={strokeStyle.stroke} stopOpacity="0">
              <animate
                attributeName="offset"
                values="0;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor={strokeStyle.stroke} stopOpacity="1">
              <animate
                attributeName="offset"
                values="0;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor={strokeStyle.stroke} stopOpacity="0">
              <animate
                attributeName="offset"
                values="0;1"
                dur="2s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
        )}
      </defs>

      {/* Connection path */}
      <path
        d={path}
        fill="none"
        {...strokeStyle}
        markerEnd={`url(#arrowhead-${fromElement}-${toElement})`}
        className={cn(
          'transition-all duration-500',
          isVisible ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          stroke: animated ? `url(#gradient-${fromElement}-${toElement})` : strokeStyle.stroke
        }}
      />

      {/* Connection label */}
      {label && (
        <g
          className={cn(
            'transition-all duration-500 delay-200',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          <rect
            x={labelPosition.x - 30}
            y={labelPosition.y - 10}
            width="60"
            height="20"
            rx="10"
            fill="white"
            className="dark:fill-gray-900"
            stroke={strokeStyle.stroke}
            strokeWidth="1"
          />
          <text
            x={labelPosition.x}
            y={labelPosition.y + 4}
            textAnchor="middle"
            className="text-xs fill-foreground font-medium"
          >
            {label}
          </text>
        </g>
      )}
    </svg>
  );
};

// Helper component to wrap messages with connection support
interface ConnectableMessageProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export const ConnectableMessage = ({ id, children, className }: ConnectableMessageProps) => {
  return (
    <div id={id} className={cn('relative', className)}>
      {children}
    </div>
  );
};