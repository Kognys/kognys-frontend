import { kognysPaperApi } from './kognysPaperApi';
import { SSEEvent, isContentEvent, isStatusEvent } from './sseTypes';

interface KognysMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface KognysStreamOptions {
  messages: KognysMessage[];
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
  onStatus?: (status: string, eventType: string) => void;
  onAgentMessage?: (agent: string, message: string, role?: string, messageType?: string) => void;
  onAgentDebate?: (agents: Array<{name: string; role: string; position?: string}>, topic?: string) => void;
  signal?: AbortSignal;
}

/**
 * Streaming transport for Kognys API that handles SSE events
 */
export class KognysStreamChatTransport {
  private currentPaperId: string | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  async sendMessages({ 
    messages, 
    onChunk, 
    onComplete, 
    onError,
    onStatus,
    onAgentMessage,
    onAgentDebate,
    signal 
  }: KognysStreamOptions) {
    let retryCount = 0;
    
    const attemptStream = async (): Promise<any> => {
      try {
        // Get the last user message
        const lastUserMessage = messages
          .slice()
          .reverse()
          .find(msg => msg.role === 'user');
        
        if (!lastUserMessage) {
          throw new Error('No user message found');
        }

        let fullResponse = '';
        let researchPhase = 'initializing';
        let documentCount = 0;
        let researchIterations = 0;

        // Use the POST streaming method
        await kognysPaperApi.createPaperStreamPost(
          lastUserMessage.content,
        {
          onEvent: (event: SSEEvent) => {
            // Debug agent events specifically
            if (event.event_type === 'agent_message' || event.event_type === 'agent_debate') {
              // Agent event detected
            }

            // Extract agent information from the event
            const agentName = (event as any).agent || event.data.agent;
            
            // Handle different event types
            switch (event.event_type) {
              case 'research_started':
                researchPhase = 'starting';
                // Show agent message for research_started
                onAgentMessage?.(
                  'Research Orchestrator',
                  `Starting research on: "${event.data.question}"`,
                  'Lead Coordinator',
                  'analyzing'
                );
                break;

              case 'question_validated':
                researchPhase = 'validating';
                onStatus?.(
                  `Question refined: "${event.data.validated_question}"`,
                  'question_validated'
                );
                // Show agent message
                if (agentName) {
                  onAgentMessage?.(
                    agentName === 'input_validator' ? 'Input Validator' : agentName,
                    `I've validated and refined your question to: "${event.data.validated_question}"`,
                    'Validation Expert',
                    'analyzing'
                  );
                }
                break;

              case 'documents_retrieved':
                documentCount += event.data.document_count;
                onStatus?.(
                  `Retrieved ${event.data.document_count} documents (${documentCount} total)`,
                  'documents_retrieved'
                );
                // Show agent message
                if (agentName) {
                  onAgentMessage?.(
                    agentName === 'retriever' ? 'Document Retriever' : agentName,
                    `I found ${event.data.document_count} relevant documents for analysis`,
                    'Research Specialist',
                    'speaking'
                  );
                }
                break;

              case 'draft_answer_token':
                // Stream content tokens
                if (event.data.token) {
                  fullResponse += event.data.token;
                  onChunk?.(event.data.token);
                  
                  // Show synthesizer is working (only once)
                  if (agentName && fullResponse.length < 100) {
                    onAgentMessage?.(
                      agentName === 'synthesizer' ? 'Research Synthesizer' : agentName,
                      'I\'m synthesizing the research findings into a comprehensive answer...',
                      'Content Specialist',
                      'thinking'
                    );
                  }
                }
                break;

              case 'draft_generated':
                onStatus?.(
                  `Draft generated (${event.data.draft_length} characters)`,
                  'draft_generated'
                );
                // Show agent message
                if (agentName) {
                  onAgentMessage?.(
                    agentName === 'synthesizer' ? 'Research Synthesizer' : agentName,
                    `I've completed a draft with ${event.data.draft_length} characters of analysis`,
                    'Content Specialist',
                    'concluding'
                  );
                }
                break;

              case 'orchestrator_decision':
                if (event.data.decision === 'RESEARCH_AGAIN') {
                  researchIterations++;
                  onStatus?.(
                    `Conducting additional research (iteration ${researchIterations + 1})...`,
                    'orchestrator_decision'
                  );
                  // Show orchestrator decision
                  if (agentName) {
                    onAgentMessage?.(
                      'Research Orchestrator',
                      'I think we need more information. Let me conduct another round of research to ensure comprehensive coverage.',
                      'Lead Coordinator',
                      'analyzing'
                    );
                  }
                } else if (event.data.decision === 'FINALIZE') {
                  onStatus?.(
                    'Finalizing research paper...',
                    'orchestrator_decision'
                  );
                  // Show orchestrator decision
                  if (agentName) {
                    onAgentMessage?.(
                      'Research Orchestrator',
                      'The research is complete. Finalizing the comprehensive analysis now.',
                      'Lead Coordinator',
                      'concluding'
                    );
                  }
                }
                break;

              case 'research_complete':
                this.currentPaperId = event.data.paper_id;
                onStatus?.(
                  'Research complete!',
                  'research_complete'
                );
                break;

              case 'validation_error':
                // Don't throw error, instead return a helpful message to the user
                fullResponse = `I couldn't process your question because: ${event.data.error}\n\n💡 **Suggestion:** ${event.data.suggestion}`;
                onChunk?.(fullResponse);
                onStatus?.(
                  'Question validation failed',
                  'validation_error'
                );
                // Mark as complete but with validation error
                onComplete?.(fullResponse);
                return; // Exit early

              case 'agent_message':
                onAgentMessage?.(
                  event.data.agent_name,
                  event.data.message,
                  event.data.agent_role,
                  event.data.message_type
                );
                break;

              case 'agent_debate':
                onAgentDebate?.(
                  event.data.agents,
                  event.data.topic
                );
                onStatus?.(
                  `Agents debating: ${event.data.topic || 'research approach'}`,
                  'agent_debate'
                );
                break;
                
              case 'criticisms_received':
                // Handle Challenger agent feedback
                if (agentName === 'challenger') {
                  onAgentMessage?.(
                    'Challenger',
                    event.data.criticisms || 'Reviewing the draft for improvements...',
                    'The Peer Reviewer',
                    'analyzing'
                  );
                }
                break;
                
              case 'error':
                const errorMessage = event.data.error || 'Unknown error occurred';
                
                // List of non-critical errors to ignore
                const ignorableErrors = [
                  "name 'json' is not defined",
                  "Error in execute_streaming",
                  "NameError"
                ];
                
                const isIgnorable = ignorableErrors.some(err => errorMessage.includes(err));
                
                if (isIgnorable) {
                  console.warn('⚠️ Ignoring non-critical backend error:', errorMessage);
                  // Continue processing, don't throw
                } else {
                  console.error('❌ Backend error:', errorMessage);
                  throw new Error(errorMessage);
                }
                break;
                
              default:
                // Unknown event type
                // Check if it might be an agent-related event with different naming
                if (event.data && typeof event.data === 'object') {
                  if ('agent' in event.data || 'agent_name' in event.data) {
                    // Possible agent event with different structure
                  }
                }
            }
          },
          onComplete: () => {
            onComplete?.(fullResponse);
          },
          onError: (error) => {
            console.error('Stream error:', error);
            onError?.(error);
          }
        },
        signal
      );

      return {
        paper_content: fullResponse,
        paper_id: this.currentPaperId,
        status: 'success'
      };
    } catch (error) {
      if (signal?.aborted) {
        throw error;
      }

      const isRetryable = error instanceof Error && 
        (error.message.includes('Stream connection failed') ||
         error.message.includes('HTTP error') ||
         error.message.includes('fetch'));

      if (isRetryable && retryCount < this.maxRetries) {
        retryCount++;
        const delay = this.retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
        
        onStatus?.(
          `Connection failed. Retrying in ${delay / 1000} seconds... (Attempt ${retryCount}/${this.maxRetries})`,
          'retry'
        );
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptStream();
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(new Error(`Failed to generate research paper: ${errorMessage}`));
      throw error;
    }
    };
    
    return attemptStream();
  }

  /**
   * Get the current paper ID if available
   */
  getCurrentPaperId(): string | null {
    return this.currentPaperId;
  }
}

export const kognysChatStreamTransport = new KognysStreamChatTransport();