import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Chat = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Generate a unique chat ID and redirect
    const chatId = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    navigate(`/chat/${chatId}`, { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Creating new chat...</p>
      </div>
    </div>
  );
};

export default Chat;