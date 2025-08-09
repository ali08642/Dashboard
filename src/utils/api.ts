import { getConfig } from './config';
import type { Country, City, Area, ScrapeJob, Business, BusinessInteraction } from './types';

interface Admin {
  id: number;
  email: string;
  name: string;
  status: string;
  supported_keywords: string[];
  max_concurrent_jobs: number;
}

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiCall<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const config = getConfig();
  
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new ApiError('Database configuration missing. Please configure Supabase credentials.');
  }

  const url = `${config.supabaseUrl}/rest/v1/${endpoint}`;
  const defaultHeaders = {
    'apikey': config.supabaseKey,
    'Authorization': `Bearer ${config.supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const response = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers }
  });

  if (!response.ok) {
    throw new ApiError(`API call failed: ${response.status} ${response.statusText}`, response.status);
  }

  return response.json();
}

// Country API functions
export const countryApi = {
  getAll: (): Promise<Country[]> => 
    apiCall('countries?select=*&order=name.asc'),
  
  create: (data: Omit<Country, 'id' | 'created_at'>): Promise<Country> =>
    apiCall('countries', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  update: (id: number, data: Partial<Country>): Promise<Country> =>
    apiCall(`countries?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  delete: (id: number): Promise<void> =>
    apiCall(`countries?id=eq.${id}`, { method: 'DELETE' })
};

