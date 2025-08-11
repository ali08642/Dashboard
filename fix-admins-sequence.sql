-- Check the current sequence for admins table
SELECT 
    schemaname,
    sequencename,
    last_value,
    start_value,
    increment_by,
    is_called
FROM pg_sequences 
WHERE sequencename LIKE '%admins%';

-- Check the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'admins' 
ORDER BY ordinal_position;

-- If the sequence exists but isn't linked properly, fix it:
-- ALTER TABLE public.admins ALTER COLUMN id SET DEFAULT nextval('admins_id_seq'::regclass);

-- If the sequence doesn't exist, create it:
-- CREATE SEQUENCE IF NOT EXISTS public.admins_id_seq OWNED BY public.admins.id;
-- ALTER TABLE public.admins ALTER COLUMN id SET DEFAULT nextval('admins_id_seq'::regclass);

-- Reset sequence to start after existing records:
-- SELECT setval('admins_id_seq', COALESCE((SELECT MAX(id) FROM admins), 0) + 1, false);

-- Test the sequence:
-- SELECT nextval('admins_id_seq');
-- SELECT currval('admins_id_seq');
