import { useState } from 'react';
import { useParams } from 'react-router-dom';

const ChatPageSimple = () => {
  const { chatId } = useParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', role: 'user', content: 'Hello!' },
    { id: '2', role: 'assistant', content: 'Hi there! How can I help you today?' }
  ]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const newMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: input
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `You said: "${newMessage.content}". I'm a working chat interface! This would normally connect to the Kognys API.`
      };
      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      color: 'black',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        backgroundColor: '#f0f0f0',
        padding: '20px',
        borderRight: '1px solid #ccc'
      }}>
        <h2 style={{ color: 'black', marginBottom: '20px' }}>Kognys Chat</h2>
        <button style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}>
          New Chat
        </button>
      </div>

      {/* Main Area */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #ccc',
          backgroundColor: 'white'
        }}>
          <h1 style={{ color: 'black', margin: 0 }}>Chat Interface Test</h1>
        </div>

        {/* Messages */}
        <div style={{ 
          flex: 1, 
          padding: '20px',
          backgroundColor: 'white',
          overflowY: 'auto'
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {messages.map((message) => (
              <div key={message.id} style={{ 
                display: 'flex', 
                gap: '12px', 
                marginBottom: '24px',
                alignItems: 'flex-start'
              }}>
                {/* Avatar */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: message.role === 'user' ? '#3b82f6' : '#ea580c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {message.role === 'user' ? 'U' : 'K'}
                </div>
                
                {/* Message Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '14px', 
                    fontWeight: '500', 
                    color: '#374151',
                    marginBottom: '4px'
                  }}>
                    {message.role === 'user' ? 'You' : 'Kognys'}
                  </div>
                  <div style={{ 
                    fontSize: '14px', 
                    color: '#111827',
                    lineHeight: '1.5'
                  }}>
                    {message.content}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Empty state */}
            {messages.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                color: '#6b7280',
                marginTop: '100px'
              }}>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                  How can I help you today?
                </div>
                <div style={{ fontSize: '14px' }}>
                  Ask me anything about research papers or scientific topics.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #ccc',
          backgroundColor: 'white'
        }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '5px',
                color: 'black'
              }}
            />
            <button 
              onClick={handleSend}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPageSimple;