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
            console.log('📊 Event:', event.event_type, event);

            // Handle different event types
            switch (event.event_type) {
              case 'research_started':
                researchPhase = 'starting';
                onStatus?.(
                  `Starting research: "${event.data.question}"`,
                  'research_started'
                );
                break;

              case 'question_validated':
                researchPhase = 'validating';
                onStatus?.(
                  `Question refined: "${event.data.validated_question}"`,
                  'question_validated'
                );
                break;

              case 'documents_retrieved':
                documentCount += event.data.document_count;
                onStatus?.(
                  `Retrieved ${event.data.document_count} documents (${documentCount} total)`,
                  'documents_retrieved'
                );
                break;

              case 'draft_answer_token':
                // Stream content tokens
                if (event.data.token) {
                  fullResponse += event.data.token;
                  onChunk?.(event.data.token);
                }
                break;

              case 'draft_generated':
                onStatus?.(
                  `Draft generated (${event.data.draft_length} characters)`,
                  'draft_generated'
                );
                break;

              case 'orchestrator_decision':
                if (event.data.decision === 'RESEARCH_AGAIN') {
                  researchIterations++;
                  onStatus?.(
                    `Conducting additional research (iteration ${researchIterations + 1})...`,
                    'orchestrator_decision'
                  );
                } else if (event.data.decision === 'FINALIZE') {
                  onStatus?.(
                    'Finalizing research paper...',
                    'orchestrator_decision'
                  );
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
                
              case 'error':
                throw new Error(event.data.error || 'Unknown error occurred');
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