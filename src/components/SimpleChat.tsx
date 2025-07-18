
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInput, ChatInputTextArea, ChatInputSubmit } from './SimpleChatInput';
import { Button } from '@/components/ui/button';
import { Edit, BookOpen, Microscope, Dna, Atom, Cpu, FlaskConical } from 'lucide-react';

const scienceAreas = [
  {
    id: 'write',
    label: 'Write',
    icon: Edit,
    suggestions: [
      'Write a research proposal for quantum computing applications',
      'Draft a grant application for climate change research',
      'Create a literature review on CRISPR gene editing',
      'Develop a research methodology for biomarker discovery'
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

const SimpleChat = () => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!value.trim()) return;
    
    setLoading(true);
    
    // Zoom effect and navigation
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.classList.add('animate-zoom-to-chat');
      
      setTimeout(() => {
        navigate('/chat', { 
          state: { initialMessage: value }
        });
      }, 800);
    }
  };

  const handleStop = () => {
    setLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setValue(suggestion);
    setSelectedArea(null);
  };

  const handleAreaClick = (areaId: string) => {
    setSelectedArea(selectedArea === areaId ? null : areaId);
  };

  return (
    <div className="w-full max-w-3xl mx-auto chat-container">
      <ChatInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSubmit={handleSubmit}
        loading={loading}
        onStop={handleStop}
        className="bg-card/80 backdrop-blur-xl border-border/50 shadow-lg"
      >
        <ChatInputTextArea 
          placeholder="How can I help you today?"
          className="text-foreground placeholder:text-muted-foreground min-h-[52px] text-base"
        />
        <ChatInputSubmit />
      </ChatInput>

      {/* Science Area Buttons */}
      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap gap-2 justify-center">
          {scienceAreas.map((area) => {
            const Icon = area.icon;
            return (
              <Button
                key={area.id}
                variant="outline"
                size="sm"
                onClick={() => handleAreaClick(area.id)}
                className={`flex items-center gap-2 h-9 px-4 bg-card/60 hover:bg-card/80 border-border/50 transition-all duration-200 ${
                  selectedArea === area.id ? 'ring-2 ring-primary/50 bg-card/90' : ''
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
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="justify-start text-left h-auto py-2 px-3 hover:bg-muted/50 text-sm leading-relaxed whitespace-normal"
                  >
                    {suggestion}
                  </Button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleChat;
