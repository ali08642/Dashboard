-- Migration to update admin table to use UUID for ID field
-- This is required for the signup functionality to work with Supabase Auth

-- Step 1: Create a new temporary table with UUID id
CREATE TABLE public.admins_new (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  status character varying DEFAULT 'active'::character varying,
  supported_keywords text[] DEFAULT '{}'::text[],
  max_concurrent_jobs integer DEFAULT 3,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT admins_new_pkey PRIMARY KEY (id)
);

-- Step 2: If you have existing admin data, you'll need to handle it manually
-- For now, we'll assume you want a fresh start with the new signup system

-- Step 3: Drop the old table (BE CAREFUL - this will delete existing admin data)
-- Uncomment the next line only if you're sure you want to delete existing admin data
-- DROP TABLE public.admins;

-- Step 4: Rename the new table to replace the old one
-- Uncomment the next line after dropping the old table
-- ALTER TABLE public.admins_new RENAME TO admins;

-- Alternative approach: If you want to preserve existing admin data
-- You would need to:
-- 1. Create auth users for existing admins
-- 2. Update their IDs to match the auth UUIDs
-- 3. This is complex and should be done carefully

-- For now, let's create the new table structure and keep the old one
-- You can manually switch when ready

-- Enable RLS (Row Level Security) if needed
-- ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own admin record
-- CREATE POLICY "Users can read own admin record" ON public.admins
--   FOR SELECT USING (auth.uid() = id);

-- Create policy to allow signup process to create admin records
-- CREATE POLICY "Allow signup to create admin records" ON public.admins
--   FOR INSERT WITH CHECK (true);
