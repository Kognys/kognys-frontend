
import AnimatedBackground from '@/components/AnimatedBackground';
import ChatInterface from '@/components/ChatInterface';
import DynamicText from '@/components/DynamicText';
import { Brain } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Cognys</span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">Collaborative</span>
              <br />
              <span className="text-primary">Intelligence</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              AI agents creating comprehensive knowledge graphs for{' '}
              <DynamicText />
            </p>
          </div>

          {/* Chat Interface */}
          <div className="w-full max-w-2xl">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
