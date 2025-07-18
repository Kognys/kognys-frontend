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
  originalX: number;
  originalY: number;
}

const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);
  const isZoomingRef = useRef(false);
  const zoomFactorRef = useRef(1);

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
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      nodes.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        connections: [],
        size: Math.random() * 3 + 1,
        energy: Math.random(),
        pulse: Math.random() * Math.PI * 2,
        trail: [],
        originalX: x,
        originalY: y
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

    // Set up zoom effect listener
    const handleZoomStart = () => {
      isZoomingRef.current = true;
      
      // Animate zoom factor
      const startTime = Date.now();
      const duration = 800;
      
      const zoomAnimation = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for dramatic zoom
        const easeInQuart = progress * progress * progress * progress;
        zoomFactorRef.current = 1 + easeInQuart * 25; // Zoom up to 26x
        
        if (progress < 1) {
          requestAnimationFrame(zoomAnimation);
        } else {
          // Reset after zoom
          setTimeout(() => {
            isZoomingRef.current = false;
            zoomFactorRef.current = 1;
          }, 100);
        }
      };
      
      requestAnimationFrame(zoomAnimation);
    };

    // Listen for zoom trigger
    const zoomTrigger = document.querySelector('.chat-container');
    if (zoomTrigger) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            const target = mutation.target as HTMLElement;
            if (target.classList.contains('animate-zoom-to-chat')) {
              handleZoomStart();
            }
          }
        });
      });
      
      observer.observe(zoomTrigger, { attributes: true });
    }

    const animate = () => {
      timeRef.current += 0.01;
      const zoomFactor = zoomFactorRef.current;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Create sophisticated gradient background with zoom responsiveness
      const bgGradient = ctx.createRadialGradient(
        centerX, centerY * 0.6, 0,
        centerX, centerY * 0.6, Math.max(canvas.width, canvas.height) * (0.8 + zoomFactor * 0.2)
      );
      bgGradient.addColorStop(0, 'rgba(24, 24, 27, 0.95)');
      bgGradient.addColorStop(0.3, 'rgba(15, 15, 18, 0.98)');
      bgGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
      
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add enhanced overlay patterns during zoom
      ctx.globalCompositeOperation = 'screen';
      const overlayGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      const overlayIntensity = 0.01 + zoomFactor * 0.05;
      overlayGradient.addColorStop(0, `rgba(255, 127, 0, ${overlayIntensity * 2})`);
      overlayGradient.addColorStop(0.5, `rgba(255, 165, 0, ${overlayIntensity})`);
      overlayGradient.addColorStop(1, `rgba(255, 200, 0, ${overlayIntensity * 2})`);
      ctx.fillStyle = overlayGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'source-over';
      
      // Update and draw nodes
      nodes.forEach((node, i) => {
        // Update energy and pulse
        node.energy = (Math.sin(timeRef.current * 2 + i * 0.1) + 1) * 0.5;
        node.pulse += 0.05;
        
        // Enhanced movement during zoom
        if (isZoomingRef.current) {
          // Particles accelerate toward center during zoom
          const dx = centerX - node.originalX;
          const dy = centerY - node.originalY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const acceleration = 0.03 * zoomFactor;
          node.vx += (dx / distance) * acceleration;
          node.vy += (dy / distance) * acceleration;
          
          // Add some chaos for dramatic effect
          node.vx += (Math.random() - 0.5) * 0.1 * zoomFactor;
          node.vy += (Math.random() - 0.5) * 0.1 * zoomFactor;
        } else {
          // Normal subtle movement
          const wave = Math.sin(timeRef.current + i * 0.1) * 0.1;
          node.vx += wave * 0.01;
          node.vy += Math.cos(timeRef.current + i * 0.1) * 0.01;
        }
        
        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Enhanced size during zoom
        const baseSize = Math.random() * 3 + 1;
        node.size = baseSize * (1 + zoomFactor * 0.5);

        // Bounce off edges with damping
        if (node.x < 0 || node.x > canvas.width) {
          node.vx *= -0.8;
          node.x = Math.max(0, Math.min(canvas.width, node.x));
        }
        if (node.y < 0 || node.y > canvas.height) {
          node.vy *= -0.8;
          node.y = Math.max(0, Math.min(canvas.height, node.y));
        }

        // Update trail with zoom enhancement
        node.trail.unshift({ x: node.x, y: node.y, opacity: 1 });
        const trailLength = 8 + Math.floor(zoomFactor * 4);
        if (node.trail.length > trailLength) node.trail.pop();
        
        // Draw sophisticated connections with zoom enhancement
        node.connections.forEach(targetIndex => {
          const target = nodes[targetIndex];
          const distance = Math.sqrt(
            Math.pow(node.x - target.x, 2) + Math.pow(node.y - target.y, 2)
          );

          const maxDistance = 250 * (1 + zoomFactor * 0.5);
          if (distance < maxDistance) {
            const opacity = Math.max(0, 1 - distance / maxDistance);
            const energyBoost = (node.energy + target.energy) * 0.3;
            const pulseEffect = Math.sin(timeRef.current * 3 + distance * 0.01) * 0.2 + 0.8;
            const zoomBoost = 1 + zoomFactor * 0.3;
            
            // Create enhanced gradient connection
            const connectionGradient = ctx.createLinearGradient(
              node.x, node.y, target.x, target.y
            );
            connectionGradient.addColorStop(0, `rgba(255, 165, 0, ${(opacity * energyBoost * pulseEffect * zoomBoost) * 0.6})`);
            connectionGradient.addColorStop(0.5, `rgba(255, 200, 100, ${(opacity * energyBoost * pulseEffect * zoomBoost) * 0.8})`);
            connectionGradient.addColorStop(1, `rgba(255, 165, 0, ${(opacity * energyBoost * pulseEffect * zoomBoost) * 0.6})`);
            
            ctx.strokeStyle = connectionGradient;
            ctx.lineWidth = (1.5 + energyBoost) * (1 + zoomFactor * 0.3);
            ctx.globalAlpha = opacity * (0.8 + zoomFactor * 0.2);
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        });

        // Draw enhanced particle trail
        node.trail.forEach((point, index) => {
          const trailOpacity = (1 - index / node.trail.length) * (0.3 + zoomFactor * 0.2);
          const trailSize = (1 - index / node.trail.length) * node.size * 0.5;
          
          ctx.globalAlpha = trailOpacity;
          ctx.fillStyle = `rgba(255, 165, 0, ${trailOpacity})`;
          ctx.beginPath();
          ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Draw sophisticated node with zoom enhancement
        const pulseSize = node.size * (1 + Math.sin(node.pulse) * 0.3);
        const energyGlow = node.energy * (15 + zoomFactor * 10);
        
        // Enhanced outer glow during zoom
        ctx.shadowColor = `rgba(255, 165, 0, ${node.energy * (0.8 + zoomFactor * 0.2)})`;
        ctx.shadowBlur = energyGlow;
        
        // Main node gradient with zoom enhancement
        const nodeGradient = ctx.createRadialGradient(
          node.x, node.y, 0, 
          node.x, node.y, pulseSize + 4
        );
        nodeGradient.addColorStop(0, `rgba(255, 220, 150, ${0.9 + node.energy * 0.1})`);
        nodeGradient.addColorStop(0.4, `rgba(255, 165, 0, ${0.7 + node.energy * 0.2})`);
        nodeGradient.addColorStop(0.8, `rgba(255, 100, 0, ${0.4 + node.energy * 0.3})`);
        nodeGradient.addColorStop(1, `rgba(255, 165, 0, ${0.1 + zoomFactor * 0.1})`);
        
        ctx.fillStyle = nodeGradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Enhanced inner core
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + node.energy * 0.4})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Special energy nodes with zoom enhancement
        if (node.energy > 0.8) {
          ctx.shadowColor = `rgba(255, 215, 0, ${0.8 + zoomFactor * 0.2})`;
          ctx.shadowBlur = 25 + zoomFactor * 15;
          ctx.fillStyle = `rgba(255, 215, 0, ${0.4 + zoomFactor * 0.1})`;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseSize * (1.5 + zoomFactor * 0.3), 0, Math.PI * 2);
          ctx.fill();
        }
        
        ctx.shadowBlur = 0;
      });

      // Add zoom distortion effect
      if (isZoomingRef.current && zoomFactor > 5) {
        ctx.globalCompositeOperation = 'screen';
        const distortionGradient = ctx.createRadialGradient(
          centerX, centerY, 0,
          centerX, centerY, canvas.width * 0.3
        );
        distortionGradient.addColorStop(0, `rgba(255, 255, 255, ${(zoomFactor - 5) * 0.02})`);
        distortionGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = distortionGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
      }

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