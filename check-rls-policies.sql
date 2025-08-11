-- Check current RLS status and policies for admins table
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE tablename = 'admins';

-- Show existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as "Command",
    qual as "Using Expression",
    with_check as "With Check Expression"
FROM pg_policies 
WHERE tablename = 'admins';

-- If RLS is enabled but no INSERT policy exists, you might need:
-- 1. Disable RLS temporarily for testing:
-- ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 2. Or create an INSERT policy that allows anonymous users:
-- CREATE POLICY "Allow anonymous insert" ON public.admins
--   FOR INSERT 
--   TO anon 
--   WITH CHECK (true);

-- 3. Or create a policy for authenticated users:
-- CREATE POLICY "Allow authenticated insert" ON public.admins
--   FOR INSERT 
--   TO authenticated 
--   WITH CHECK (true);

-- Check if the anon role has INSERT permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_name = 'admins' 
AND grantee = 'anon';
