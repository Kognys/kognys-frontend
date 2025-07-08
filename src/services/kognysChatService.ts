import { io, Socket } from 'socket.io-client';
import { ChatSession, ChatMessage, StreamChunk } from '@/types/kognys';

const BASE_URL = 'https://kognys-agents-production.up.railway.app';

export class KognysChatService {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private isConnected = false;

  constructor() {
    this.connect();
  }

  private connect() {
    this.socket = io(`${BASE_URL}/chat`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Connected to Kognys chat service');
      this.isConnected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from Kognys chat service');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });
  }

  async createSession(): Promise<string> {
    try {
      console.log('Attempting to create session...');
      
      // First, let's check what endpoints are available
      const response = await fetch(`${BASE_URL}/api/chat/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences: { language: 'en' }
        }),
      });

      console.log('Session response status:', response.status);
      console.log('Session response headers:', response.headers);

      if (!response.ok) {
        // Log the actual response to see what's available
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`API endpoint not available: ${response.status} - ${errorText}`);
      }

      const session: ChatSession = await response.json();
      this.sessionId = session.sessionId;

      // Join the session room
      if (this.socket && this.isConnected) {
        this.socket.emit('join', { sessionId: this.sessionId });
      }

      return this.sessionId;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  sendMessage(
    message: string,
    onStreamChunk: (chunk: StreamChunk) => void,
    onComplete: (response: ChatMessage) => void,
    onError: (error: Error) => void
  ) {
    if (!this.socket || !this.sessionId) {
      onError(new Error('Not connected or no session'));
      return;
    }

    // Listen for streaming responses
    this.socket.on('chat:stream:start', () => {
      console.log('Stream started');
    });

    this.socket.on('chat:stream:chunk', (chunk: { content: string }) => {
      onStreamChunk({
        content: chunk.content,
        isComplete: false
      });
    });

    this.socket.on('chat:stream:complete', (response: any) => {
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.content || response.message || '',
        timestamp: new Date(),
        context: response.context,
        insights: response.insights
      };
      onComplete(chatMessage);
      
      // Clean up listeners
      this.socket?.off('chat:stream:chunk');
      this.socket?.off('chat:stream:complete');
    });

    this.socket.on('error', (error: any) => {
      onError(new Error(error.message || 'An error occurred'));
    });

    // Send the message
    this.socket.emit('chat:message', {
      sessionId: this.sessionId,
      message
    });
  }

  async getChatHistory(sessionId?: string): Promise<ChatMessage[]> {
    const id = sessionId || this.sessionId;
    if (!id) throw new Error('No session ID');

    try {
      const response = await fetch(`${BASE_URL}/api/chat/history/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to get chat history: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }

  async endSession(sessionId?: string) {
    const id = sessionId || this.sessionId;
    if (!id) return;

    try {
      await fetch(`${BASE_URL}/api/chat/session/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.sessionId = null;
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  getSessionId() {
    return this.sessionId;
  }
}

// Export a singleton instance
export const kognysChatService = new KognysChatService();