
import AnimatedBackground from '@/components/AnimatedBackground';
import ChatInterface from '@/components/ChatInterface';
import DynamicText from '@/components/DynamicText';
import { Brain, Network, Zap, Users, Database, Globe } from 'lucide-react';

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
            <span className="text-xl font-bold text-foreground">AI Knowledge Hub</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">About</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Research</a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">Community</a>
          </nav>
        </header>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">AI-Powered</span>
              <br />
              <span className="text-primary">Knowledge Hub</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Collaborative AI agents creating comprehensive knowledge graphs for{' '}
              <DynamicText />
            </p>

            <div className="flex flex-wrap justify-center gap-8 mb-12">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Network className="w-5 h-5 text-primary" />
                <span>Connected Intelligence</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="w-5 h-5 text-primary" />
                <span>Knowledge Graphs</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="w-5 h-5 text-primary" />
                <span>Collaborative Research</span>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="w-full max-w-4xl">
            <ChatInterface />
          </div>
        </div>

        {/* Features Grid */}
        <div className="px-6 py-16 bg-card/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Revolutionizing Knowledge Discovery
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card/40 backdrop-blur-lg p-6 rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-300 animate-float">
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">AI Collaboration</h3>
                <p className="text-muted-foreground">
                  Multiple AI agents work together to research, analyze, and synthesize complex information about blockchain and AI technologies.
                </p>
              </div>

              <div className="bg-card/40 backdrop-blur-lg p-6 rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-300 animate-float" style={{ animationDelay: '0.5s' }}>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Network className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Knowledge Graphs</h3>
                <p className="text-muted-foreground">
                  Dynamic, interconnected knowledge structures that evolve and grow with new discoveries and insights.
                </p>
              </div>

              <div className="bg-card/40 backdrop-blur-lg p-6 rounded-xl border border-border/50 hover:border-primary/50 transition-all duration-300 animate-float" style={{ animationDelay: '1s' }}>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-foreground">Global Access</h3>
                <p className="text-muted-foreground">
                  Democratizing access to cutting-edge research and insights in blockchain and artificial intelligence.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 AI Knowledge Hub. Connecting minds, building the future.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
