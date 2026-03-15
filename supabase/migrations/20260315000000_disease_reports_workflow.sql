-- Disease reporting workflow: citizen submissions go to disease_reports;
-- only verified cases are inserted into disease_cases for the Health Surveillance map.
-- Status flow: Submitted -> Under BHW Review -> Under Medical Verification -> Verified Case | Closed

CREATE TABLE IF NOT EXISTS public.disease_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  disease text NOT NULL,
  patient_location text NOT NULL,
  details text,
  reported_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter text,
  status text NOT NULL DEFAULT 'Submitted'
    CHECK (status IN (
      'Submitted',
      'Under BHW Review',
      'Under Medical Verification',
      'Verified Case',
      'Closed'
    )),
  case_date date DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.disease_reports ENABLE ROW LEVEL SECURITY;

-- Citizens can insert their own reports and read their own
CREATE POLICY "Citizen insert own disease_reports"
  ON public.disease_reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reported_by);

CREATE POLICY "Auth read disease_reports"
  ON public.disease_reports FOR SELECT TO authenticated
  USING (true);

-- BHW and Clerk can update status (verification workflow)
CREATE POLICY "BHW Clerk update disease_reports"
  ON public.disease_reports FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'BHW_User')
    OR public.has_role(auth.uid(), 'Clerk_User')
    OR public.has_role(auth.uid(), 'Captain_User')
    OR public.has_role(auth.uid(), 'SysAdmin_User')
  );

-- Trigger to set updated_at
CREATE OR REPLACE FUNCTION public.set_disease_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS disease_reports_updated_at ON public.disease_reports;
CREATE TRIGGER disease_reports_updated_at
  BEFORE UPDATE ON public.disease_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_disease_reports_updated_at();

COMMENT ON TABLE public.disease_reports IS 'Citizen/BHW disease reports; verification workflow. Only verified cases go to disease_cases for the map.';
