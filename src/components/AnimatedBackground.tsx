import { useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number[];
  size: number;
  energy: number;
  pulse: number;
  trail: { x: number; y: number; opacity: number }[];
}

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize nodes with more sophisticated properties
    const nodeCount = 80;
    const nodes: Node[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: [],
        size: Math.random() * 3 + 1,
        energy: Math.random(),
        pulse: Math.random() * Math.PI * 2,
        trail: []
      });
    }

    // Create more selective connections
    nodes.forEach((node, i) => {
      const connectionCount = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < connectionCount; j++) {
        const targetIndex = Math.floor(Math.random() * nodeCount);
        if (targetIndex !== i && !node.connections.includes(targetIndex)) {
          const distance = Math.sqrt(
            Math.pow(node.x - nodes[targetIndex].x, 2) + 
            Math.pow(node.y - nodes[targetIndex].y, 2)
          );
          if (distance < 300) {
            node.connections.push(targetIndex);
          }
        }
      }
    });

    nodesRef.current = nodes;

    const animate = () => {
      timeRef.current += 0.01;
      
      // Create sophisticated gradient background
      const bgGradient = ctx.createRadialGradient(
        canvas.width * 0.5, canvas.height * 0.3, 0,
        canvas.width * 0.5, canvas.height * 0.3, Math.max(canvas.width, canvas.height) * 0.8
      );
      bgGradient.addColorStop(0, 'rgba(24, 24, 27, 0.95)');
      bgGradient.addColorStop(0.3, 'rgba(15, 15, 18, 0.98)');
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle overlay patterns
      ctx.globalCompositeOperation = 'screen';
      const overlayGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      overlayGradient.addColorStop(0, 'rgba(255, 127, 0, 0.02)');
      overlayGradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.01)');
      overlayGradient.addColorStop(1, 'rgba(255, 200, 0, 0.02)');
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      
      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Update energy and pulse
        node.energy = (Math.sin(timeRef.current * 2 + i * 0.1) + 1) * 0.5;
        node.pulse += 0.05;
        
        // Update position with subtle variations
        const wave = Math.sin(timeRef.current + i * 0.1) * 0.1;
        node.x += node.vx + wave;
        node.y += node.vy + Math.cos(timeRef.current + i * 0.1) * 0.1;

        // Bounce off edges with damping
        if (node.x < 0 || node.x > canvas.width) {
          node.vx *= -0.8;
          node.x = Math.max(0, Math.min(canvas.width, node.x));
        }
        if (node.y < 0 || node.y > canvas.height) {
          node.vy *= -0.8;
          node.y = Math.max(0, Math.min(canvas.height, node.y));
        }

        // Update trail
        node.trail.unshift({ x: node.x, y: node.y, opacity: 1 });
        if (node.trail.length > 8) node.trail.pop();
        
        // Draw sophisticated connections
        node.connections.forEach(targetIndex => {
          const target = nodes[targetIndex];
          const distance = Math.sqrt(
            Math.pow(node.x - target.x, 2) + Math.pow(node.y - target.y, 2)
          );

          if (distance < 250) {
            const opacity = Math.max(0, 1 - distance / 250);
            const energyBoost = (node.energy + target.energy) * 0.3;
            const pulseEffect = Math.sin(timeRef.current * 3 + distance * 0.01) * 0.2 + 0.8;
            
            // Create gradient connection
            const connectionGradient = ctx.createLinearGradient(
              node.x, node.y, target.x, target.y
            );
            connectionGradient.addColorStop(0, `rgba(255, 165, 0, ${(opacity * energyBoost * pulseEffect) * 0.6})`);
            connectionGradient.addColorStop(0.5, `rgba(255, 200, 100, ${(opacity * energyBoost * pulseEffect) * 0.4})`);
            connectionGradient.addColorStop(1, `rgba(255, 165, 0, ${(opacity * energyBoost * pulseEffect) * 0.6})`);
            
            ctx.strokeStyle = connectionGradient;
            ctx.lineWidth = 1.5 + energyBoost;
            ctx.globalAlpha = opacity * 0.8;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });

        // Draw particle trail
        node.trail.forEach((point, index) => {
          const trailOpacity = (1 - index / node.trail.length) * 0.3;
          const trailSize = (1 - index / node.trail.length) * node.size * 0.5;
          
          ctx.globalAlpha = trailOpacity;
          ctx.fillStyle = `rgba(255, 165, 0, ${trailOpacity})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Draw sophisticated node
        const pulseSize = node.size * (1 + Math.sin(node.pulse) * 0.3);
        const energyGlow = node.energy * 15;
        
        // Outer glow
        ctx.shadowColor = `rgba(255, 165, 0, ${node.energy * 0.8})`;
        ctx.shadowBlur = energyGlow;
        
        // Main node gradient
        const nodeGradient = ctx.createRadialGradient(
          node.x, node.y, 0, 
          node.x, node.y, pulseSize + 4
        );
        nodeGradient.addColorStop(0, `rgba(255, 220, 150, ${0.9 + node.energy * 0.1})`);
        nodeGradient.addColorStop(0.4, `rgba(255, 165, 0, ${0.7 + node.energy * 0.2})`);
        nodeGradient.addColorStop(0.8, `rgba(255, 100, 0, ${0.4 + node.energy * 0.3})`);
        nodeGradient.addColorStop(1, `rgba(255, 165, 0, 0.1)`);
        
        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner core
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + node.energy * 0.4})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Special energy nodes
        if (node.energy > 0.8) {
          ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
          ctx.shadowBlur = 25;
          ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseSize * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.shadowBlur = 0;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  );
};

export default AnimatedBackground;
