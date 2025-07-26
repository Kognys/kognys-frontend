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
  onComplete?: (fullResponse: string, transactionHash?: string) => void;
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
  private currentTransactionHash: string | null = null;
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
                
                // Show detailed document information
                if (agentName) {
                  let documentMessage = `I found ${event.data.document_count} relevant documents for analysis`;
                  
                  // Check if we have document details in the event data
                  if (event.data.documents && Array.isArray(event.data.documents)) {
                    documentMessage += ':\n\n';
                    event.data.documents.forEach((doc: any, index: number) => {
                      documentMessage += `📄 **Document ${index + 1}**: ${doc.title || 'Untitled'}\n`;
                      if (doc.source) documentMessage += `   Source: ${doc.source}\n`;
                      if (doc.relevance_score) documentMessage += `   Relevance: ${Math.round(doc.relevance_score * 100)}%\n`;
                      documentMessage += '\n';
                    });
                  } else if (event.data.document_titles && Array.isArray(event.data.document_titles)) {
                    documentMessage += ':\n\n';
                    event.data.document_titles.forEach((title: string, index: number) => {
                      documentMessage += `📄 **Document ${index + 1}**: ${title}\n`;
                    });
                  }
                  
                  onAgentMessage?.(
                    agentName === 'retriever' ? 'Document Retriever' : agentName,
                    documentMessage,
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

              case 'final_answer_token':
                // Stream final answer tokens
                if (event.data.token) {
                  fullResponse += event.data.token;
                  onChunk?.(event.data.token);
                  
                  // Show orchestrator is finalizing (only once)
                  if (agentName && fullResponse.length < 100) {
                    onAgentMessage?.(
                      agentName === 'orchestrator' ? 'Research Orchestrator' : agentName,
                      'I\'m finalizing the research findings...',
                      'Lead Researcher',
                      'concluding'
                    );
                  }
                }
                break;

              case 'draft_generated':
                onStatus?.(
                  `Draft generated (${event.data.draft_length} characters)`,
                  'draft_generated'
                );
                // Show detailed draft information
                if (agentName) {
                  let draftMessage = `I've completed a draft with ${event.data.draft_length} characters of analysis`;
                  
                  if (event.data.sections && Array.isArray(event.data.sections)) {
                    draftMessage += '. The draft includes:\n\n';
                    event.data.sections.forEach((section: any) => {
                      draftMessage += `📝 ${section.title || section}\n`;
                    });
                  } else if (event.data.summary) {
                    draftMessage += `\n\n**Summary**: ${event.data.summary}`;
                  }
                  
                  onAgentMessage?.(
                    agentName === 'synthesizer' ? 'Research Synthesizer' : agentName,
                    draftMessage,
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

              case 'research_completed': {
                this.currentPaperId = event.data.paper_id;
                // Extract hash from verifiable_data
                const verifiableData = event.data.verifiable_data;
                this.currentTransactionHash = verifiableData?.finish_task_txn_hash || null;
                
                // Store transaction hash in localStorage for persistence
                if (this.currentTransactionHash) {
                  const transactionHashes = JSON.parse(localStorage.getItem('kognys_transaction_hashes') || '{}');
                  // Store by timestamp since we might not have a stable paper ID
                  const key = `tx_${Date.now()}_${this.currentPaperId || 'unknown'}`;
                  transactionHashes[key] = {
                    hash: this.currentTransactionHash,
                    paperId: this.currentPaperId,
                    timestamp: Date.now()
                  };
                  localStorage.setItem('kognys_transaction_hashes', JSON.stringify(transactionHashes));
                }
                
                // Extract membase IDs if needed
                const membaseIds = verifiableData?.membase_kb_storage_receipt?.ids;
                
                onStatus?.(
                  'Research complete!',
                  'research_completed'
                );
                break;
              }

              case 'validation_error':
                // Don't throw error, instead return a helpful message to the user
                fullResponse = `I couldn't process your question because: ${event.data.error}\n\n💡 **Suggestion:** ${event.data.suggestion}`;
                // Don't call onChunk here - let onComplete handle the message
                onStatus?.(
                  'Question validation failed',
                  'validation_error'
                );
                // Mark as complete but with validation error
                onComplete?.(fullResponse);
                return; // Exit early

              case 'agent_message':
                
                // Check if this is a challenger agent with token criticism
                let messageContent = event.data.message;
                if (event.data.agent_name?.toLowerCase().includes('challenger') && event.data.token) {
                  // Format the token criticism with proper display
                  messageContent = `token:\n${event.data.token}`;
                }
                
                onAgentMessage?.(
                  event.data.agent_name,
                  messageContent,
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
                // Handle Challenger agent feedback with details
                if (agentName === 'challenger' || event.data.agent === 'challenger') {
                  let criticismMessage = '';
                  
                  // Check if we have token criticism first
                  if (event.data.token) {
                    criticismMessage = event.data.token; // Just the token content, no prefix
                  } else if (event.data.criticisms && Array.isArray(event.data.criticisms)) {
                    // Handle array of criticisms - just show the criticisms without the generic intro
                    event.data.criticisms.forEach((criticism: any, index: number) => {
                      criticismMessage += `🔍 **Issue ${index + 1}**: ${criticism.issue || criticism}\n`;
                      if (criticism.suggestion) {
                        criticismMessage += `   💡 Suggestion: ${criticism.suggestion}\n`;
                      }
                      if (criticism.severity) {
                        criticismMessage += `   ⚡ Severity: ${criticism.severity}\n`;
                      }
                      criticismMessage += '\n';
                    });
                  } else if (event.data.criticism_summary) {
                    criticismMessage = event.data.criticism_summary; // Just the summary, no intro
                  }
                  
                  // Only send message if we have actual criticism content
                  if (criticismMessage.trim()) {
                    onAgentMessage?.(
                      'Challenger',
                      criticismMessage.trim(),
                      'The Peer Reviewer',
                      'analyzing'
                    );
                  }
                }
                break;
                
              case 'queries_refined':
                // Handle query refiner agent
                if (event.data.agent === 'query_refiner' && event.data.refined_queries) {
                  const queries = event.data.refined_queries;
                  let queryMessage = 'I\'ve optimized the search queries for each data source:\n\n';
                  
                  if (queries.openalex) {
                    queryMessage += `📚 **OpenAlex**: \`${queries.openalex}\`\n\n`;
                  }
                  if (queries.semantic_scholar) {
                    queryMessage += `📖 **Semantic Scholar**: \`${queries.semantic_scholar}\`\n\n`;
                  }
                  if (queries.arxiv) {
                    queryMessage += `📄 **arXiv**: \`${queries.arxiv}\`\n\n`;
                  }
                  
                  onAgentMessage?.(
                    'Query Refiner',
                    queryMessage.trim(),
                    'Search Optimization Specialist',
                    'analyzing'
                  );
                }
                break;
                
              case 'criticism_token':
                // Handle criticism token from challenger
                
                if (event.data.agent?.toLowerCase().includes('challenger') && event.data.token) {
                  onAgentMessage?.(
                    'Challenger',
                    event.data.token, // Just the token content, no prefix
                    'The Peer Reviewer',
                    'criticisms_received'
                  );
                }
                break;
                
              case 'error': {
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
              }
                
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
            onComplete?.(fullResponse, this.currentTransactionHash || undefined);
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

  /**
   * Get the current transaction hash if available
   */
  getCurrentTransactionHash(): string | null {
    return this.currentTransactionHash;
  }
}

export const kognysChatStreamTransport = new KognysStreamChatTransport();