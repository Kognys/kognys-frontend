
import { useState } from 'react';
import { ChatInput, ChatInputTextArea, ChatInputSubmit } from './SimpleChatInput';

const SimpleChat = () => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    if (!value.trim()) return;
    
    console.log('Submitted:', value);
    setLoading(true);
    
    // Simulate processing
    setTimeout(() => {
      setLoading(false);
      setValue('');
    }, 2000);
  };

  const handleStop = () => {
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <ChatInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSubmit={handleSubmit}
        loading={loading}
        onStop={handleStop}
        className="bg-card/30 backdrop-blur-md border-border/30"
      >
        <ChatInputTextArea 
          placeholder="Ask about blockchain or AI..."
          className="text-foreground placeholder:text-muted-foreground"
        />
        <ChatInputSubmit />
      </ChatInput>
    </div>
  );
};

export default SimpleChat;
