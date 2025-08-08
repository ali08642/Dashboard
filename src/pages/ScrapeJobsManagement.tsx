import React, { useState, useEffect } from 'react';
import { Plus, Play, Trash2, RefreshCw, Search } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable } from '../components/tables/DataTable';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { countryApi, scrapeJobApi } from '../utils/api';
import type { Country, City, Area, ScrapeJob } from '../utils/types';

export const ScrapeJobsManagement: React.FC = () => {
  const { state, dispatch, showNotification, hideNotification } = useApp();
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

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
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
  };

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

  const handleDelete = (job: ScrapeJob) => {
    setDeletingJob(job);
    setIsConfirmModalOpen(true);
  };

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
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = (
      job.keyword.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.areas?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.areas?.cities?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.areas?.cities?.countries?.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ff9500';
      case 'running': return '#0071e3';
      case 'completed': return '#34c759';
      case 'failed': return '#ff3b30';
      default: return '#86868b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⚪';
    }
  };

  const columns = [
    {
      key: 'id',
      title: 'ID',
      width: '80px',
      render: (value: number) => <strong>#{value}</strong>
    },
    {
      key: 'keyword',
      title: 'Keyword',
      render: (value: string) => (
        <span className="bg-[rgba(0,113,227,0.1)] text-[#0071e3] px-2 py-1 rounded-md font-medium text-sm">
          {value}
        </span>
      )
    },
    {
      key: 'location',
      title: 'Location',
      render: (_: unknown, record: ScrapeJob) => (
        <div className="text-sm">
          <div className="font-medium">{record.areas?.name}</div>
          <div className="text-[#86868b]">
            {record.areas?.cities?.name}, {record.areas?.cities?.countries?.name}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      width: '120px',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <span style={{ color: getStatusColor(value) }}>
            {getStatusIcon(value)}
          </span>
          <span 
            className="font-medium text-sm capitalize"
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
      width: '140px',
      render: (value: number) => value || 0
    },
    {
      key: 'processing_time_seconds',
      title: 'Processing Time',
      width: '140px',
      render: (value: number) => value ? `${value}s` : '-'
    },
    {
      key: 'created_at',
      title: 'Created',
      width: '120px',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '100px',
      render: (_: unknown, record: ScrapeJob) => (
        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={() => handleDelete(record)}
            className="px-3 py-1.5 text-xs"
            icon={<Trash2 className="w-3 h-3" />}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  const countryOptions = [
    { value: '', label: 'Select a country' },
    ...countries.map(country => ({
      value: country.id.toString(),
      label: country.name
    }))
  ];

  const cityOptions = [
    { value: '', label: 'Select a city' },
    ...cities.map(city => ({
      value: city.id.toString(),
      label: city.name
    }))
  ];

  const areaOptions = [
    { value: '', label: 'Select an area' },
    ...areas.map(area => ({
      value: area.id.toString(),
      label: area.name
    }))
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  return (
    <div>
      <div className="bg-[rgba(255,255,255,0.72)] backdrop-blur-md rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_15px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex justify-between items-center p-7 border-b border-[rgba(0,0,0,0.08)]">
          <div>
            <h3 className="text-[22px] font-semibold text-[#1d1d1f] tracking-[-0.025em] leading-[1.2]">
              Scraping Jobs Management
            </h3>
            <p className="text-[15px] text-[#86868b] mt-1 tracking-[-0.015em]">
              Create and manage distributed scraping jobs
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleRefresh}
              loading={refreshing}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Job
            </Button>
          </div>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search jobs by keyword, area, city, or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-48">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={filteredJobs}
            loading={loading}
            emptyText="No scraping jobs found"
          />
        </div>
      </div>

      {/* Create Job Modal */}
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
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleCreateJob} 
              loading={creatingJob}
              icon={<Play className="w-4 h-4" />}
            >
              Create Job
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-[rgba(0,113,227,0.06)] border border-[rgba(0,113,227,0.2)] rounded-xl p-4">
            <h4 className="font-medium text-[#0071e3] mb-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#0071e3] rounded-full"></span>
              Job Creation Flow
            </h4>
            <div className="text-sm text-[#0071e3] leading-relaxed">
              Follow these steps: <strong>Country</strong> → <strong>City</strong> → <strong>Area</strong> → <strong>Keyword</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Select
                label="Country"
                value={selectedCountryId?.toString() || ''}
                onChange={handleCountryChange}
                options={countryOptions}
                disabled={countries.length === 0}
              />
              {selectedCountryId && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#34c759] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
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
              />
              {loadingCities && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#0071e3] rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              {selectedCityId && !loadingCities && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#34c759] rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">✓</span>
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
            />
            {loadingAreas && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#0071e3] rounded-full flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {selectedAreaId && !loadingAreas && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#34c759] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </div>

          <div className="relative">
            <Input
              label="Search Keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., restaurants, hotels, shops"
              hint="Enter the business type or keyword to search for in the selected area"
            />
            {keyword.trim() && (
              <div className="absolute top-6 -right-1 w-6 h-6 bg-[#34c759] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
            )}
          </div>

          {selectedAreaId && keyword && (
            <div className="bg-[rgba(52,199,89,0.06)] border border-[rgba(52,199,89,0.2)] rounded-xl p-4">
              <h4 className="font-medium text-[#34c759] mb-3 flex items-center gap-2">
                <span className="w-2 h-2 bg-[#34c759] rounded-full animate-pulse"></span>
                Ready to Create Job
              </h4>
              <div className="space-y-2 text-sm text-[#34c759]">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Keyword:</span>
                  <span className="bg-[rgba(52,199,89,0.15)] px-2 py-1 rounded-md font-medium">
                    {keyword}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Location:</span>
                  <span>
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

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Deletion"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete}>
              Delete Job
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed">
          Are you sure you want to delete the scraping job for "{deletingJob?.keyword}" 
          in {deletingJob?.areas?.name}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};