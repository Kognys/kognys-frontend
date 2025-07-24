
import AnimatedBackground from '@/components/AnimatedBackground';
import SimpleChat from '@/components/SimpleChat';
import DynamicText from '@/components/DynamicText';
import { LoginButton } from '@/components/LoginButton';

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedBackground />
      
      {/* Header - Logo and Login Button */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4 flex items-center justify-between">
        {/* Logo - Top Left */}
        <div className="flex items-center gap-2 animate-fade-in">
          <img 
            src="/kognys-logo.png" 
            alt="Kognys Logo" 
            className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
          />
          <span className="text-lg sm:text-xl font-bold text-foreground">
            Kognys
          </span>
        </div>
        {/* Login Button - Top Right */}
        <LoginButton />
      </header>
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center max-w-4xl mx-auto mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">AI-Powered DeSci Hub for </span>
              <br className="hidden sm:block" />
              <DynamicText />
            </h1>
          </div>

          {/* Simple Chat */}
          <SimpleChat />
        </div>
        
        {/* Footer */}
        <footer className="relative z-10 py-8 text-center">
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
        </footer>
      </div>
      
      {/* GitBook Link */}
      <a
        href="https://aicrypto.gitbook.io/kognys-docs/"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-2 sm:p-3 hover:bg-accent hover:text-accent-foreground transition-colors shadow-lg"
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
