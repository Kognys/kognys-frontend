// SSE Event Types for Kognys Streaming API

export interface BaseSSEEvent {
  event_type: string;
  timestamp: number;
}

export interface ResearchStartedEvent extends BaseSSEEvent {
  event_type: 'research_started';
  data: {
    question: string;
    task_id: string;
    status: string;
  };
}

export interface QuestionValidatedEvent extends BaseSSEEvent {
  event_type: 'question_validated';
  data: {
    validated_question: string;
    status: string;
  };
}

export interface DocumentsRetrievedEvent extends BaseSSEEvent {
  event_type: 'documents_retrieved';
  data: {
    document_count: number;
    status: string;
  };
}

export interface DraftAnswerTokenEvent extends BaseSSEEvent {
  event_type: 'draft_answer_token';
  data: {
    token: string;
  };
}

export interface DraftGeneratedEvent extends BaseSSEEvent {
  event_type: 'draft_generated';
  data: {
    draft_length: number;
    status: string;
  };
}

export interface OrchestratorDecisionEvent extends BaseSSEEvent {
  event_type: 'orchestrator_decision';
  data: {
    decision: 'RESEARCH_AGAIN' | 'FINALIZE' | 'CONTINUE';
    status: string;
  };
}

export interface ResearchCompleteEvent extends BaseSSEEvent {
  event_type: 'research_complete';
  data: {
    paper_id: string;
    status: string;
    finish_task_txn_hash?: string;
  };
}

export interface ErrorEvent extends BaseSSEEvent {
  event_type: 'error';
  data: {
    error: string;
    details?: any;
  };
}

export interface ValidationErrorEvent extends BaseSSEEvent {
  event_type: 'validation_error';
  data: {
    error: string;
    status: string;
    suggestion: string;
  };
}

export interface AgentMessageEvent extends BaseSSEEvent {
  event_type: 'agent_message';
  data: {
    agent_name: string;
    agent_role?: string;
    message: string;
    message_type?: 'thinking' | 'speaking' | 'analyzing' | 'concluding';
  };
}

export interface AgentDebateEvent extends BaseSSEEvent {
  event_type: 'agent_debate';
  data: {
    agents: Array<{
      name: string;
      role: string;
      position?: string;
    }>;
    topic?: string;
    status: string;
  };
}

export type SSEEvent = 
  | ResearchStartedEvent
  | QuestionValidatedEvent
  | DocumentsRetrievedEvent
  | DraftAnswerTokenEvent
  | DraftGeneratedEvent
  | OrchestratorDecisionEvent
  | ResearchCompleteEvent
  | ErrorEvent
  | ValidationErrorEvent
  | AgentMessageEvent
  | AgentDebateEvent;

// Helper function to parse SSE data line
export function parseSSELine(line: string): SSEEvent | null {
  if (!line.startsWith('data: ')) {
    return null;
  }
  
  try {
    const jsonStr = line.slice(6).trim();
    if (jsonStr === '[DONE]') {
      return null;
    }
    return JSON.parse(jsonStr) as SSEEvent;
  } catch (error) {
    console.error('Failed to parse SSE line:', line, error);
    return null;
  }
}

// Helper to determine if event contains content
export function isContentEvent(event: SSEEvent): event is DraftAnswerTokenEvent {
  return event.event_type === 'draft_answer_token';
}

// Helper to determine if event is a status update
export function isStatusEvent(event: SSEEvent): boolean {
  return [
    'research_started',
    'question_validated',
    'documents_retrieved',
    'draft_generated',
    'orchestrator_decision'
  ].includes(event.event_type);
}