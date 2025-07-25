import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Menu, Edit, BookOpen, Microscope, Dna, Atom, Cpu, FlaskConical } from 'lucide-react';
import { ClaudeSidebar } from '@/components/ClaudeSidebar';
import { LoginButton } from '@/components/LoginButton';
import { chatStore } from '@/lib/chatStore';
import { cn } from '@/lib/utils';

const scienceAreas = [
  {
    id: 'math',
    label: 'Math',
    icon: Edit,
    suggestions: [
      'Solve complex differential equations for population dynamics',
      'Model statistical distributions in clinical trials',
      'Apply linear algebra to genomic data analysis',
      'Develop mathematical models for epidemic spread'
    ]
  },
  {
    id: 'biology',
    label: 'Biology',
    icon: Dna,
    suggestions: [
      'Explain the latest developments in synthetic biology',
      'Analyze the impact of microbiome research on medicine',
      'Compare different gene therapy approaches',
      'Discuss advances in protein folding prediction'
    ]
  },
  {
    id: 'physics',
    label: 'Physics',
    icon: Atom,
    suggestions: [
      'Explore quantum entanglement applications in computing',
      'Analyze recent discoveries in particle physics',
      'Explain dark matter detection methods',
      'Discuss fusion energy breakthrough potential'
    ]
  },
  {
    id: 'chemistry',
    label: 'Chemistry',
    icon: FlaskConical,
    suggestions: [
      'Examine green chemistry innovations for sustainability',
      'Analyze new drug discovery methodologies',
      'Discuss advances in catalysis research',
      'Explore nanotechnology applications in medicine'
    ]
  },
  {
    id: 'ai',
    label: 'AI & Tech',
    icon: Cpu,
    suggestions: [
      'Analyze AI applications in drug discovery',
      'Discuss machine learning in genomics research',
      'Explore blockchain applications in scientific publishing',
      'Examine AI ethics in medical research'
    ]
  },
  {
    id: 'research',
    label: 'Research',
    icon: BookOpen,
    suggestions: [
      'Design an experiment to test a hypothesis',
      'Create a systematic review protocol',
      'Develop a data management plan',
      'Outline a clinical trial design'
    ]
  }
];

const SimpleChatPage = () => {
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    // On desktop, default to open; on mobile, default to closed
    const isDesktop = window.innerWidth >= 768;
    const savedState = localStorage.getItem('kognys_sidebar_open');
    if (savedState !== null) {
      return JSON.parse(savedState);
    }
    return isDesktop;
  });
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setSelectedArea(null);
      }
    };

    if (selectedArea) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedArea]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Create a new chat and navigate to it with initial message
    const newChat = chatStore.createChat();
    navigate(`/chat/${newChat.id}`, { 
      state: { initialMessage: input }
    });
  };

  return (
    <div className="min-h-screen bg-background font-inter flex relative">
      {/* Login Button - Top Right */}
      <div className="absolute top-4 right-4 z-30">
        <LoginButton />
      </div>
      
      {/* Sidebar */}
      <ClaudeSidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
      />
      
      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-200",
        sidebarOpen ? "md:ml-64" : "md:ml-0"
      )}>
        {/* Header with menu button */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newState = !sidebarOpen;
              setSidebarOpen(newState);
              localStorage.setItem('kognys_sidebar_open', JSON.stringify(newState));
            }}
            className="h-8 w-8 p-0"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="w-8 md:hidden" /> {/* Spacer for centering on mobile */}
          <div className="w-8 md:hidden" /> {/* Spacer for centering on mobile */}
        </div>
        
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-2xl space-y-8">
            
            {/* Kognys Branding */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <img 
                  src="/kognys-logo.png" 
                  alt="Kognys Logo" 
                  className="w-12 h-12 object-contain"
                />
                <span className="text-2xl font-bold text-foreground">
                  Kognys
                </span>
              </div>
              <p className="text-muted-foreground text-lg">How can I help you today?</p>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="w-full h-14 px-6 pr-16 text-base bg-muted/30 border-border/40 rounded-2xl focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200 placeholder:text-muted-foreground/50"
                  autoFocus
                />
                <Button 
                  type="submit" 
                  disabled={!input.trim()}
                  className="absolute right-2 top-2 h-10 w-10 rounded-xl bg-primary/90 hover:bg-primary disabled:opacity-30 transition-all duration-200"
                  size="sm"
                >
                  <Send className="w-4 h-4" strokeWidth={2} />
                </Button>
              </div>
            </form>

            {/* Science Area Buttons and Suggestions */}
            <div className="space-y-4" ref={menuRef}>
              <div className="flex flex-wrap gap-2 justify-center">
                {scienceAreas.map((area) => {
                  const Icon = area.icon;
                  return (
                    <Button
                      key={area.id}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedArea(selectedArea === area.id ? null : area.id)}
                      className={`flex items-center gap-2 h-9 px-4 text-sm bg-card/60 hover:bg-orange-500/20 hover:border-orange-500/50 border-border/50 transition-all duration-200 ${
                        selectedArea === area.id ? 'ring-2 ring-orange-500/50 bg-orange-500/10 border-orange-500/50' : ''
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {area.label}
                    </Button>
                  );
                })}
              </div>

              {/* Suggestions Panel */}
              {selectedArea && (
                <div className="bg-card/80 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-lg animate-fade-in">
                  <div className="grid gap-2">
                    {scienceAreas
                      .find(area => area.id === selectedArea)
                      ?.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setInput(suggestion);
                            setSelectedArea(null);
                          }}
                          className="justify-start text-left h-auto py-2 px-3 hover:bg-orange-500/10 hover:text-orange-600 text-sm leading-relaxed whitespace-normal transition-colors duration-200"
                        >
                          {suggestion}
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="py-6 text-center">
          <p className="text-muted-foreground text-sm">
            Powered by{' '}
            <a 
              href="https://www.unibase.io/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline"
            >
              Unibase
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SimpleChatPage;