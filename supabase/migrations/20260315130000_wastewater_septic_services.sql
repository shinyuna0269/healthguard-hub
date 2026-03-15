-- Wastewater & Septic Services module (Quezon City)
-- Tables for: septic desludging, wastewater complaints, waterway cleanup, environmental compliance, desludging schedule

-- Septic tank desludging requests
CREATE TABLE IF NOT EXISTS public.septic_desludging_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_address text NOT NULL,
  barangay text NOT NULL,
  preferred_date date,
  property_details_url text,
  status text NOT NULL DEFAULT 'pending',
  reference_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.septic_desludging_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own septic requests" ON public.septic_desludging_requests FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Citizen wastewater complaints (location, description, photo, barangay)
CREATE TABLE IF NOT EXISTS public.citizen_wastewater_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  complaint_type text NOT NULL,
  location text NOT NULL,
  description text,
  photo_url text,
  barangay text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.citizen_wastewater_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own wastewater complaints" ON public.citizen_wastewater_complaints FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Staff read wastewater complaints" ON public.citizen_wastewater_complaints FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'BSI_User') OR public.has_role(auth.uid(), 'Captain_User'));

-- Waterway cleanup reports
CREATE TABLE IF NOT EXISTS public.waterway_cleanup_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  location text NOT NULL,
  description text,
  photo_url text,
  barangay text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.waterway_cleanup_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own waterway reports" ON public.waterway_cleanup_reports FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Environmental compliance requests (businesses)
CREATE TABLE IF NOT EXISTS public.environmental_compliance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  request_type text NOT NULL,
  address text,
  barangay text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.environmental_compliance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own env compliance requests" ON public.environmental_compliance_requests FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Desludging schedule (by barangay) - staff/LGU can insert/update; citizens read
CREATE TABLE IF NOT EXISTS public.desludging_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barangay text NOT NULL,
  schedule_date date NOT NULL,
  schedule_time text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.desludging_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read desludging schedules" ON public.desludging_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff manage desludging schedules" ON public.desludging_schedules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'BSI_User') OR public.has_role(auth.uid(), 'Captain_User'));

CREATE TRIGGER update_septic_desludging_requests_updated_at
  BEFORE UPDATE ON public.septic_desludging_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_citizen_wastewater_complaints_updated_at
  BEFORE UPDATE ON public.citizen_wastewater_complaints FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_waterway_cleanup_reports_updated_at
  BEFORE UPDATE ON public.waterway_cleanup_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_environmental_compliance_requests_updated_at
  BEFORE UPDATE ON public.environmental_compliance_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_desludging_schedules_updated_at
  BEFORE UPDATE ON public.desludging_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
