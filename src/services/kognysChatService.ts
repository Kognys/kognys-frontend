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

  async initializeConnection(): Promise<void> {
    // Just initialize the socket connection, don't create session yet
    return new Promise((resolve) => {
      if (this.socket && this.isConnected) {
        resolve();
        return;
      }
      
      this.socket?.on('connect', () => {
        console.log('Socket connected, ready to send messages');
        resolve();
      });
    });
  }

  async sendMessage(
    message: string,
    onStreamChunk: (chunk: { content: string }) => void,
    onComplete: (response: ChatMessage) => void,
    onError: (error: Error) => void
  ) {
    try {
      console.log('Sending message to Kognys API:', message);
      
      // Make the POST request to /api/chat
      const response = await fetch(`${BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          sessionId: this.sessionId,
          preferences: { language: 'en' }
        }),
      });

      console.log('Chat API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Chat API error:', errorText);
        throw new Error(`Chat API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Chat API result:', result);

      // Create response message
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: result.response || result.message || 'No response received',
        timestamp: new Date(),
        context: result.context,
        insights: result.insights
      };

      // Update session ID if provided
      if (result.sessionId) {
        this.sessionId = result.sessionId;
      }

      onComplete(chatMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      onError(error as Error);
    }
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