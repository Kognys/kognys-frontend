import { kognysPaperApi } from './kognysPaperApi';

interface KognysMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface KognysChatOptions {
  messages: KognysMessage[];
  onChunk?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom transport for Kognys API that provides streaming-like behavior
 * compatible with Vercel AI SDK useChat hook
 */
export class KognysChatTransport {
  async sendMessages({ messages, onChunk, onComplete, onError }: KognysChatOptions) {
    try {
      // Get the last user message
      const lastUserMessage = messages
        .slice()
        .reverse()
        .find(msg => msg.role === 'user');
      
      if (!lastUserMessage) {
        throw new Error('No user message found');
      }

      // Call Kognys API
      const response = await kognysPaperApi.createPaper(lastUserMessage.content);
      const fullResponse = response.paper_content;

      // Simulate streaming by chunking the response
      if (onChunk && fullResponse) {
        let currentIndex = 0;
        const chunkSize = Math.max(1, Math.floor(fullResponse.length / 50)); // Adaptive chunk size
        
        const streamInterval = setInterval(() => {
          if (currentIndex < fullResponse.length) {
            const chunk = fullResponse.slice(currentIndex, Math.min(currentIndex + chunkSize, fullResponse.length));
            onChunk(chunk);
            currentIndex += chunkSize;
          } else {
            clearInterval(streamInterval);
            onComplete?.(fullResponse);
          }
        }, 20); // Faster streaming than original implementation
      } else {
        onComplete?.(fullResponse);
      }

      return {
        paper_content: fullResponse,
        status: 'success'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onError?.(new Error(`Failed to generate research paper: ${errorMessage}`));
      throw error;
    }
  }
}

export const kognysChatTransport = new KognysChatTransport();