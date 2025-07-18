
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatInput, ChatInputTextArea, ChatInputSubmit } from './SimpleChatInput';

const SimpleChat = () => {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!value.trim()) return;
    
    setLoading(true);
    
    // Generate a unique chat ID
    const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Zoom effect and navigation
    const chatContainer = document.querySelector('.chat-container');
    if (chatContainer) {
      chatContainer.classList.add('animate-zoom-to-chat');
      
      setTimeout(() => {
        navigate(`/chat/${chatId}`, { 
          state: { initialMessage: value }
        });
      }, 800);
    }
  };

  const handleStop = () => {
    setLoading(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto chat-container">
      <ChatInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSubmit={handleSubmit}
        loading={loading}
        onStop={handleStop}
        className="bg-card/30 backdrop-blur-md border-border/30"
      >
        <ChatInputTextArea 
          placeholder="Enter a prompt requesting a research paper"
          className="text-foreground placeholder:text-muted-foreground"
        />
        <ChatInputSubmit />
      </ChatInput>
    </div>
  );
};

export default SimpleChat;
