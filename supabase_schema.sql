-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'supervisor')) DEFAULT 'supervisor',
  avatar_url TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create zones table
CREATE TABLE zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shift_reports table
CREATE TABLE shift_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  shift_type TEXT CHECK (shift_type IN ('Turno 1 (Mañana)', 'Turno 2 (Tarde)', 'Turno 3 (Noche)')),
  observations TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shift_details table
CREATE TABLE shift_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES shift_reports(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES zones(id),
  incoming_supervisor_id UUID REFERENCES profiles(id),
  outgoing_supervisor_id UUID REFERENCES profiles(id),
  entry_hours INTEGER DEFAULT 8,
  extra_hours INTEGER DEFAULT 0,
  empty_posts INTEGER DEFAULT 0,
  justification TEXT,
  status TEXT CHECK (status IN ('Completo', 'Pendiente', 'Faltante')) DEFAULT 'Completo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_details ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Policies for zones (viewable by all authenticated users)
CREATE POLICY "Zones viewable by authenticated" ON zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Zones editable by admin" ON zones FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Policies for shifts
CREATE POLICY "Shifts viewable by authenticated" ON shift_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Shifts insertable by authenticated" ON shift_reports FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Shift details viewable by authenticated" ON shift_details FOR SELECT TO authenticated USING (true);
CREATE POLICY "Shift details insertable by authenticated" ON shift_details FOR INSERT TO authenticated WITH CHECK (true);
