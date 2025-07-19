
import AnimatedBackground from '@/components/AnimatedBackground';
import SimpleChat from '@/components/SimpleChat';
import DynamicText from '@/components/DynamicText';

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center max-w-4xl mx-auto mb-12">
            {/* Kognys Branding */}
            <div className="flex items-center justify-center gap-3 mb-8 animate-fade-in">
              <img 
                src="/lovable-uploads/88f06cbd-45cf-4d99-aa6e-0c98419665fd.png" 
                alt="Kognys Logo" 
                className="w-12 h-12 md:w-16 md:h-16 object-contain"
              />
              <span className="text-2xl md:text-3xl font-bold text-foreground">
                Kognys
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">AI-Powered DeSci Hub for</span>
              <br />
              <DynamicText />
            </h1>
          </div>

          {/* Simple Chat */}
          <SimpleChat />
        </div>
        
        {/* Footer */}
        <footer className="relative z-10 py-8 text-center">
          <p className="text-muted-foreground text-sm">
            Powered by Unibase
          </p>
        </footer>
      </div>
      
      {/* GitBook Link */}
      <a
        href="https://aicrypto.gitbook.io/kognys-docs/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-3 hover:bg-accent hover:text-accent-foreground transition-colors shadow-lg"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      </a>
    </div>
  );
};

export default Index;
