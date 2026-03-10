
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('Resident_User', 'BusinessOwner_User', 'BHW_User', 'BSI_User', 'Clerk_User', 'Captain_User', 'SysAdmin_User');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Patients table
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Consultations table
CREATE TABLE public.consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  age INTEGER,
  address TEXT,
  symptoms TEXT,
  diagnosis TEXT,
  medicine TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  recorded_by UUID REFERENCES auth.users(id),
  consultation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Vaccinations table
CREATE TABLE public.vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  age TEXT,
  vaccine TEXT NOT NULL,
  vaccination_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'scheduled',
  bhw_name TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;

-- Nutrition records
CREATE TABLE public.nutrition_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_name TEXT NOT NULL,
  age TEXT,
  weight TEXT,
  height TEXT,
  status TEXT NOT NULL DEFAULT 'Normal',
  purok TEXT,
  recorded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nutrition_records ENABLE ROW LEVEL SECURITY;

-- Sanitation permits
CREATE TABLE public.sanitation_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  business_type TEXT,
  address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  inspector TEXT,
  applied_by UUID REFERENCES auth.users(id),
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sanitation_permits ENABLE ROW LEVEL SECURITY;

-- Inspections
CREATE TABLE public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_id UUID REFERENCES public.sanitation_permits(id) ON DELETE CASCADE,
  establishment TEXT NOT NULL,
  checklist JSONB DEFAULT '{}',
  findings TEXT,
  inspector_id UUID REFERENCES auth.users(id),
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;

-- Wastewater complaints
CREATE TABLE public.wastewater_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complainant TEXT NOT NULL,
  complaint_type TEXT NOT NULL,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_to TEXT,
  filed_by UUID REFERENCES auth.users(id),
  complaint_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wastewater_complaints ENABLE ROW LEVEL SECURITY;

-- Surveillance cases
CREATE TABLE public.surveillance_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  disease TEXT NOT NULL,
  patient_location TEXT,
  case_count INTEGER NOT NULL DEFAULT 1,
  case_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  reporter TEXT,
  details TEXT,
  reported_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.surveillance_cases ENABLE ROW LEVEL SECURITY;

-- Resident complaints (for resident portal)
CREATE TABLE public.resident_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  complaint_type TEXT NOT NULL,
  location TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  complaint_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resident_complaints ENABLE ROW LEVEL SECURITY;

-- Resident permits (for resident portal)
CREATE TABLE public.resident_permits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resident_permits ENABLE ROW LEVEL SECURITY;

-- Resident health records (for resident portal)
CREATE TABLE public.resident_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  record_type TEXT NOT NULL,
  diagnosis TEXT,
  medicine TEXT,
  provider TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.resident_health_records ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- user_roles: users can read their own role
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- profiles: users can read all profiles, update own
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Staff tables: authenticated users can read and insert
CREATE POLICY "Auth read consultations" ON public.consultations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert consultations" ON public.consultations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read patients" ON public.patients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert patients" ON public.patients FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read vaccinations" ON public.vaccinations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert vaccinations" ON public.vaccinations FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read nutrition" ON public.nutrition_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert nutrition" ON public.nutrition_records FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read permits" ON public.sanitation_permits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert permits" ON public.sanitation_permits FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read inspections" ON public.inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert inspections" ON public.inspections FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read wastewater" ON public.wastewater_complaints FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert wastewater" ON public.wastewater_complaints FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Auth read surveillance" ON public.surveillance_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert surveillance" ON public.surveillance_cases FOR INSERT TO authenticated WITH CHECK (true);

-- Resident tables: users can only see their own data
CREATE POLICY "Own complaints read" ON public.resident_complaints FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own complaints insert" ON public.resident_complaints FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own permits read" ON public.resident_permits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own permits insert" ON public.resident_permits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Own health read" ON public.resident_health_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own health insert" ON public.resident_health_records FOR INSERT WITH CHECK (auth.uid() = user_id);
