-- Fix Foreign Key References After Admin UUID Migration
-- Run this after you've already changed admins.id to UUID

-- Step 1: Drop foreign key constraints that reference admins.id
ALTER TABLE public.scrape_jobs DROP CONSTRAINT IF EXISTS scrape_jobs_assigned_to_fkey;
ALTER TABLE public.businesses DROP CONSTRAINT IF EXISTS businesses_assigned_marketer_fkey;

-- Step 2: Change assigned_to in scrape_jobs from integer to UUID
ALTER TABLE public.scrape_jobs ALTER COLUMN assigned_to TYPE uuid USING NULL;

-- Step 3: Change assigned_marketer in businesses from integer to UUID  
ALTER TABLE public.businesses ALTER COLUMN assigned_marketer TYPE uuid USING NULL;

-- Step 4: Clear existing assignments (since old integer IDs won't work)
UPDATE public.scrape_jobs SET assigned_to = NULL;
UPDATE public.businesses SET assigned_marketer = NULL;

-- Step 5: Re-add the foreign key constraints with UUID
ALTER TABLE public.scrape_jobs 
  ADD CONSTRAINT scrape_jobs_assigned_to_fkey 
  FOREIGN KEY (assigned_to) REFERENCES public.admins(id);

ALTER TABLE public.businesses 
  ADD CONSTRAINT businesses_assigned_marketer_fkey 
  FOREIGN KEY (assigned_marketer) REFERENCES public.admins(id);

-- Step 6: Update the TypeScript interfaces to reflect UUID changes
-- Note: You'll need to update the types in src/utils/types.ts:
-- 
-- interface ScrapeJob {
--   assigned_to?: string;  // Changed from number to string (UUID)
-- }
--
-- interface Business {
--   assigned_marketer?: string;  // Changed from number to string (UUID)  
-- }
--
-- interface Admin {
--   id: string;  // Changed from number to string (UUID)
-- }
