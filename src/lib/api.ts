import { Poll, CreatePollForm, Vote, ApiResponse } from '@/types';
import { createClientSupabaseClient } from '@/lib/supabase/client';

export class PollAPI {
  private static baseURL = '/api';

  static async getPolls(): Promise<Poll[]> {
    try {
      const response = await fetch(`${this.baseURL}/polls`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch polls');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching polls:', error);
      throw error;
    }
  }

  static async getPoll(id: string): Promise<Poll | null> {
    try {
      const response = await fetch(`${this.baseURL}/polls/${id}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch poll');
      }
      
      return result.data || null;
    } catch (error) {
      console.error('Error fetching poll:', error);
      throw error;
    }
  }

  static async createPoll(pollData: CreatePollForm): Promise<ApiResponse<Poll>> {
    try {
      const response = await fetch(`${this.baseURL}/polls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: pollData.title,
          description: pollData.description || null,
          options: pollData.options,
          allow_multiple_votes: pollData.allowMultipleVotes,
          require_authentication: pollData.requireAuthentication,
          expires_at: pollData.expiresAt ? pollData.expiresAt.toISOString() : null
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to create poll'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error creating poll:', error);
      return {
        success: false,
        error: 'Network error occurred while creating poll'
      };
    }
  }

  static async vote(pollId: string, optionId: string): Promise<ApiResponse<Vote>> {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          option_id: optionId
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to submit vote'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error voting:', error);
      return {
        success: false,
        error: 'Network error occurred while voting'
      };
    }
  }

  static async getUserPolls(userId: string): Promise<Poll[]> {
    try {
      const response = await fetch(`${this.baseURL}/polls?created_by=${userId}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch user polls');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Error fetching user polls:', error);
      throw error;
    }
  }

  // Additional method for multiple votes
  static async voteMultiple(pollId: string, optionIds: string[]): Promise<ApiResponse<Vote[]>> {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          option_ids: optionIds
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to submit votes'
        };
      }

      return {
        success: true,
        data: result.data
      };
    } catch (error) {
      console.error('Error voting multiple:', error);
      return {
        success: false,
        error: 'Network error occurred while voting'
      };
    }
  }
}
