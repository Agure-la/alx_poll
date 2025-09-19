import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PollResultCharts } from '@/components/polls/poll-result-charts';
import { CommentsSection } from '@/components/polls/comments-section';
import { QRCodeGenerator } from '@/components/polls/qr-code-generator';

// Mock data
const mockPoll = {
  id: '1',
  title: 'Test Poll',
  description: 'Test Description',
  options: [
    { id: '1', text: 'Option 1', votes: 10 },
    { id: '2', text: 'Option 2', votes: 5 }
  ],
  created_by: 'user1',
  expires_at: new Date(Date.now() + 86400000).toISOString()
};

const mockAnalytics = {
  totalVotes: 15,
  uniqueVoters: 12,
  engagementRate: 75.0,
  commentsCount: 3,
  votingTrend: [
    { date: '2024-01-01', votes: 5 },
    { date: '2024-01-02', votes: 10 },
    { date: '2024-01-03', votes: 15 }
  ],
  optionBreakdown: [
    { option: 'Option 1', votes: 10 },
    { option: 'Option 2', votes: 5 }
  ],
  insights: [
    {
      title: 'High Engagement',
      description: 'This poll has above average engagement',
      type: 'positive'
    }
  ]
};

describe('PollResultCharts', () => {
  it('renders poll results correctly', () => {
    render(<PollResultCharts poll={mockPoll} analytics={mockAnalytics} />);
    
    expect(screen.getByText('Vote Distribution')).toBeInTheDocument();
    expect(screen.getByText('Vote Counts')).toBeInTheDocument();
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
  });

  it('shows winning option indicator', () => {
    render(<PollResultCharts poll={mockPoll} analytics={mockAnalytics} />);
    
    // Option 1 should have the winning indicator (more votes)
    const trendingIcons = screen.getAllByTestId('trending-up-icon');
    expect(trendingIcons).toHaveLength(1);
  });
});

describe('CommentsSection', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('renders comments section', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: [] })
    });

    render(<CommentsSection pollId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('Comments (0)')).toBeInTheDocument();
    });
  });

  it('allows posting new comments when authenticated', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

    render(<CommentsSection pollId="1" />);
    
    const textarea = screen.getByPlaceholderText('Share your thoughts about this poll...');
    const submitButton = screen.getByText('Post Comment');
    
    await user.type(textarea, 'This is a test comment');
    await user.click(submitButton);
    
    expect(global.fetch).toHaveBeenCalledWith('/api/polls/1/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'This is a test comment' })
    });
  });
});

describe('QRCodeGenerator', () => {
  it('renders QR code dialog trigger', () => {
    render(<QRCodeGenerator pollId="1" pollTitle="Test Poll" />);
    
    expect(screen.getByText('QR Code')).toBeInTheDocument();
  });

  it('generates QR code when dialog is opened', async () => {
    const user = userEvent.setup();
    
    render(<QRCodeGenerator pollId="1" pollTitle="Test Poll" />);
    
    const trigger = screen.getByText('QR Code');
    await user.click(trigger);
    
    expect(screen.getByText('Share Poll via QR Code')).toBeInTheDocument();
  });
});