import { SSEEvent, parseSSELine } from './sseTypes';

// User ID management - now uses wallet address
export const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getUserId = (): string => {
  let userId = localStorage.getItem('kognys_user_id');
  if (!userId) {
    // This should only happen if wallet is not connected
    // In practice, the app should require wallet connection first
    userId = generateUserId();
    localStorage.setItem('kognys_user_id', userId);
  }
  return userId;
};

export const setUserId = (userId: string): void => {
  localStorage.setItem('kognys_user_id', userId);
};

// API types based on the OpenAPI spec
export interface CreatePaperRequest {
  message: string;
  user_id: string;
}

export interface PaperResponse {
  paper_id: string;
  paper_content: string;
}

export interface ApiError {
  detail?: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

export interface StreamCallbacks {
  onEvent: (event: SSEEvent) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
}

// API client
export class KognysPaperApi {
  private baseUrl = 'https://kognys-agents-python-production.up.railway.app';

  async createPaper(message: string): Promise<PaperResponse> {
    const userId = getUserId();
    
    const requestBody: CreatePaperRequest = {
      message,
      user_id: userId
    };

    console.log('🚀 API Call - Create Paper:', {
      url: `${this.baseUrl}/papers`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: requestBody,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(`${this.baseUrl}/papers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📡 API Response - Create Paper:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', {
          status: response.status,
          errorData,
          timestamp: new Date().toISOString()
        });
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (response.status === 400) {
          // For 400 errors, try to extract the actual error message
          errorMessage = errorData.detail?.[0]?.msg || 
                        errorData.detail || 
                        errorData.message || 
                        errorData.error || 
                        errorMessage;
        } else {
          errorMessage = errorData.detail?.[0]?.msg || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data: PaperResponse = await response.json();
      console.log('✅ API Success Response - Create Paper:', {
        data,
        timestamp: new Date().toISOString()
      });
      
      return data;
    } catch (error) {
      console.error('💥 API Call Failed - Create Paper:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error instanceof Error ? error : new Error('Failed to create paper');
    }
  }

  async getPaper(paperId: string): Promise<PaperResponse> {
    console.log('🚀 API Call - Get Paper:', {
      url: `${this.baseUrl}/papers/${paperId}`,
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      paperId,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(`${this.baseUrl}/papers/${paperId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 API Response - Get Paper:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        url: response.url,
        timestamp: new Date().toISOString()
      });

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', {
          status: response.status,
          errorData,
          timestamp: new Date().toISOString()
        });
        
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        if (response.status === 400) {
          // For 400 errors, try to extract the actual error message
          errorMessage = errorData.detail?.[0]?.msg || 
                        errorData.detail || 
                        errorData.message || 
                        errorData.error || 
                        errorMessage;
        } else {
          errorMessage = errorData.detail?.[0]?.msg || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const data: PaperResponse = await response.json();
      console.log('✅ API Success Response - Get Paper:', {
        data,
        timestamp: new Date().toISOString()
      });
      
      return data;
    } catch (error) {
      console.error('💥 API Call Failed - Get Paper:', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw error instanceof Error ? error : new Error('Failed to get paper');
    }
  }

  /**
   * Create a paper using the streaming endpoint
   * Returns an EventSource that streams SSE events
   */
  createPaperStream(
    message: string, 
    callbacks: StreamCallbacks
  ): EventSource {
    const userId = getUserId();
    
    console.log('🚀 API Call - Create Paper Stream:', {
      url: `${this.baseUrl}/papers/stream`,
      method: 'POST (SSE)',
      message,
      userId,
      timestamp: new Date().toISOString()
    });

    // Create the request body
    const requestBody: CreatePaperRequest = {
      message,
      user_id: userId
    };

    // Create EventSource with POST request
    // Note: Standard EventSource only supports GET, so we'll use fetch with ReadableStream
    const eventSource = new EventSource(`${this.baseUrl}/papers/stream?${new URLSearchParams({
      message: message,
      user_id: userId
    })}`);

    let buffer = '';

    eventSource.onmessage = (event) => {
      console.log('📡 SSE Message:', event.data);
      
      const sseEvent = parseSSELine(`data: ${event.data}`);
      if (sseEvent) {
        callbacks.onEvent(sseEvent);
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE Error:', error);
      eventSource.close();
      callbacks.onError?.(new Error('Stream connection failed'));
    };

    eventSource.addEventListener('complete', () => {
      console.log('✅ SSE Stream Complete');
      eventSource.close();
      callbacks.onComplete?.();
    });

    return eventSource;
  }

  /**
   * Alternative streaming implementation using fetch for POST requests
   */
  async createPaperStreamPost(
    message: string,
    callbacks: StreamCallbacks,
    signal?: AbortSignal
  ): Promise<void> {
    const userId = getUserId();
    
    const requestBody: CreatePaperRequest = {
      message,
      user_id: userId
    };

    console.log('🚀 API Call - Create Paper Stream (POST):', {
      url: `${this.baseUrl}/papers/stream`,
      method: 'POST',
      body: requestBody,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(`${this.baseUrl}/papers/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(requestBody),
        signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('✅ Stream Complete');
          callbacks.onComplete?.();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (trimmedLine && trimmedLine.startsWith('data: ')) {
            const event = parseSSELine(trimmedLine);
            if (event) {
              callbacks.onEvent(event);
            }
          }
        }
      }
    } catch (error) {
      console.error('💥 Stream Error:', error);
      callbacks.onError?.(error instanceof Error ? error : new Error('Stream failed'));
      throw error;
    }
  }
}

export const kognysPaperApi = new KognysPaperApi();