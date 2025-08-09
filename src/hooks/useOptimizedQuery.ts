import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessApi, countryApi, cityApi, areaApi, scrapeJobApi, businessInteractionApi } from '../utils/api';
import type { Business, Country, City, Area, ScrapeJob, BusinessInteraction } from '../utils/types';

// Query Keys
export const QUERY_KEYS = {
  COUNTRIES: ['countries'],
  CITIES: (countryId?: number) => countryId ? ['cities', countryId] : ['cities'],
  AREAS: (cityId?: number) => cityId ? ['areas', cityId] : ['areas'],
  BUSINESSES: (filters?: Record<string, unknown>) => ['businesses', filters],
  BUSINESS_STATS: ['business-stats'],
  SCRAPE_JOBS: ['scrape-jobs'],
  BUSINESS_INTERACTIONS: (businessId?: number) => businessId ? ['interactions', businessId] : ['interactions'],
} as const;

// Countries
export const useCountries = () => {
  return useQuery({
    queryKey: QUERY_KEYS.COUNTRIES,
    queryFn: countryApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCountryMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { type: 'create' | 'update' | 'delete'; id?: number; payload?: any }) => {
      switch (data.type) {
        case 'create':
          return countryApi.create(data.payload);
        case 'update':
          return countryApi.update(data.id!, data.payload);
        case 'delete':
          return countryApi.delete(data.id!);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COUNTRIES });
    }
  });
};

// Cities
export const useCities = (countryId?: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.CITIES(countryId),
    queryFn: () => countryId ? scrapeJobApi.getCitiesByCountry(countryId) : cityApi.getAll(),
    enabled: !!countryId || countryId === undefined,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 8 * 60 * 1000, // 8 minutes
  });
};

// Areas
export const useAreas = (cityId?: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.AREAS(cityId),
    queryFn: () => cityId ? scrapeJobApi.getAreasByCity(cityId) : areaApi.getAll(),
    enabled: !!cityId || cityId === undefined,
    staleTime: 3 * 60 * 1000,
    gcTime: 8 * 60 * 1000,
  });
};

// Businesses with optimized filtering
export const useBusinesses = (filters?: Record<string, unknown>) => {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESSES(filters),
    queryFn: () => businessApi.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds - shorter for dynamic data
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  });
};

// Business stats
export const useBusinessStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_STATS,
    queryFn: async () => {
      console.log('Fetching business stats...');
      try {
        // Try the RPC function first
        const rpcStats = await businessApi.getStats();
        console.log('RPC stats successful:', rpcStats);
        return rpcStats;
      } catch (error) {
        console.warn('RPC stats failed, calculating from business data:', error);
        // Fallback to calculating from all businesses - get ALL businesses without filters
        const businesses = await businessApi.getAll({});
        console.log(`Calculating stats from ${businesses.length} businesses`);
        
        const total = businesses.length;
        const by_status: { [key: string]: number } = {};
        const by_contact_status: { [key: string]: number } = {};
        
        businesses.forEach(business => {
          by_status[business.status] = (by_status[business.status] || 0) + 1;
          by_contact_status[business.contact_status] = (by_contact_status[business.contact_status] || 0) + 1;
        });

        const recent_count = businesses.filter(business => {
          const createdDate = new Date(business.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createdDate > weekAgo;
        }).length;

        const calculatedStats = { total, by_status, by_contact_status, recent_count };
        console.log('Calculated stats:', calculatedStats);
        return calculatedStats;
      }
    },
    staleTime: 10 * 1000, // 10 seconds - even shorter stale time
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: true, // Enable refetch on focus
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};

// Business mutations
export const useBusinessMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      type: 'updateStatus' | 'updateField' | 'updateContactStatus';
      id: number;
      payload: any;
    }) => {
      switch (data.type) {
        case 'updateStatus':
          return businessApi.updateStatus(data.id, data.payload.status, data.payload.notes);
        case 'updateField':
          return businessApi.updateField(data.id, data.payload.field, data.payload.value);
        case 'updateContactStatus':
          return businessApi.updateContactStatus(data.id, data.payload.status, data.payload.followupDate);
      }
    },
    onSuccess: () => {
      console.log('Business mutation successful, refreshing stats...');
      // Invalidate related queries more aggressively
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_STATS });
      // Force refetch stats immediately with a small delay to ensure DB is updated
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: QUERY_KEYS.BUSINESS_STATS });
        console.log('Stats refetch triggered');
      }, 100);
    }
  });
};

// Scrape jobs
export const useScrapeJobs = () => {
  return useQuery({
    queryKey: QUERY_KEYS.SCRAPE_JOBS,
    queryFn: scrapeJobApi.getAll,
    staleTime: 1 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });
};

// Business interactions
export const useBusinessInteractions = (businessId?: number, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.BUSINESS_INTERACTIONS(businessId),
    queryFn: () => businessId ? businessInteractionApi.getByBusinessId(businessId) : businessInteractionApi.getAll(),
    enabled: enabled && (!!businessId || businessId === undefined),
    staleTime: 1 * 60 * 1000,
    gcTime: 3 * 60 * 1000,
  });
};

export const useInteractionMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      type: 'addNote' | 'logCall' | 'logEmail';
      businessId: number;
      payload: any;
    }) => {
      switch (data.type) {
        case 'addNote':
          return businessInteractionApi.addNote(data.businessId, data.payload.note, data.payload.userId);
        case 'logCall':
          return businessInteractionApi.logCall(data.businessId, data.payload.duration, data.payload.outcome, data.payload.notes, data.payload.userId);
        case 'logEmail':
          return businessInteractionApi.logEmail(data.businessId, data.payload.subject, data.payload.outcome, data.payload.userId);
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_INTERACTIONS(variables.businessId) });
    }
  });
};

// Prefetch utilities
export const usePrefetch = () => {
  const queryClient = useQueryClient();

  const prefetchCountries = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.COUNTRIES,
      queryFn: countryApi.getAll,
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchBusinessStats = () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.BUSINESS_STATS,
      queryFn: businessApi.getStats,
      staleTime: 1 * 60 * 1000,
    });
  };

  const prefetchBusinesses = (filters?: Record<string, unknown>) => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.BUSINESSES(filters),
      queryFn: () => businessApi.getAll(filters),
      staleTime: 30 * 1000,
    });
  };

  return {
    prefetchCountries,
    prefetchBusinessStats,
    prefetchBusinesses,
  };
};