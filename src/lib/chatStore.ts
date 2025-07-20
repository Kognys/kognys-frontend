export interface Chat {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    id: string;
    role: 'user' | 'assistant' | 'status' | 'agent';
    content: string;
    eventType?: string;
    temporary?: boolean;
    agentName?: string;
    agentRole?: string;
    messageType?: string;
  }>;
}

const STORAGE_KEY = 'kognys-chats';
const MAX_CHATS = 100; // Limit to prevent storage overflow

/**
 * Local storage-based chat management
 * In a real app, this would be a database/API
 */
export class ChatStore {
  private chats: Map<string, Chat> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const chatsArray: Chat[] = JSON.parse(stored);
        chatsArray.forEach(chat => {
          // Convert date strings back to Date objects
          chat.createdAt = new Date(chat.createdAt);
          chat.updatedAt = new Date(chat.updatedAt);
          this.chats.set(chat.id, chat);
        });
      }
    } catch (error) {
      console.error('Error loading chats from storage:', error);
      this.chats.clear();
    }
  }

  private saveToStorage() {
    try {
      const chatsArray = Array.from(this.chats.values());
      // Keep only the most recent chats
      const sortedChats = chatsArray
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
        .slice(0, MAX_CHATS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedChats));
    } catch (error) {
      console.error('Error saving chats to storage:', error);
    }
  }

  createChat(title?: string): Chat {
    const id = this.generateId();
    const now = new Date();
    
    const chat: Chat = {
      id,
      title: title || 'New Chat',
      createdAt: now,
      updatedAt: now,
      messages: []
    };

    this.chats.set(id, chat);
    this.saveToStorage();
    return chat;
  }

  createChatWithId(id: string, title?: string): Chat {
    const now = new Date();
    
    const chat: Chat = {
      id,
      title: title || 'New Chat',
      createdAt: now,
      updatedAt: now,
      messages: []
    };

    this.chats.set(id, chat);
    this.saveToStorage();
    return chat;
  }

  getChat(id: string): Chat | undefined {
    return this.chats.get(id);
  }

  getAllChats(): Chat[] {
    return Array.from(this.chats.values())
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  updateChat(id: string, updates: Partial<Omit<Chat, 'id' | 'createdAt'>>): void {
    const chat = this.chats.get(id);
    if (!chat) return;

    const updatedChat = {
      ...chat,
      ...updates,
      updatedAt: new Date()
    };

    this.chats.set(id, updatedChat);
    this.saveToStorage();
  }

  deleteChat(id: string): boolean {
    const deleted = this.chats.delete(id);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  addMessage(chatId: string, message: Omit<Chat['messages'][0], 'id'>): void {
    const chat = this.chats.get(chatId);
    if (!chat) return;

    // Don't save temporary status messages
    if (message.temporary) {
      return;
    }

    // Check if message already exists (to prevent duplicates)
    const isDuplicate = chat.messages.some(msg => 
      msg.role === message.role && 
      msg.content === message.content &&
      Math.abs(new Date().getTime() - new Date(chat.updatedAt).getTime()) < 1000 // Within 1 second
    );
    
    if (isDuplicate) {
      console.log('Skipping duplicate message');
      return;
    }

    const messageWithId = {
      ...message,
      id: this.generateId()
    };

    chat.messages.push(messageWithId);
    chat.updatedAt = new Date();

    // Auto-generate title from first user message if still "New Chat"
    if (chat.title === 'New Chat' && message.role === 'user') {
      chat.title = this.generateTitle(message.content);
    }

    this.chats.set(chatId, chat);
    this.saveToStorage();
  }

  getRecentChats(limit: number = 20): Chat[] {
    return this.getAllChats().slice(0, limit);
  }

  searchChats(query: string): Chat[] {
    const lowercaseQuery = query.toLowerCase();
    return this.getAllChats().filter(chat => 
      chat.title.toLowerCase().includes(lowercaseQuery) ||
      chat.messages.some(msg => 
        msg.content.toLowerCase().includes(lowercaseQuery)
      )
    );
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private generateTitle(content: string): string {
    // Extract first few words as title, max 50 chars
    const words = content.trim().split(/\s+/).slice(0, 8);
    let title = words.join(' ');
    
    if (title.length > 50) {
      title = title.substring(0, 47) + '...';
    }
    
    return title || 'New Chat';
  }

  // Group chats by time for sidebar display
  getGroupedChats(): { [key: string]: Chat[] } {
    const chats = this.getAllChats();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const groups: { [key: string]: Chat[] } = {
      'Today': [],
      'Yesterday': [],
      'Last 7 days': [],
      'Last 30 days': [],
      'Older': []
    };

    chats.forEach(chat => {
      const chatDate = new Date(chat.updatedAt);
      
      if (chatDate >= today) {
        groups['Today'].push(chat);
      } else if (chatDate >= yesterday) {
        groups['Yesterday'].push(chat);
      } else if (chatDate >= lastWeek) {
        groups['Last 7 days'].push(chat);
      } else if (chatDate >= lastMonth) {
        groups['Last 30 days'].push(chat);
      } else {
        groups['Older'].push(chat);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }
}

// Singleton instance
export const chatStore = new ChatStore();