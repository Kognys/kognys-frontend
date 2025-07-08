export interface ChatSession {
  sessionId: string;
  preferences?: {
    language: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: {
    knowledgeUsed?: KnowledgeEntry[];
  };
  insights?: Insight[];
}

export interface KnowledgeEntry {
  id: string;
  type: 'concept' | 'insight' | 'conversation' | 'contract';
  title: string;
  content: string;
  timestamp: string;
  size?: number;
}

export interface Insight {
  id: string;
  content: string;
  context: string[];
}

export interface StreamChunk {
  content: string;
  isComplete: boolean;
}

export interface KnowledgeStats {
  totalEntries: number;
  totalConcepts: number;
  totalInsights: number;
  lastUpdated: string;
}