// City API functions
export const cityApi = {
  getAll: (): Promise<City[]> =>
    apiCall('cities?select=*,countries(name)&order=name.asc'),
  
  create: (data: Omit<City, 'id' | 'created_at'>): Promise<City> =>
    apiCall('cities', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  update: (id: number, data: Partial<City>): Promise<City> =>
    apiCall(`cities?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  delete: (id: number): Promise<void> =>
    apiCall(`cities?id=eq.${id}`, { method: 'DELETE' })
};

// Area API functions
export const areaApi = {
  getAll: (): Promise<Area[]> =>
    apiCall('areas?select=*,cities(name,countries(name))&order=name.asc'),
  
  create: (data: Omit<Area, 'id' | 'created_at'>): Promise<Area> =>
    apiCall('areas', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  
  update: (id: number, data: Partial<Area>): Promise<Area> =>
    apiCall(`areas?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  delete: (id: number): Promise<void> =>
    apiCall(`areas?id=eq.${id}`, { method: 'DELETE' })
};

// Webhook functions
export const webhookApi = {
  initializeCities: async (countryId: number, forceRefresh: boolean, keywords: string[]): Promise<City[]> => {
    const config = getConfig();
    const response = await fetch(config.citiesWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country_id: countryId,
        action: 'populate_cities',
        force_refresh: forceRefresh,
        target_keywords: keywords
      })
    });

    if (!response.ok) {
      throw new ApiError(`Cities webhook failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  },

  initializeAreas: async (cityId: number): Promise<Area[]> => {
    const config = getConfig();
    const response = await fetch(config.areasWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city_id: cityId,
        action: 'populate_areas'
      })
    });

    if (!response.ok) {
      throw new ApiError(`Areas webhook failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
};

// Scrape Job API functions
export const scrapeJobApi = {
  getAll: (): Promise<ScrapeJob[]> =>
    apiCall('scrape_jobs?select=*,areas(name,cities(name,countries(name)))&order=created_at.desc'),
  
  getCitiesByCountry: (countryId: number): Promise<City[]> =>
    apiCall(`cities?country_id=eq.${countryId}&select=*&order=name.asc`),
  
  getAreasByCity: (cityId: number): Promise<Area[]> =>
    apiCall(`areas?city_id=eq.${cityId}&select=*&order=name.asc`),
  
  create: (data: {
    area_id: number;
    keyword: string;
  }): Promise<ScrapeJob> =>
    apiCall('scrape_jobs', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        status: 'pending'
      })
    }),
  
  update: (id: number, data: Partial<ScrapeJob>): Promise<ScrapeJob> =>
    apiCall(`scrape_jobs?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  delete: (id: number): Promise<void> =>
    apiCall(`scrape_jobs?id=eq.${id}`, { method: 'DELETE' })
};

// Business API functions
export const businessApi = {
  getAll: (filters?: {
    status?: string;
    category?: string;
    contact_status?: string;
    search?: string;
    area_id?: number;
    city_id?: number;
    country_id?: number;
    rating_min?: number;
    has_phone?: boolean;
    has_website?: boolean;
    assigned_marketer?: number;
    limit?: number;
    offset?: number;
  }): Promise<Business[]> => {
    // Optimized field selection - only fetch what we need for the list view
    let query = 'businesses?select=id,name,address,phone,website,category,rating,review_count,status,contact_status,last_contacted_at,next_followup_at,notes,assigned_marketer,created_at,updated_at,areas(name,cities(name,countries(name))),scrape_jobs(keyword)&order=created_at.desc';
    
    if (filters) {
      const conditions = [];
      if (filters.status) conditions.push(`status=eq.${filters.status}`);
      if (filters.category) conditions.push(`category=ilike.*${filters.category}*`);
      if (filters.contact_status) conditions.push(`contact_status=eq.${filters.contact_status}`);
      if (filters.search) conditions.push(`or=(name.ilike.*${filters.search}*,address.ilike.*${filters.search}*,category.ilike.*${filters.search}*)`);
      if (filters.area_id) conditions.push(`area_id=eq.${filters.area_id}`);
      if (filters.rating_min) conditions.push(`rating=gte.${filters.rating_min}`);
      if (filters.has_phone) conditions.push('phone=not.is.null');
      if (filters.has_website) conditions.push('website=not.is.null');
      if (filters.assigned_marketer) conditions.push(`assigned_marketer=eq.${filters.assigned_marketer}`);
      
      // Add pagination
      if (filters.limit) conditions.push(`limit=${filters.limit}`);
      if (filters.offset) conditions.push(`offset=${filters.offset}`);
      
      if (conditions.length > 0) {
        query += '&' + conditions.join('&');
      }
    }
    
    return apiCall(query);
  },

  getById: (id: number): Promise<Business> =>
    apiCall(`businesses?id=eq.${id}&select=*,areas(name,cities(name,countries(name))),scrape_jobs(keyword)`),

  getStats: (): Promise<{
    total: number;
    by_status: { [key: string]: number };
    by_contact_status: { [key: string]: number };
    recent_count: number;
  }> =>
    apiCall('rpc/get_business_stats'),

  create: (data: Omit<Business, 'id' | 'created_at' | 'updated_at'>): Promise<Business> =>
    apiCall('businesses', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }),

  update: (id: number, data: Partial<Business>): Promise<Business> =>
    apiCall(`businesses?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...data,
        updated_at: new Date().toISOString()
      })
    }),

  updateField: (id: number, field: string, value: string | number | null): Promise<Business> => {
    // Validate field against database schema
    const allowedFields = [
      'name', 'address', 'phone', 'website', 'category', 'rating', 'review_count',
      'latitude', 'longitude', 'status', 'contact_status', 'last_contacted_at', 
      'next_followup_at', 'notes', 'assigned_marketer'
    ];
    
    if (!allowedFields.includes(field)) {
      throw new Error(`Field '${field}' is not allowed for update`);
    }

    return apiCall(`businesses?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        [field]: value,
        updated_at: new Date().toISOString()
      })
    });
  },

  updateStatus: (id: number, status: Business['status'], notes?: string): Promise<Business> =>
    apiCall(`businesses?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        notes,
        updated_at: new Date().toISOString()
      })
    }),

  updateContactStatus: (id: number, contact_status: string, next_followup_at?: string): Promise<Business> =>
    apiCall(`businesses?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        contact_status,
        last_contacted_at: new Date().toISOString(),
        next_followup_at,
        updated_at: new Date().toISOString()
      })
    }),

  assignMarketer: (businessIds: number[], marketer_id: number): Promise<Business[]> =>
    apiCall(`businesses?id=in.(${businessIds.join(',')})`, {
      method: 'PATCH',
      body: JSON.stringify({
        assigned_marketer: marketer_id,
        updated_at: new Date().toISOString()
      })
    }),

  bulkUpdateStatus: (businessIds: number[], status: Business['status']): Promise<Business[]> =>
    apiCall(`businesses?id=in.(${businessIds.join(',')})`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        updated_at: new Date().toISOString()
      })
    }),

  export: (filters?: any): Promise<Blob> =>
    fetch(`${getConfig().supabaseUrl}/rest/v1/rpc/export_businesses`, {
      method: 'POST',
      headers: {
        'apikey': getConfig().supabaseKey,
        'Authorization': `Bearer ${getConfig().supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(filters || {})
    }).then(response => response.blob()),

  delete: (id: number): Promise<void> =>
    apiCall(`businesses?id=eq.${id}`, { method: 'DELETE' })
};

