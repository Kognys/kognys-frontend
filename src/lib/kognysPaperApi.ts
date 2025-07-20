// User ID management
export const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getUserId = (): string => {
  let userId = localStorage.getItem('kognys_user_id');
  if (!userId) {
    userId = generateUserId();
    localStorage.setItem('kognys_user_id', userId);
  }
  return userId;
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
}

export const kognysPaperApi = new KognysPaperApi();