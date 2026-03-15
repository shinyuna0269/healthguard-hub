-- HealthGuard Hub – Sanitary Permit & Inspection full workflow (Quezon City LGU process)
-- Sequence: Establishment Verification → Sanitary Permit Application → Payment → Inspection → Approval → Permit Issuance
--
-- Apply this migration to create table public.sanitary_permit_applications (and related tables).
-- If you see "Could not find the table 'public.sanitary_permit_applications'" run: npx supabase db push
-- or execute this migration in the Supabase Dashboard SQL Editor.

-- 1) Notifications for staff when citizen submits establishment (Sanitation Inspector + Health Center Staff)
CREATE TABLE IF NOT EXISTS public.establishment_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  notified_at timestamptz NOT NULL DEFAULT now(),
  read_by_clerk boolean NOT NULL DEFAULT false,
  read_by_bsi boolean NOT NULL DEFAULT false
);
ALTER TABLE public.establishment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read establishment_notifications" ON public.establishment_notifications
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'BSI_User') OR public.has_role(auth.uid(), 'Captain_User'));

CREATE POLICY "Staff update establishment_notifications" ON public.establishment_notifications
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'BSI_User') OR public.has_role(auth.uid(), 'Captain_User'));

CREATE POLICY "Insert establishment_notifications" ON public.establishment_notifications
FOR INSERT TO authenticated WITH CHECK (true);

-- 2) Sanitary permit applications (full workflow linked to establishment)
CREATE TABLE IF NOT EXISTS public.sanitary_permit_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Snapshot from establishment (auto-filled)
  establishment_name text NOT NULL,
  business_type text,
  address text,
  barangay text,
  owner_name text NOT NULL,
  contact_number text,
  -- Documents (URLs from storage)
  health_certificates_url text,
  water_analysis_url text,
  pest_control_url text,
  business_permit_url text,
  valid_id_url text,
  -- Workflow
  status text NOT NULL DEFAULT 'application_submitted',
  order_of_payment_number text,
  payment_id uuid REFERENCES public.payments(id),
  is_provisional boolean NOT NULL DEFAULT false,
  -- Inspection
  assigned_inspector_id uuid REFERENCES auth.users(id),
  inspection_scheduled_date date,
  inspection_notes text,
  -- Result
  permit_number text,
  permit_issued_at timestamptz,
  permit_expiry_date date,
  -- Correction / reinspection
  correction_notes text,
  reinspection_proof_url text,
  reinspection_requested_at timestamptz,
  applied_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sanitary_permit_applications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sanitary_apps_establishment ON public.sanitary_permit_applications(establishment_id);
CREATE INDEX idx_sanitary_apps_user ON public.sanitary_permit_applications(user_id);
CREATE INDEX idx_sanitary_apps_status ON public.sanitary_permit_applications(status);

CREATE POLICY "Citizen read own sanitary applications" ON public.sanitary_permit_applications
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Citizen insert own sanitary applications" ON public.sanitary_permit_applications
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Citizen update own for correction/reinspection" ON public.sanitary_permit_applications
FOR UPDATE TO authenticated
USING (auth.uid() = user_id AND status IN ('correction_required', 'reinspection_requested'));

CREATE POLICY "Staff read all sanitary applications" ON public.sanitary_permit_applications
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'BSI_User') OR public.has_role(auth.uid(), 'Captain_User'));

CREATE POLICY "Staff update sanitary applications" ON public.sanitary_permit_applications
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'BSI_User') OR public.has_role(auth.uid(), 'Captain_User'));

-- 3) Inspections linked to sanitary permit application (schedule + report)
CREATE TABLE IF NOT EXISTS public.sanitary_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.sanitary_permit_applications(id) ON DELETE CASCADE,
  inspector_id uuid REFERENCES auth.users(id),
  scheduled_date date,
  status text NOT NULL DEFAULT 'scheduled',
  result text,
  checklist jsonb DEFAULT '{}',
  findings text,
  correction_required_notes text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.sanitary_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inspector and staff read sanitary_inspections" ON public.sanitary_inspections
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'BSI_User') OR public.has_role(auth.uid(), 'Captain_User')
  OR EXISTS (SELECT 1 FROM public.sanitary_permit_applications a WHERE a.id = application_id AND a.user_id = auth.uid())
);

CREATE POLICY "Inspector insert/update sanitary_inspections" ON public.sanitary_inspections
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'BSI_User') OR public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'Captain_User'));

-- 4) Payments: allow link to sanitary application and Clerk/Captain to update (confirm payment)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sanitary_application_id uuid REFERENCES public.sanitary_permit_applications(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Payments read" ON public.payments;
CREATE POLICY "Payments read" ON public.payments
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'Captain_User'));

CREATE POLICY "Payments update" ON public.payments
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'Clerk_User') OR public.has_role(auth.uid(), 'Captain_User'));

-- 5) Establishments: Captain (City Health Officer) can also update for verification
DROP POLICY IF EXISTS "Establishments update" ON public.establishments;
CREATE POLICY "Establishments update" ON public.establishments
FOR UPDATE TO authenticated
USING (
  (auth.uid() = user_id AND status IN ('pending_verification', 'requires_correction'))
  OR public.has_role(auth.uid(), 'Clerk_User')
  OR public.has_role(auth.uid(), 'BSI_User')
  OR public.has_role(auth.uid(), 'Captain_User')
);

-- 6) Triggers for updated_at
CREATE TRIGGER update_sanitary_permit_applications_updated_at
  BEFORE UPDATE ON public.sanitary_permit_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sanitary_inspections_updated_at
  BEFORE UPDATE ON public.sanitary_inspections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
