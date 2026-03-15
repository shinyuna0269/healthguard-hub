-- Citizen Dashboard: unified service requests and complaints
-- 1. environmental_compliance_requests: add description, preferred_schedule, supporting_documents_url, location
-- 2. sanitation_complaints: add location for unified complaints form
-- 3. profiles: optional citizen ID fields (date_of_birth, blood_type, gender, address, contact_number)

-- Environmental compliance: support unified service request form
ALTER TABLE public.environmental_compliance_requests
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS preferred_schedule date,
  ADD COLUMN IF NOT EXISTS supporting_documents_url text;

-- Sanitation complaints: add location for unified complaint form
ALTER TABLE public.sanitation_complaints
  ADD COLUMN IF NOT EXISTS location text;

-- Profiles: optional fields for Citizen ID card display
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS contact_number text;
