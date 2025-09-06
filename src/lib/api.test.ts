
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { PollAPI } from '@/lib/api';
import { server } from '@/lib/setup-tests';
import { CreatePollForm, Poll } from '@/types';

describe('PollAPI', () => {
  it('should fetch polls', async () => {
    const mockPolls: Poll[] = [
      {
        id: '1',
        title: 'Test Poll',
        description: 'A test poll',
        options: [{ id: '1', text: 'Option 1', vote_count: 0 }],
        created_at: new Date().toISOString(),
        expires_at: null,
        allow_multiple_votes: false,
        require_authentication: false,
        created_by: 'user1',
      },
    ];

    server.use(
      http.get('/api/polls', () => {
        return HttpResponse.json({ data: mockPolls });
      })
    );

    const polls = await PollAPI.getPolls();
    expect(polls).toEqual(mockPolls);
  });

  it('should fetch a single poll', async () => {
    const mockPoll: Poll = {
      id: '1',
      title: 'Test Poll',
      description: 'A test poll',
      options: [{ id: '1', text: 'Option 1', vote_count: 0 }],
      created_at: new Date().toISOString(),
      expires_at: null,
      allow_multiple_votes: false,
      require_authentication: false,
      created_by: 'user1',
    };

    server.use(
      http.get('/api/polls/1', () => {
        return HttpResponse.json({ data: mockPoll });
      })
    );

    const poll = await PollAPI.getPoll('1');
    expect(poll).toEqual(mockPoll);
  });

  it('should create a poll', async () => {
    const pollData: CreatePollForm = {
      title: 'New Poll',
      description: 'A new poll',
      options: [{ text: 'Option 1' }, { text: 'Option 2' }],
      allowMultipleVotes: false,
      requireAuthentication: false,
    };

    const mockCreatedPoll: Poll = {
      id: '2',
      ...pollData,
      options: [
        { id: '3', text: 'Option 1', vote_count: 0 },
        { id: '4', text: 'Option 2', vote_count: 0 },
      ],
      created_at: new Date().toISOString(),
      expires_at: null,
      created_by: 'user1',
    };

    server.use(
      http.post('/api/polls', async () => {
        return HttpResponse.json({ data: mockCreatedPoll });
      })
    );

    const result = await PollAPI.createPoll(pollData);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockCreatedPoll);
  });
});
