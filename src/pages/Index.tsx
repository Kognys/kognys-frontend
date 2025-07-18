
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
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="text-foreground">AI-Powered DeSci Hub for</span>
              <br />
              <DynamicText />
            </h1>
          </div>

          {/* Simple Chat */}
          <SimpleChat />
        </div>
      </div>
    </div>
  );
};

export default Index;
