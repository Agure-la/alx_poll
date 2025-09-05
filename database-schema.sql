-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Polls table
CREATE TABLE public.polls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    allow_multiple_votes BOOLEAN DEFAULT FALSE,
    require_authentication BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE,
    qr_code_url TEXT,
    share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > NOW()),
    CONSTRAINT valid_title CHECK (length(trim(title)) > 0)
);

-- Poll options table
CREATE TABLE public.poll_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_option_text CHECK (length(trim(text)) > 0),
    CONSTRAINT unique_poll_option_order UNIQUE (poll_id, order_index)
);

-- Votes table (prevents duplicate votes)
CREATE TABLE public.votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
    voter_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    voter_email TEXT, -- For anonymous votes
    voter_phone TEXT, -- For anonymous votes
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints to prevent duplicate votes
    CONSTRAINT unique_user_vote UNIQUE (poll_id, voter_id),
    CONSTRAINT unique_email_vote UNIQUE (poll_id, voter_email),
    CONSTRAINT unique_phone_vote UNIQUE (poll_id, voter_phone),
    CONSTRAINT valid_voter_info CHECK (
        (voter_id IS NOT NULL) OR 
        (voter_email IS NOT NULL) OR 
        (voter_phone IS NOT NULL)
    )
);

-- Poll analytics table (for performance)
CREATE TABLE public.poll_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE UNIQUE NOT NULL,
    total_votes INTEGER DEFAULT 0,
    unique_voters INTEGER DEFAULT 0,
    last_vote_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poll shares table (track sharing)
CREATE TABLE public.poll_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    shared_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    share_method TEXT NOT NULL, -- 'qr', 'link', 'social'
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_polls_created_by ON public.polls(created_by);
CREATE INDEX idx_polls_active ON public.polls(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_polls_expires_at ON public.polls(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_votes_poll_id ON public.votes(poll_id);
CREATE INDEX idx_votes_option_id ON public.votes(option_id);
CREATE INDEX idx_votes_voter_id ON public.votes(voter_id);
CREATE INDEX idx_votes_created_at ON public.votes(created_at);

-- Functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at BEFORE UPDATE ON public.polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poll_analytics_updated_at BEFORE UPDATE ON public.poll_analytics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update poll analytics
CREATE OR REPLACE FUNCTION update_poll_analytics()
RETURNS TRIGGER AS $
BEGIN
    INSERT INTO public.poll_analytics (poll_id, total_votes, unique_voters, last_vote_at)
    VALUES (NEW.poll_id, 1, 1, NEW.created_at)
    ON CONFLICT (poll_id) DO UPDATE SET
        total_votes = poll_analytics.total_votes + 1,
        unique_voters = (
            SELECT COUNT(DISTINCT COALESCE(voter_id, voter_email, voter_phone))
            FROM public.votes
            WHERE poll_id = NEW.poll_id
        ),
        last_vote_at = NEW.created_at,
        updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Trigger to update analytics on vote
CREATE TRIGGER update_analytics_on_vote AFTER INSERT ON public.votes
    FOR EACH ROW EXECUTE FUNCTION update_poll_analytics();

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_shares ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Polls policies
CREATE POLICY "Anyone can view active polls" ON public.polls
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can view their own polls" ON public.polls
    FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Authenticated users can create polls" ON public.polls
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own polls" ON public.polls
    FOR UPDATE USING (created_by = auth.uid());

-- Poll options policies
CREATE POLICY "Anyone can view poll options" ON public.poll_options
    FOR SELECT USING (TRUE);

CREATE POLICY "Poll creators can manage options" ON public.poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE id = poll_options.poll_id 
            AND created_by = auth.uid()
        )
    );

-- Votes policies
CREATE POLICY "Anyone can view votes" ON public.votes
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can vote" ON public.votes
    FOR INSERT WITH CHECK (
        voter_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE id = votes.poll_id 
            AND is_active = TRUE 
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY "Anonymous users can vote on public polls" ON public.votes
    FOR INSERT WITH CHECK (
        voter_id IS NULL AND
        (voter_email IS NOT NULL OR voter_phone IS NOT NULL) AND
        EXISTS (
            SELECT 1 FROM public.polls 
            WHERE id = votes.poll_id 
            AND is_active = TRUE 
            AND require_authentication = FALSE
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

-- Analytics policies
CREATE POLICY "Anyone can view poll analytics" ON public.poll_analytics
    FOR SELECT USING (TRUE);

-- Shares policies
CREATE POLICY "Anyone can view poll shares" ON public.poll_shares
    FOR SELECT USING (TRUE);

CREATE POLICY "Authenticated users can create shares" ON public.poll_shares
    FOR INSERT WITH CHECK (shared_by = auth.uid());

-- Views for easier querying
CREATE OR REPLACE VIEW public.poll_results AS
SELECT 
    p.id as poll_id,
    p.title,
    p.description,
    p.created_by,
    p.allow_multiple_votes,
    p.require_authentication,
    p.expires_at,
    po.id as option_id,
    po.text as option_text,
    po.order_index,
    COUNT(v.id) as vote_count,
    pa.total_votes,
    CASE 
        WHEN pa.total_votes > 0 
        THEN ROUND((COUNT(v.id)::DECIMAL / pa.total_votes) * 100, 2)
        ELSE 0 
    END as percentage
FROM public.polls p
JOIN public.poll_options po ON p.id = po.poll_id
LEFT JOIN public.votes v ON po.id = v.option_id
LEFT JOIN public.poll_analytics pa ON p.id = pa.poll_id
WHERE p.is_active = TRUE
GROUP BY p.id, p.title, p.description, p.created_by, p.allow_multiple_votes, p.require_authentication, 
         p.expires_at, po.id, po.text, po.order_index, pa.total_votes
ORDER BY p.created_at DESC, po.order_index;

-- Function to get user's vote for a poll
CREATE OR REPLACE FUNCTION get_user_vote(poll_uuid UUID)
RETURNS TABLE(option_id UUID, option_text TEXT) AS $
BEGIN
    RETURN QUERY
    SELECT po.id, po.text
    FROM public.votes v
    JOIN public.poll_options po ON v.option_id = po.id
    WHERE v.poll_id = poll_uuid 
    AND v.voter_id = auth.uid();
END;
$ LANGUAGE plpgsql SECURITY DEFINER;
