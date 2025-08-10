-- Simple approach: Update the existing admin table to use UUID
-- Run this in your Supabase SQL editor

-- Step 1: Drop existing constraints and sequences
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_pkey;
DROP SEQUENCE IF EXISTS public.admins_id_seq CASCADE;

-- Step 2: Change the id column to UUID type
ALTER TABLE public.admins ALTER COLUMN id TYPE uuid USING gen_random_uuid();

-- Step 3: Add back the primary key constraint
ALTER TABLE public.admins ADD CONSTRAINT admins_pkey PRIMARY KEY (id);

-- Step 4: Clear any existing data (since old integer IDs won't work with auth)
-- Comment out the next line if you want to preserve existing data
TRUNCATE TABLE public.admins;

-- Step 5: Enable RLS for security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Step 6: Create policies for the admin table
-- Allow users to read their own admin record (even if email not verified)
CREATE POLICY "Users can read own admin record" ON public.admins
  FOR SELECT USING (auth.uid() = id);

-- Allow authenticated users to read all admin records (for admin management)
CREATE POLICY "Authenticated users can read admin records" ON public.admins
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow the signup process to create new admin records (even for unverified emails)
CREATE POLICY "Allow signup to create admin records" ON public.admins
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow admins to update their own records
CREATE POLICY "Users can update own admin record" ON public.admins
  FOR UPDATE USING (auth.uid() = id);

-- Additional: Disable email confirmation requirement (for demo purposes)
-- You may need to run this in your Supabase dashboard under Authentication > Settings
-- Set "Enable email confirmations" to OFF for demo purposes
-- Or set "Confirm email" to OFF in the Auth settings

-- Note: After running this, existing admin accounts will be deleted
-- You'll need to create new accounts using the signup feature
