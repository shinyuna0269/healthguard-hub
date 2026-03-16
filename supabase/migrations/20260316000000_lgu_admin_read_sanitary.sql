-- Allow LGU Admin to read sanitary permit applications and inspections for municipal overview
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sanitary_permit_applications' AND policyname = 'LGU Admin read sanitary applications'
  ) THEN
    CREATE POLICY "LGU Admin read sanitary applications" ON public.sanitary_permit_applications
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'LGUAdmin_User'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'sanitary_inspections' AND policyname = 'LGU Admin read sanitary inspections'
  ) THEN
    CREATE POLICY "LGU Admin read sanitary inspections" ON public.sanitary_inspections
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'LGUAdmin_User'));
  END IF;
END $$;
