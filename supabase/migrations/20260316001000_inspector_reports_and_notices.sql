-- Inspector modules: inspection_reports and correction_notices

-- 1) Inspection reports (one per inspection, inspector-created)
CREATE TABLE IF NOT EXISTS public.inspection_reports (
  report_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid NOT NULL,
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE SET NULL,
  establishment_name text,
  barangay text,
  inspection_date date,
  violations_found text,
  compliance_status text NOT NULL DEFAULT 'pending',
  inspector_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  inspector_name text,
  report_details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inspection_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "BSI read inspection_reports" ON public.inspection_reports;
CREATE POLICY "BSI read inspection_reports"
ON public.inspection_reports
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'BSI_User')
  OR public.has_role(auth.uid(), 'Clerk_User')
  OR public.has_role(auth.uid(), 'Captain_User')
  OR public.has_role(auth.uid(), 'LGUAdmin_User')
  OR public.has_role(auth.uid(), 'SysAdmin_User')
);

DROP POLICY IF EXISTS "BSI write inspection_reports" ON public.inspection_reports;
CREATE POLICY "BSI write inspection_reports"
ON public.inspection_reports
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'BSI_User'))
WITH CHECK (public.has_role(auth.uid(), 'BSI_User'));

-- Keep updated_at in sync (if function exists in this project)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_inspection_reports_updated_at') THEN
      CREATE TRIGGER update_inspection_reports_updated_at
      BEFORE UPDATE ON public.inspection_reports
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END $$;

-- 2) Correction notices (issued to establishments, track compliance)
CREATE TABLE IF NOT EXISTS public.correction_notices (
  notice_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid REFERENCES public.establishments(id) ON DELETE SET NULL,
  establishment_name text,
  barangay text,
  violation_type text NOT NULL,
  notice_date date NOT NULL DEFAULT CURRENT_DATE,
  compliance_deadline date,
  compliance_status text NOT NULL DEFAULT 'pending',
  notes text,
  issued_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.correction_notices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff read correction_notices" ON public.correction_notices;
CREATE POLICY "Staff read correction_notices"
ON public.correction_notices
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'BSI_User')
  OR public.has_role(auth.uid(), 'Clerk_User')
  OR public.has_role(auth.uid(), 'Captain_User')
  OR public.has_role(auth.uid(), 'LGUAdmin_User')
  OR public.has_role(auth.uid(), 'SysAdmin_User')
);

DROP POLICY IF EXISTS "BSI write correction_notices" ON public.correction_notices;
CREATE POLICY "BSI write correction_notices"
ON public.correction_notices
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'BSI_User'))
WITH CHECK (public.has_role(auth.uid(), 'BSI_User'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_correction_notices_updated_at') THEN
      CREATE TRIGGER update_correction_notices_updated_at
      BEFORE UPDATE ON public.correction_notices
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
  END IF;
END $$;

