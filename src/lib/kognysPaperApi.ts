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

    try {
      const response = await fetch(`${this.baseUrl}/papers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail?.[0]?.msg || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data: PaperResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating paper:', error);
      throw error instanceof Error ? error : new Error('Failed to create paper');
    }
  }

  async getPaper(paperId: string): Promise<PaperResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/papers/${paperId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail?.[0]?.msg || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data: PaperResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error getting paper:', error);
      throw error instanceof Error ? error : new Error('Failed to get paper');
    }
  }
}

export const kognysPaperApi = new KognysPaperApi();