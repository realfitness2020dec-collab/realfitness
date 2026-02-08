
-- Table to store chat messages per member (persists conversation history)
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups by member
CREATE INDEX idx_chat_messages_member_id ON public.chat_messages(member_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(member_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can insert/select (member login is session-based, not auth-based)
CREATE POLICY "Allow all access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true);

-- Table to store fitness intake questionnaire answers per member
CREATE TABLE public.member_fitness_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID NOT NULL UNIQUE REFERENCES public.members(id) ON DELETE CASCADE,
  fitness_goal TEXT, -- weight_loss, weight_gain, maintenance
  alcohol_consumption BOOLEAN DEFAULT false,
  diet_type TEXT, -- veg, non_veg
  physical_issues TEXT, -- free text for any injuries/pain
  activity_level TEXT, -- active, moderate, lazy
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_fitness_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can access (session-based auth)
CREATE POLICY "Allow all access to member_fitness_profiles" ON public.member_fitness_profiles FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_member_fitness_profiles_updated_at
BEFORE UPDATE ON public.member_fitness_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
