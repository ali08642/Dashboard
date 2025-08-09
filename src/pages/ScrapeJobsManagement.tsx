import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Play, Trash2, RefreshCw, Search, Globe, MapPin, Target, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable } from '../components/tables/DataTable';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { countryApi, scrapeJobApi } from '../utils/api';
import type { Country, City, Area, ScrapeJob } from '../utils/types';

export const ScrapeJobsManagement: React.FC = () => {
  const { dispatch, showNotification, hideNotification } = useApp();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Job Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creatingJob, setCreatingJob] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<number | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  
  // Jobs Management State
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deletingJob, setDeletingJob] = useState<ScrapeJob | null>(null);

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [countriesData, jobsData] = await Promise.all([
        countryApi.getAll(),
        scrapeJobApi.getAll()
      ]);
      setCountries(countriesData);
      setJobs(jobsData);
      // Also update the context state like other pages
      dispatch({ type: 'SET_ALL_COUNTRIES', payload: countriesData });
    } catch (error) {
      console.error('Failed to load initial data:', error);
      showNotification('success', 'Loading Failed', 'Failed to load data', 'Please check your database configuration.');
      setTimeout(hideNotification, 3000);
    } finally {
      setLoading(false);
    }
  }, [dispatch, showNotification, hideNotification]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadJobs = async () => {
    try {
      const jobsData = await scrapeJobApi.getAll();
      setJobs(jobsData);
    } catch (error) {
      console.error('Failed to load jobs:', error);
      showNotification('success', 'Loading Failed', 'Failed to load jobs', 'Please check your database configuration.');
      setTimeout(hideNotification, 3000);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const jobsData = await scrapeJobApi.getAll();
      setJobs(jobsData);
      showNotification('success', 'Refreshed', 'Jobs updated', 'Job list has been refreshed successfully.');
      setTimeout(hideNotification, 2000);
    } catch (error) {
      console.error('Failed to refresh jobs:', error);
      showNotification('success', 'Refresh Failed', 'Failed to refresh jobs', 'Please check your database configuration.');
      setTimeout(hideNotification, 3000);
    } finally {
      setRefreshing(false);
    }
  };

  // Job Creation Flow
  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const countryId = value ? parseInt(value) : null;
    setSelectedCountryId(countryId);
    setSelectedCityId(null);
    setSelectedAreaId(null);
    setCities([]);
    setAreas([]);
    
    if (countryId) {
      setLoadingCities(true);
      try {
        const citiesData = await scrapeJobApi.getCitiesByCountry(countryId);
        setCities(citiesData);
      } catch (error) {
        console.error('Failed to load cities:', error);
        showNotification('success', 'Loading Failed', 'Failed to load cities', 'Please check your database configuration.');
        setTimeout(hideNotification, 3000);
      } finally {
        setLoadingCities(false);
      }
    }
  };

  const handleCityChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const cityId = value ? parseInt(value) : null;
    setSelectedCityId(cityId);
    setSelectedAreaId(null);
    setAreas([]);
    
    if (cityId) {
      setLoadingAreas(true);
      try {
        const areasData = await scrapeJobApi.getAreasByCity(cityId);
        setAreas(areasData);
      } catch (error) {
        console.error('Failed to load areas:', error);
        showNotification('success', 'Loading Failed', 'Failed to load areas', 'Please check your database configuration.');
        setTimeout(hideNotification, 3000);
      } finally {
        setLoadingAreas(false);
      }
    }
  };

  const handleAreaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const areaId = value ? parseInt(value) : null;
    setSelectedAreaId(areaId);
  };

  const handleCreateJob = async () => {
    if (!selectedAreaId || !keyword.trim()) {
      showNotification('success', 'Validation Error', 'Missing Information', 'Please select an area and enter a keyword.');
      setTimeout(hideNotification, 3000);
      return;
    }

    setCreatingJob(true);
    try {
      await scrapeJobApi.create({
        area_id: selectedAreaId,
        keyword: keyword.trim()
      });
      
      setIsCreateModalOpen(false);
      resetCreateForm();
      loadJobs();
      
      showNotification('success', 'Job Created', 'Scraping job created successfully', 'The job has been queued for processing.');
      setTimeout(hideNotification, 3000);
    } catch (error: unknown) {
      console.error('Failed to create job:', error);
      showNotification('success', 'Creation Failed', 'Failed to create job', error instanceof Error ? error.message : 'Please try again.');
      setTimeout(hideNotification, 3000);
    } finally {
      setCreatingJob(false);
    }
  };

  const resetCreateForm = () => {
    setSelectedCountryId(null);
    setSelectedCityId(null);
    setSelectedAreaId(null);
    setKeyword('');
    setCities([]);
    setAreas([]);
    setLoadingCities(false);
    setLoadingAreas(false);
  };

  const handleDelete = useCallback((job: ScrapeJob) => {
    setDeletingJob(job);
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingJob) return;

    try {
      await scrapeJobApi.delete(deletingJob.id);
      setIsConfirmModalOpen(false);
      loadJobs();
      showNotification('success', 'Job Deleted', 'Job deleted successfully', 'The scraping job has been removed.');
      setTimeout(hideNotification, 2000);
    } catch (error: unknown) {
      console.error('Failed to delete job:', error);
      showNotification('success', 'Deletion Failed', 'Failed to delete job', error instanceof Error ? error.message : 'Please try again');
      setTimeout(hideNotification, 3000);
    }
  };

  // Filter jobs based on search term and status
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = (
        job.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.areas?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.areas?.cities?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.areas?.cities?.countries?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'running': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const columns = useMemo(() => [
    {
      key: 'id',
      title: 'ID',
      width: '80px',
      render: (value: number) => <strong className="text-gray-900">#{value}</strong>
    },
    {
      key: 'keyword',
      title: 'Keyword',
      render: (value: string) => (
        <span className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold text-sm border border-blue-200">
          {value}
        </span>
      )
    },
    {
      key: 'location',
      title: 'Location',
      render: (_: unknown, record: ScrapeJob) => (
        <div className="space-y-1">
          <div className="font-semibold text-gray-900">{record.areas?.name}</div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {record.areas?.cities?.name}, {record.areas?.cities?.countries?.name}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      width: '140px',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <div style={{ color: getStatusColor(value) }}>
            {getStatusIcon(value)}
          </div>
          <span 
            className="font-semibold text-sm capitalize"
            style={{ color: getStatusColor(value) }}
          >
            {value}
          </span>
        </div>
      )
    },
    {
      key: 'businesses_found',
      title: 'Businesses Found',
      width: '160px',
      render: (value: number) => (
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{value || 0}</div>
          <div className="text-xs text-gray-500">businesses</div>
        </div>
      )
    },
    {
      key: 'processing_time_seconds',
      title: 'Processing Time',
      width: '160px',
      render: (value: number) => value ? (
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{value}s</div>
          <div className="text-xs text-gray-500">duration</div>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      width: '140px',
      render: (value: string) => (
        <div className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '120px',
      render: (_: unknown, record: ScrapeJob) => (
        <div className="flex justify-center">
          <Button
            variant="danger"
            onClick={() => handleDelete(record)}
            className="px-3 py-2 text-sm"
            icon={<Trash2 className="w-4 h-4" />}
          >
            Delete
          </Button>
        </div>
      )
    }
  ], [handleDelete]);

  const countryOptions = useMemo(() => [
    { value: '', label: 'Select a country' },
    ...countries.map(country => ({
      value: country.id.toString(),
      label: country.name
    }))
  ], [countries]);

  const cityOptions = useMemo(() => [
    { value: '', label: 'Select a city' },
    ...cities.map(city => ({
      value: city.id.toString(),
      label: city.name
    }))
  ], [cities]);

  const areaOptions = useMemo(() => [
    { value: '', label: 'Select an area' },
    ...areas.map(area => ({
      value: area.id.toString(),
      label: area.name
    }))
  ], [areas]);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-lg overflow-hidden">
        <div className="p-8 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Scraping Jobs Management
              </h1>
              <p className="text-lg text-gray-600">
                Create and manage distributed scraping jobs for business lead generation
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={handleRefresh}
                loading={refreshing}
                icon={<RefreshCw className="w-4 h-4" />}
                className="px-6 py-3"
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                icon={<Plus className="w-4 h-4" />}
                className="px-6 py-3"
              >
                Create Job
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="p-8 bg-white border-t border-gray-200/60">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Input
                placeholder="Search jobs by keyword, area, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
                className="w-full"
              />
            </div>
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Jobs Table */}
      <div className="surface overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredJobs}
          loading={loading}
          emptyText="No scraping jobs found"
        />
      </div>

      {/* Enhanced Create Job Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetCreateForm();
        }}
        title="Create New Scraping Job"
        size="lg"
        footer={
          <>
            <Button 
              variant="secondary" 
              onClick={() => {
                setIsCreateModalOpen(false);
                resetCreateForm();
              }}
              className="px-6 py-3"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateJob} 
              loading={creatingJob}
              icon={<Play className="w-4 h-4" />}
              className="px-6 py-3"
            >
              Create Job
            </Button>
          </>
        }
      >
        <div className="space-y-8">
          {/* Job Creation Flow Guide */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-2xl p-6">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Job Creation Flow
            </h4>
            <div className="text-sm text-blue-800 leading-relaxed">
              Follow these steps: <strong>Country</strong> → <strong>City</strong> → <strong>Area</strong> → <strong>Keyword</strong>
            </div>
          </div>

          {/* Location Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <Select
                label="Country"
                value={selectedCountryId?.toString() || ''}
                onChange={handleCountryChange}
                options={countryOptions}
                disabled={countries.length === 0}
                className="w-full"
              />
              {selectedCountryId && (
                <div className="absolute top-8 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="relative">
              <Select
                label="City"
                value={selectedCityId?.toString() || ''}
                onChange={handleCityChange}
                options={loadingCities ? [{ value: '', label: 'Loading cities...' }] : cityOptions}
                disabled={!selectedCountryId || loadingCities}
                className="w-full"
              />
              {loadingCities && (
                <div className="absolute top-8 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-white animate-spin" />
                </div>
              )}
              {selectedCityId && !loadingCities && (
                <div className="absolute top-8 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>

          <div className="relative">
            <Select
              label="Area"
              value={selectedAreaId?.toString() || ''}
              onChange={handleAreaChange}
              options={loadingAreas ? [{ value: '', label: 'Loading areas...' }] : areaOptions}
              disabled={!selectedCityId || loadingAreas}
              className="w-full"
            />
            {loadingAreas && (
              <div className="absolute top-8 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              </div>
            )}
            {selectedAreaId && !loadingAreas && (
              <div className="absolute top-8 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

          <div className="relative">
            <Input
              label="Search Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., restaurants, hotels, shops"
              className="w-full"
            />
            {keyword.trim() && (
              <div className="absolute top-8 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="mt-2 text-sm text-gray-500">
              Enter the business type or keyword to search for in the selected area
            </div>
          </div>

          {/* Job Summary */}
          {selectedAreaId && keyword && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/60 rounded-2xl p-6">
              <h4 className="font-semibold text-green-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Ready to Create Job
              </h4>
              <div className="space-y-3 text-sm text-green-800">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">Keyword:</span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg font-medium">
                    {keyword}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">Location:</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {areas.find(a => a.id === selectedAreaId)?.name}
                    {cities.find(c => c.id === selectedCityId) && (
                      <>, {cities.find(c => c.id === selectedCityId)?.name}</>
                    )}
                    {countries.find(c => c.id === selectedCountryId) && (
                      <>, {countries.find(c => c.id === selectedCountryId)?.name}</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Enhanced Confirm Delete Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Deletion"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)} className="px-6 py-3">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} className="px-6 py-3">
              Delete Job
            </Button>
          </>
        }
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Scraping Job?</h3>
          <p className="text-gray-600 leading-relaxed">
            Are you sure you want to delete the scraping job for <strong>"{deletingJob?.keyword}"</strong> 
            in <strong>{deletingJob?.areas?.name}</strong>? This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};