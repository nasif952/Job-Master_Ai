-- 💬 Chat System Tables for Job AI Coaching
-- Run this in your Supabase SQL Editor

-- 1. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  session_name TEXT,
  agent_type TEXT DEFAULT 'job_analysis' CHECK (agent_type IN ('cv_optimization', 'email_drafting', 'interview_prep', 'job_analysis')),
  context JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_type TEXT DEFAULT 'job_analysis',
  message_type TEXT DEFAULT 'text',
  tokens INTEGER,
  model TEXT,
  context JSONB DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CVs Table (for CV upload feature)
CREATE TABLE IF NOT EXISTS cvs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  filename TEXT,
  file_url TEXT,
  mime_type TEXT,
  file_size INTEGER,
  extracted_text TEXT,
  ai_analysis JSONB,
  skills TEXT[],
  experience JSONB,
  education JSONB,
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_job ON chat_sessions(user_id, job_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_agent ON chat_sessions(user_id, job_id, agent_type);
CREATE INDEX IF NOT EXISTS idx_messages_session_time ON messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_job_agent ON messages(job_id, agent_type);
CREATE INDEX IF NOT EXISTS idx_cvs_user_active ON cvs(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_cvs_user_primary ON cvs(user_id, is_primary);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Chat Sessions RLS
CREATE POLICY "Users can only access their own chat sessions" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Messages RLS  
CREATE POLICY "Users can only access their own messages" ON messages
  FOR ALL USING (auth.uid() = user_id);

-- CVs RLS
CREATE POLICY "Users can only access their own CVs" ON cvs
  FOR ALL USING (auth.uid() = user_id);

-- 6. Update Trigger Function (for updated_at)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers
CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cvs_updated_at BEFORE UPDATE ON cvs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 