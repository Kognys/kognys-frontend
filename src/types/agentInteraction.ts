export interface AgentInteractionMessage {
  id: string;
  role: 'user' | 'assistant' | 'status' | 'agent';
  content: string;
  agentName?: string;
  agentRole?: string;
  messageType?: string;
  eventType?: string;
  temporary?: boolean;
  transactionHash?: string;
  
  // Enhanced interaction tracking
  targetAgent?: string; // Which agent this message is directed to
  timestamp?: number; // When the message was created
  
  // Visual properties
  isHighlighted?: boolean; // For emphasizing important interactions
}

// Helper to determine which agent a message is targeting
export function getTargetAgent(fromAgent: string, messageContent: string): string | undefined {
  const agentMentions = {
    'orchestrator': ['orchestrator', 'coordinator', 'lead'],
    'validator': ['validator', 'input validator'],
    'retriever': ['retriever', 'document retriever'],
    'synthesizer': ['synthesizer', 'synthesis'],
    'challenger': ['challenger', 'reviewer'],
  };
  
  const contentLower = messageContent.toLowerCase();
  
  for (const [agent, keywords] of Object.entries(agentMentions)) {
    if (keywords.some(keyword => contentLower.includes(keyword))) {
      return agent;
    }
  }
  
  // Default targets based on interaction flow
  const defaultTargets: Record<string, string> = {
    'orchestrator': 'validator',
    'validator': 'retriever',
    'retriever': 'synthesizer',
    'synthesizer': 'challenger',
    'challenger': 'orchestrator',
  };
  
  return defaultTargets[fromAgent.toLowerCase()];
}