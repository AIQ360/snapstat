-- Create user_profiles table (already exists in our boilerplate)
-- CREATE TABLE user_profiles (
--   id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--   full_name TEXT,
--   avatar_url TEXT,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Create credits table (already exists in our boilerplate)
-- CREATE TABLE credits (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   credits INTEGER NOT NULL DEFAULT 0,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Create daily_analytics table for storing summarized GA data
CREATE TABLE daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  visitors INTEGER NOT NULL DEFAULT 0,
  page_views INTEGER NOT NULL DEFAULT 0,
  avg_session_duration FLOAT NOT NULL DEFAULT 0,
  bounce_rate FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create referrers table for storing top referrers
CREATE TABLE referrers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_analytics_id UUID NOT NULL REFERENCES daily_analytics(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  visitors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create top_pages table for storing top pages
CREATE TABLE top_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_analytics_id UUID NOT NULL REFERENCES daily_analytics(id) ON DELETE CASCADE,
  page_path TEXT NOT NULL,
  page_views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table for storing significant events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  event_type TEXT NOT NULL, -- 'spike', 'drop', 'milestone', etc.
  title TEXT NOT NULL,
  description TEXT,
  value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ga_accounts table for storing Google Analytics account info
CREATE TABLE ga_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ga_account_id TEXT NOT NULL,
  ga_property_id TEXT NOT NULL,
  website_url TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  data_consent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE daily_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;
ALTER TABLE top_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ga_accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_analytics
CREATE POLICY "Users can view their own analytics"
ON daily_analytics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
ON daily_analytics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
ON daily_analytics FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for referrers
CREATE POLICY "Users can view their own referrers"
ON referrers FOR SELECT
USING (EXISTS (
  SELECT 1 FROM daily_analytics
  WHERE daily_analytics.id = referrers.daily_analytics_id
  AND daily_analytics.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own referrers"
ON referrers FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM daily_analytics
  WHERE daily_analytics.id = referrers.daily_analytics_id
  AND daily_analytics.user_id = auth.uid()
));

-- Create RLS policies for top_pages
CREATE POLICY "Users can view their own top pages"
ON top_pages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM daily_analytics
  WHERE daily_analytics.id = top_pages.daily_analytics_id
  AND daily_analytics.user_id = auth.uid()
));

CREATE POLICY "Users can insert their own top pages"
ON top_pages FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM daily_analytics
  WHERE daily_analytics.id = top_pages.daily_analytics_id
  AND daily_analytics.user_id = auth.uid()
));

-- Create RLS policies for events
CREATE POLICY "Users can view their own events"
ON events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
ON events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events"
ON events FOR UPDATE
USING (auth.uid() = user_id);

-- Create RLS policies for ga_accounts
CREATE POLICY "Users can view their own GA accounts"
ON ga_accounts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own GA accounts"
ON ga_accounts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own GA accounts"
ON ga_accounts FOR UPDATE
USING (auth.uid() = user_id);
