-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admins (
  id integer NOT NULL DEFAULT nextval('admins_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  status character varying DEFAULT 'active'::character varying,
  supported_keywords ARRAY DEFAULT '{}'::text[],
  max_concurrent_jobs integer DEFAULT 3,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT admins_pkey PRIMARY KEY (id)
);
CREATE TABLE public.areas (
  id integer NOT NULL DEFAULT nextval('areas_id_seq'::regclass),
  city_id integer,
  name character varying NOT NULL,
  last_scraped_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT areas_pkey PRIMARY KEY (id),
  CONSTRAINT areas_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id)
);
CREATE TABLE public.business_interactions (
  id integer NOT NULL DEFAULT nextval('business_interactions_id_seq'::regclass),
  business_id integer,
  user_id integer,
  action character varying NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  timestamp timestamp without time zone DEFAULT now(),
  CONSTRAINT business_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT business_interactions_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.businesses(id)
);
CREATE TABLE public.businesses (
  id integer NOT NULL DEFAULT nextval('businesses_id_seq'::regclass),
  area_id integer,
  scrape_job_id integer,
  name character varying NOT NULL,
  address text,
  phone character varying,
  website character varying,
  category character varying,
  rating numeric CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  review_count integer CHECK (review_count >= 0),
  latitude numeric,
  longitude numeric,
  raw_info jsonb DEFAULT '{}'::jsonb,
  status character varying DEFAULT 'new'::character varying CHECK (status::text = ANY (ARRAY['new'::character varying, 'contacted'::character varying, 'interested'::character varying, 'qualified'::character varying, 'closed'::character varying, 'rejected'::character varying]::text[])),
  contact_status character varying DEFAULT 'not_contacted'::character varying,
  last_contacted_at timestamp without time zone,
  next_followup_at timestamp without time zone,
  notes text,
  assigned_marketer integer,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT businesses_pkey PRIMARY KEY (id),
  CONSTRAINT businesses_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id),
  CONSTRAINT businesses_scrape_job_id_fkey FOREIGN KEY (scrape_job_id) REFERENCES public.scrape_jobs(id)
);
CREATE TABLE public.cities (
  id integer NOT NULL DEFAULT nextval('cities_id_seq'::regclass),
  country_id integer,
  name character varying NOT NULL,
  code character varying,
  created_at timestamp without time zone DEFAULT now(),
  areas_populated boolean DEFAULT false,
  areas_populated_at timestamp without time zone,
  areas_count integer DEFAULT 0,
  CONSTRAINT cities_pkey PRIMARY KEY (id),
  CONSTRAINT cities_country_id_fkey FOREIGN KEY (country_id) REFERENCES public.countries(id)
);
CREATE TABLE public.countries (
  id integer NOT NULL DEFAULT nextval('countries_id_seq'::regclass),
  name character varying NOT NULL,
  iso_code character varying NOT NULL UNIQUE,
  created_at timestamp without time zone DEFAULT now(),
  cities_populated boolean DEFAULT false,
  cities_populated_at timestamp without time zone,
  cities_count integer DEFAULT 0,
  CONSTRAINT countries_pkey PRIMARY KEY (id)
);
CREATE TABLE public.scrape_jobs (
  id integer NOT NULL DEFAULT nextval('scrape_jobs_id_seq'::regclass),
  area_id integer,
  keyword character varying NOT NULL,
  assigned_to integer,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'running'::character varying, 'completed'::character varying, 'failed'::character varying]::text[])),
  logs jsonb DEFAULT '{}'::jsonb,
  error_message text,
  businesses_found integer DEFAULT 0,
  processing_time_seconds integer,
  created_at timestamp without time zone DEFAULT now(),
  started_at timestamp without time zone,
  completed_at timestamp without time zone,
  CONSTRAINT scrape_jobs_pkey PRIMARY KEY (id),
  CONSTRAINT scrape_jobs_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.admins(id),
  CONSTRAINT scrape_jobs_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id)
);