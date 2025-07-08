import { KnowledgeEntry, KnowledgeStats } from '@/types/kognys';

const BASE_URL = 'https://kognys-agents-production.up.railway.app';

export class KognysKnowledgeService {
  async getKnowledge(limit: number = 50): Promise<KnowledgeEntry[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/knowledge?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`Failed to get knowledge: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting knowledge:', error);
      throw error;
    }
  }

  async getKnowledgeById(id: string): Promise<KnowledgeEntry> {
    try {
      const response = await fetch(`${BASE_URL}/api/knowledge/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to get knowledge by ID: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting knowledge by ID:', error);
      throw error;
    }
  }

  async storeKnowledge(ipfsHash: string): Promise<KnowledgeEntry> {
    try {
      const response = await fetch(`${BASE_URL}/api/knowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ipfsHash }),
      });
      if (!response.ok) {
        throw new Error(`Failed to store knowledge: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error storing knowledge:', error);
      throw error;
    }
  }

  async getKnowledgeStats(): Promise<KnowledgeStats> {
    try {
      const response = await fetch(`${BASE_URL}/api/knowledge/stats/info`);
      if (!response.ok) {
        throw new Error(`Failed to get knowledge stats: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error getting knowledge stats:', error);
      throw error;
    }
  }

  async searchKnowledge(query: string): Promise<KnowledgeEntry[]> {
    try {
      const response = await fetch(`${BASE_URL}/api/knowledge/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Failed to search knowledge: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error searching knowledge:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const kognysKnowledgeService = new KognysKnowledgeService();