export interface Country {
  id: number;
  name: string;
  iso_code: string;
  cities_count?: number;
  cities_populated?: boolean;
  created_at: string;
}

export interface City {
  id: number;
  name: string;
  country_id: number;
  areas_count?: number;
  areas_populated?: boolean;
  created_at: string;
  countries?: {
    name: string;
  };
}

export interface Area {
  id: number;
  name: string;
  city_id: number;
  last_scraped_at?: string;
  created_at: string;
  cities?: {
    name: string;
    countries?: {
      name: string;
    };
  };
}

export interface AppState {
  currentStep: number;
  selectedCountry: Country | null;
  cities: City[];
  selectedCityId: number | null;
  selectedCityName: string;
  areas: Area[];
  workflowStartTime: number | null;
  allCountries: Country[];
  allCities: City[];
  allAreas: Area[];
}

export interface NotificationData {
  type: 'processing' | 'success';
  title: string;
  subtitle: string;
  message: string;
  visible: boolean;
}

export interface ScrapeJob {
  id: number;
  area_id: number;
  keyword: string;
  assigned_to?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  logs?: any;
  error_message?: string;
  businesses_found?: number;
  processing_time_seconds?: number;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  areas?: {
    name: string;
    cities?: {
      name: string;
      countries?: {
        name: string;
      };
    };
  };
}

export interface Business {
  id: number;
  area_id: number;
  scrape_job_id?: number;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  category?: string;
  rating?: number;
  review_count?: number;
  latitude?: number;
  longitude?: number;
  raw_info?: any;
  status: 'new' | 'contacted' | 'interested' | 'qualified' | 'closed' | 'rejected';
  contact_status: string;
  last_contacted_at?: string;
  next_followup_at?: string;
  notes?: string;
  assigned_marketer?: number;
  created_at: string;
  updated_at: string;
  areas?: {
    name: string;
    cities?: {
      name: string;
      countries?: {
        name: string;
      };
    };
  };
  scrape_jobs?: {
    keyword: string;
  };
}

export interface BusinessInteraction {
  id: number;
  business_id: number;
  user_id?: number;
  action: string;
  details?: any;
  timestamp: string;
}

export interface Configuration {
  supabaseUrl: string;
  supabaseKey: string;
  citiesWebhook: string;
  areasWebhook: string;
}