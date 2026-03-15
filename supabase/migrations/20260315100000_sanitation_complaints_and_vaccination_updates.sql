-- =============================================================================
-- 1. UNIFIED SANITATION COMPLAINTS (replaces resident_complaints + wastewater_complaints)
--    Accessible to Citizen, BHW, Sanitary Inspector
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.sanitation_complaints (
  complaint_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  citizen_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  complaint_type text NOT NULL,
  barangay text NOT NULL,
  description text,
  photo_attachment text,
  status text NOT NULL DEFAULT 'pending',
  assigned_officer text,
  date_submitted date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sanitation_complaints ENABLE ROW LEVEL SECURITY;

-- Citizen: insert own, read own
CREATE POLICY "Citizen insert own sanitation_complaints"
  ON public.sanitation_complaints FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Citizen read own sanitation_complaints"
  ON public.sanitation_complaints FOR SELECT TO authenticated
  USING (auth.uid() = citizen_id);

-- BHW and Sanitary Inspector (BSI): read all, update status/assigned_officer
CREATE POLICY "BHW BSI read sanitation_complaints"
  ON public.sanitation_complaints FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'BHW_User')
    OR public.has_role(auth.uid(), 'BSI_User')
    OR public.has_role(auth.uid(), 'Clerk_User')
    OR public.has_role(auth.uid(), 'Captain_User')
    OR public.has_role(auth.uid(), 'SysAdmin_User')
  );

CREATE POLICY "BHW BSI insert sanitation_complaints"
  ON public.sanitation_complaints FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'BHW_User')
    OR public.has_role(auth.uid(), 'BSI_User')
  );

CREATE POLICY "BHW BSI update sanitation_complaints"
  ON public.sanitation_complaints FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'BHW_User')
    OR public.has_role(auth.uid(), 'BSI_User')
    OR public.has_role(auth.uid(), 'Clerk_User')
    OR public.has_role(auth.uid(), 'Captain_User')
  );

COMMENT ON TABLE public.sanitation_complaints IS 'Unified sanitation complaints; visible to Citizen (own), BHW, Sanitary Inspector.';

-- =============================================================================
-- 2. VACCINATIONS: add patient_name and patient_type (support adults, seniors, PWD)
-- =============================================================================
ALTER TABLE public.vaccinations
  ADD COLUMN IF NOT EXISTS patient_name text,
  ADD COLUMN IF NOT EXISTS patient_type text;

UPDATE public.vaccinations SET patient_name = child_name WHERE patient_name IS NULL AND child_name IS NOT NULL;

-- =============================================================================
-- 3. VACCINATION SCHEDULES (upcoming events by barangay for citizens)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.vaccination_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay text NOT NULL,
  vaccine text NOT NULL,
  health_center_location text,
  assigned_bhw text,
  schedule_date date NOT NULL,
  schedule_time time,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.vaccination_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth read vaccination_schedules"
  ON public.vaccination_schedules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff insert vaccination_schedules"
  ON public.vaccination_schedules FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'BHW_User')
    OR public.has_role(auth.uid(), 'Clerk_User')
    OR public.has_role(auth.uid(), 'Captain_User')
    OR public.has_role(auth.uid(), 'SysAdmin_User')
  );

-- Seed sample schedules for demo
INSERT INTO public.vaccination_schedules (barangay, vaccine, health_center_location, assigned_bhw, schedule_date, schedule_time)
VALUES
  ('Commonwealth', 'COVID-19 Booster', 'Commonwealth Health Center, Brgy. Commonwealth', 'Maria Santos, BHW', CURRENT_DATE + 7, '08:00'),
  ('Batasan Hills', 'Measles-Rubella', 'Batasan Hills Health Center', 'Juan Dela Cruz, BHW', CURRENT_DATE + 14, '09:00'),
  ('Fairview', 'Flu Vaccine', 'Fairview Barangay Health Office', 'Ana Reyes, BHW', CURRENT_DATE + 10, '08:30');
