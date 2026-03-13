
-- Add password and date_of_birth to members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS password text DEFAULT NULL;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS date_of_birth date DEFAULT NULL;

-- Create member_workouts table for admin-assigned workouts
CREATE TABLE public.member_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  workout_date date NOT NULL DEFAULT CURRENT_DATE,
  workout_plan text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_workouts ENABLE ROW LEVEL SECURITY;

-- Admin can manage all workouts
CREATE POLICY "Admins can manage all workouts"
  ON public.member_workouts FOR ALL
  TO public
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Public read for edge function access (service role bypasses RLS anyway)
CREATE POLICY "Anyone can view workouts"
  ON public.member_workouts FOR SELECT
  TO public
  USING (true);
