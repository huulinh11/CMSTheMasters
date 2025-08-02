-- Create a table for user profiles
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  department TEXT,
  role TEXT NOT NULL,
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to view their own profile
CREATE POLICY "Allow users to view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Policy: Allow admins/managers to view all profiles
CREATE POLICY "Allow admins and managers to view all profiles" ON public.profiles
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Quản lý')
  );

-- Policy: Allow users to update their own profile
CREATE POLICY "Allow users to update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Policy: Allow admins/managers to manage all profiles
CREATE POLICY "Allow admins and managers to manage all profiles" ON public.profiles
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('Admin', 'Quản lý')
  );