// Business Interactions API functions
export const businessInteractionApi = {
  getByBusinessId: (business_id: number): Promise<BusinessInteraction[]> =>
    apiCall(`business_interactions?business_id=eq.${business_id}&select=id,action,details,timestamp,user_id&order=timestamp.desc`),

  getAll: (filters?: {
    action?: string;
    search?: string;
    business_id?: number;
    user_id?: number;
    from?: string; // ISO
    to?: string;   // ISO
    limit?: number;
  }): Promise<BusinessInteraction[]> => {
    let query = `business_interactions?select=id,business_id,user_id,action,details,timestamp,businesses(name,areas(name,cities(name)))&order=timestamp.desc`;
    const conditions: string[] = [];
    if (filters?.action && filters.action !== 'all') conditions.push(`action=eq.${filters.action}`);
    if (filters?.business_id) conditions.push(`business_id=eq.${filters.business_id}`);
    if (filters?.user_id) conditions.push(`user_id=eq.${filters.user_id}`);
    if (filters?.from) conditions.push(`timestamp=gte.${filters.from}`);
    if (filters?.to) conditions.push(`timestamp=lte.${filters.to}`);
    if (filters?.search) {
      // details is jsonb, using ilike on text cast
      conditions.push(`or=(details::text.ilike.*${filters.search}*)`);
    }
    // Add pagination support
    if (filters?.limit) conditions.push(`limit=${filters.limit}`);
    if (conditions.length) query += `&${conditions.join('&')}`;
    return apiCall(query);
  },

  create: (data: Omit<BusinessInteraction, 'id' | 'timestamp'>): Promise<BusinessInteraction> =>
    apiCall('business_interactions', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      })
    }),

  addNote: (business_id: number, note: string, user_id?: number): Promise<BusinessInteraction> =>
    apiCall('business_interactions', {
      method: 'POST',
      body: JSON.stringify({
        business_id,
        user_id,
        action: 'note_added',
        details: { note },
        timestamp: new Date().toISOString()
      })
    }),

  logCall: (business_id: number, duration: number, outcome: string, notes?: string, user_id?: number): Promise<BusinessInteraction> =>
    apiCall('business_interactions', {
      method: 'POST',
      body: JSON.stringify({
        business_id,
        user_id,
        action: 'call_made',
        details: { duration, outcome, notes },
        timestamp: new Date().toISOString()
      })
    }),

  logEmail: (business_id: number, subject: string, outcome: string, user_id?: number): Promise<BusinessInteraction> =>
    apiCall('business_interactions', {
      method: 'POST',
      body: JSON.stringify({
        business_id,
        user_id,
        action: 'email_sent',
        details: { subject, outcome },
        timestamp: new Date().toISOString()
      })
    })
};

// Authentication API functions
export const authApi = {
  login: async (email: string, password: string): Promise<Admin> => {
    // For demo purposes, we'll simulate authentication
    // In a real app, this would validate against the database
    if (password === 'admin123') {
      try {
        const admins = await apiCall<Admin[]>(`admins?email=eq.${encodeURIComponent(email)}&select=*`);
        if (admins && admins.length > 0) {
          return admins[0];
        }
      } catch (error) {
        console.error('Admin lookup failed:', error);
      }
    }
    throw new ApiError('Invalid credentials', 401);
  },

  getAdmins: (): Promise<Admin[]> =>
    apiCall('admins?select=*&order=name.asc'),

  getAdminById: (id: number): Promise<Admin> =>
    apiCall(`admins?id=eq.${id}&select=*`).then(admins => {
      if (admins && admins.length > 0) {
        return admins[0];
      }
      throw new ApiError('Admin not found', 404);
    })
};

// Connection test function
export const testConnections = async (): Promise<{
  database: boolean;
  citiesWebhook: boolean;
  areasWebhook: boolean;
}> => {
  const config = getConfig();
  const results = { database: false, citiesWebhook: false, areasWebhook: false };

  // Test database connection
  if (config.supabaseUrl && config.supabaseKey) {
    try {
      await apiCall('countries?select=count&limit=1');
      results.database = true;
    } catch (error) {
      console.error('Database test failed:', error);
    }
  }

  // Test cities webhook
  if (config.citiesWebhook) {
    try {
      const response = await fetch(config.citiesWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      results.citiesWebhook = response.ok;
    } catch (error) {
      console.error('Cities webhook test failed:', error);
    }
  }

  // Test areas webhook
  if (config.areasWebhook) {
    try {
      const response = await fetch(config.areasWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      });
      results.areasWebhook = response.ok;
    } catch (error) {
      console.error('Areas webhook test failed:', error);
    }
  }

  return results;
};