import { Poll, CreatePollForm, Vote, ApiResponse } from '@/types';

/**
 * A class that provides methods for interacting with the poll API.
 * This class encapsulates all the logic for making API requests to the poll endpoints.
 */
export class PollAPI {
  private static baseURL = '/api';

  /**
   * Fetches a list of polls from the API.
   * @returns A promise that resolves to an array of polls.
   */
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

  /**
   * Fetches a single poll from the API by its ID.
   * @param id The ID of the poll to fetch.
   * @returns A promise that resolves to the poll object or null if not found.
   */
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

  /**
   * Creates a new poll.
   * @param pollData The data for the new poll.
   * @returns A promise that resolves to the created poll.
   */
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

  /**
   * Updates an existing poll.
   * @param pollId The ID of the poll to update.
   * @param pollData The new data for the poll.
   * @returns A promise that resolves to the updated poll.
   */
  static async updatePoll(pollId: string, pollData: CreatePollForm): Promise<ApiResponse<Poll>> {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pollData),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to update poll',
        };
      }

      return { success: true, data: result.data };
    } catch (error) {
      console.error('Error updating poll:', error);
      return {
        success: false,
        error: 'Network error occurred while updating poll',
      };
    }
  }

  /**
   * Deletes a poll.
   * @param pollId The ID of the poll to delete.
   * @returns A promise that resolves when the poll is deleted.
   */
  static async deletePoll(pollId: string): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${this.baseURL}/polls/${pollId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        return {
          success: false,
          error: result.error || 'Failed to delete poll',
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting poll:', error);
      return {
        success: false,
        error: 'Network error occurred while deleting poll',
      };
    }
  }

  /**
   * Submits a vote for a poll.
   * @param pollId The ID of the poll to vote on.
   * @param optionId The ID of the option to vote for.
   * @returns A promise that resolves to the new vote object.
   */
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

  /**
   * Fetches all polls created by a specific user.
   * @param userId The ID of the user.
   * @returns A promise that resolves to an array of polls.
   */
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

  /**
   * Submits multiple votes for a poll.
   * @param pollId The ID of the poll to vote on.
   * @param optionIds The IDs of the options to vote for.
   * @returns A promise that resolves to an array of new vote objects.
   */
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