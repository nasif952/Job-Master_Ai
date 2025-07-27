-- 🚀 FULL PROJECT SCHEMA EXPORT
-- Database: Comprehensive Project Rebuild Script

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;

-- ==========================================
-- CHAT SESSIONS TABLE
-- ==========================================
CREATE TABLE public.chat_sessions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes for Chat Sessions
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created_at ON public.chat_sessions(created_at);

-- RLS Policy for Chat Sessions
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_sessions_user_isolation" ON public.chat_sessions
    FOR ALL 
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- ==========================================
-- MESSAGES TABLE
-- ==========================================
CREATE TABLE public.messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    chat_session_id BIGINT NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tokens INTEGER DEFAULT 0,
    embedding vector(384),
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes for Messages
CREATE INDEX idx_messages_user_id ON public.messages(user_id);
CREATE INDEX idx_messages_chat_session_id ON public.messages(chat_session_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);
CREATE INDEX idx_messages_role ON public.messages(role);

-- RLS Policy for Messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_user_isolation" ON public.messages
    FOR ALL 
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- ==========================================
-- CVS (CURRICULUM VITAE) TABLE
-- ==========================================
CREATE TABLE public.cvs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    summary TEXT,
    skills TEXT[],
    experience JSONB,
    education JSONB,
    certifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_public BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::JSONB
);

-- Indexes for CVs
CREATE INDEX idx_cvs_user_id ON public.cvs(user_id);
CREATE INDEX idx_cvs_full_name ON public.cvs(full_name);
CREATE INDEX idx_cvs_created_at ON public.cvs(created_at);

-- RLS Policy for CVs
ALTER TABLE public.cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cvs_user_isolation" ON public.cvs
    FOR ALL 
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Optional: Public CV View Policy
CREATE POLICY "public_cv_view" ON public.cvs
    FOR SELECT 
    TO anon, authenticated
    USING (is_public = true);

-- ==========================================
-- VECTOR EXTENSION (IF USING EMBEDDINGS)
-- ==========================================
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ==========================================
-- TRIGGER: UPDATED_AT TIMESTAMP
-- ==========================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_chat_sessions_modtime
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_cvs_modtime
    BEFORE UPDATE ON public.cvs
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ==========================================
-- FUNCTION: SECURE DATA RETRIEVAL
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_user_chat_sessions()
RETURNS SETOF public.chat_sessions
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT * FROM public.chat_sessions 
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC;
$$;

-- Permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON 
    public.chat_sessions, 
    public.messages, 
    public.cvs 
TO authenticated;

-- Sequence Grants (if needed)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;