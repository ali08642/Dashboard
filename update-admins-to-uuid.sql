-- Update admins table to use UUID instead of integer for id column
-- This script should be run in your Supabase SQL Editor

-- Step 1: Check current table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admins' 
ORDER BY ordinal_position;

-- Step 2: Drop foreign key constraints that reference admins.id
ALTER TABLE scrape_jobs DROP CONSTRAINT IF EXISTS scrape_jobs_assigned_to_fkey;
ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_assigned_marketer_fkey;

-- Step 3: Backup existing data (optional)
-- CREATE TABLE admins_backup AS SELECT * FROM admins;

-- Step 4: Clear the table (WARNING: This will delete all existing admin records)
TRUNCATE TABLE admins;

-- Step 5: Drop the existing sequence
DROP SEQUENCE IF EXISTS admins_id_seq CASCADE;

-- Step 6: Change the id column to UUID
ALTER TABLE admins ALTER COLUMN id TYPE uuid USING gen_random_uuid();
ALTER TABLE admins ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Step 7: Update foreign key columns to UUID as well
ALTER TABLE scrape_jobs ALTER COLUMN assigned_to TYPE uuid USING NULL;
ALTER TABLE businesses ALTER COLUMN assigned_marketer TYPE uuid USING NULL;

-- Step 8: Re-add foreign key constraints
ALTER TABLE scrape_jobs 
ADD CONSTRAINT scrape_jobs_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES admins(id);

ALTER TABLE businesses 
ADD CONSTRAINT businesses_assigned_marketer_fkey 
FOREIGN KEY (assigned_marketer) REFERENCES admins(id);

-- Step 9: Enable RLS and create policies for signup/login
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert (for signup)
CREATE POLICY "Allow signup" ON admins
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Policy to allow users to read their own record
CREATE POLICY "Users can view own profile" ON admins
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

-- Policy to allow reading all admins for authenticated users (if needed for app functionality)
CREATE POLICY "Allow authenticated users to view admins" ON admins
  FOR SELECT 
  TO authenticated
  USING (true);

-- Step 10: Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'admins' 
ORDER BY ordinal_position;
