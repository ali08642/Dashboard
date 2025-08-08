import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Star, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar,
  ChevronDown,
  ChevronRight,
  Edit,
  Trash2,
  Users,
  CheckSquare,
  MoreVertical,
  RefreshCw,
  Plus,
  Building,
  Clock,
  Mail
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable } from '../components/tables/DataTable';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { businessApi, businessInteractionApi, countryApi, cityApi, areaApi } from '../utils/api';
import type { Business, BusinessInteraction, Country, City, Area } from '../utils/types';

export const BusinessesManagement: React.FC = () => {
  const { showNotification, hideNotification } = useApp();
  
  // Main state
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusinesses, setSelectedBusinesses] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contactStatusFilter, setContactStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<{
    country_id?: number;
    city_id?: number;
    area_id?: number;
  }>({});
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [contactFilter, setContactFilter] = useState<string>('all');
  
  // Location data for filters
  const [countries, setCountries] = useState<Country[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  
  // Modal states
  const [isBulkActionsModalOpen, setIsBulkActionsModalOpen] = useState(false);
  const [businessInteractions, setBusinessInteractions] = useState<{ [key: number]: BusinessInteraction[] }>({});

  // Stats state
  const [stats, setStats] = useState<{
    total: number;
    by_status: { [key: string]: number };
    by_contact_status: { [key: string]: number };
    recent_count: number;
  }>({
    total: 0,
    by_status: {},
    by_contact_status: {},
    recent_count: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadBusinesses();
  }, [searchTerm, statusFilter, contactStatusFilter, categoryFilter, locationFilter, ratingFilter, contactFilter]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [businessesData, countriesData] = await Promise.all([
        businessApi.getAll(),
        countryApi.getAll()
      ]);
      
      setBusinesses(businessesData);
      setCountries(countriesData);
      
      // Calculate stats from loaded data
      const calculatedStats = calculateStats(businessesData);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      showNotification('success', 'Loading Failed', 'Failed to load business data', 'Please check your database configuration.');
      setTimeout(hideNotification, 3000);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: Business[]) => {
    const total = data.length;
    const by_status: { [key: string]: number } = {};
    const by_contact_status: { [key: string]: number } = {};
    
    data.forEach(business => {
      by_status[business.status] = (by_status[business.status] || 0) + 1;
      by_contact_status[business.contact_status] = (by_contact_status[business.contact_status] || 0) + 1;
    });

    const recent_count = data.filter(business => {
      const createdDate = new Date(business.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate > weekAgo;
    }).length;

    return { total, by_status, by_contact_status, recent_count };
  };

  const loadBusinesses = async () => {
    try {
      const filters: any = {};
      
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (contactStatusFilter !== 'all') filters.contact_status = contactStatusFilter;
      if (categoryFilter !== 'all') filters.category = categoryFilter;
      if (locationFilter.area_id) filters.area_id = locationFilter.area_id;
      if (ratingFilter !== 'all') filters.rating_min = parseFloat(ratingFilter);
      if (contactFilter === 'has_phone') filters.has_phone = true;
      if (contactFilter === 'has_website') filters.has_website = true;

      const businessesData = await businessApi.getAll(filters);
      setBusinesses(businessesData);
      
      // Recalculate stats with filtered data
      const calculatedStats = calculateStats(businessesData);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to load businesses:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadBusinesses();
      showNotification('success', 'Refreshed', 'Business data updated', 'Business list has been refreshed successfully.');
      setTimeout(hideNotification, 2000);
    } catch (error) {
      console.error('Failed to refresh businesses:', error);
      showNotification('success', 'Refresh Failed', 'Failed to refresh businesses', 'Please check your database configuration.');
      setTimeout(hideNotification, 3000);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleRowExpansion = async (businessId: number) => {
    const newExpandedRows = new Set(expandedRows);
    
    if (expandedRows.has(businessId)) {
      newExpandedRows.delete(businessId);
    } else {
      newExpandedRows.add(businessId);
      
      // Load interactions if not already loaded
      if (!businessInteractions[businessId]) {
        try {
          const interactions = await businessInteractionApi.getByBusinessId(businessId);
          setBusinessInteractions(prev => ({
            ...prev,
            [businessId]: interactions
          }));
        } catch (error) {
          console.warn('Failed to load interactions:', error);
          setBusinessInteractions(prev => ({
            ...prev,
            [businessId]: []
          }));
        }
      }
    }
    
    setExpandedRows(newExpandedRows);
  };

  const handleStatusChange = async (businessId: number, newStatus: Business['status']) => {
    try {
      await businessApi.updateStatus(businessId, newStatus);
      loadBusinesses();
      showNotification('success', 'Status Updated', 'Business status changed', `Status updated to ${newStatus}`);
      setTimeout(hideNotification, 2000);
    } catch (error) {
      console.error('Failed to update status:', error);
      showNotification('success', 'Update Failed', 'Failed to update status', 'Please try again.');
      setTimeout(hideNotification, 3000);
    }
  };

  const handleExport = async () => {
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter !== 'all') filters.status = statusFilter;
      if (contactStatusFilter !== 'all') filters.contact_status = contactStatusFilter;
      
      const blob = await businessApi.export(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `businesses_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      showNotification('success', 'Export Complete', 'Data exported successfully', 'Your CSV file has been downloaded.');
      setTimeout(hideNotification, 2000);
    } catch (error) {
      console.error('Failed to export:', error);
      showNotification('success', 'Export Failed', 'Failed to export data', 'Please try again.');
      setTimeout(hideNotification, 3000);
    }
  };

  // Get unique categories for filter
  const uniqueCategories = useMemo(() => {
    const categories = businesses
      .map(b => b.category)
      .filter(Boolean)
      .filter((category, index, self) => self.indexOf(category) === index)
      .sort();
    return categories;
  }, [businesses]);

  // Filter options
  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'interested', label: 'Interested' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'closed', label: 'Closed' },
    { value: 'rejected', label: 'Rejected' }
  ];

  const contactStatusOptions = [
    { value: 'all', label: 'All Contact Status' },
    { value: 'not_contacted', label: 'Not Contacted' },
    { value: 'attempted', label: 'Attempted' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'follow_up', label: 'Follow Up' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...uniqueCategories.map(cat => ({ value: cat!, label: cat! }))
  ];

  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '4', label: '4+ Stars' },
    { value: '3', label: '3+ Stars' },
    { value: '2', label: '2+ Stars' },
    { value: '1', label: '1+ Stars' }
  ];

  const contactOptions = [
    { value: 'all', label: 'All Contact Info' },
    { value: 'has_phone', label: 'Has Phone' },
    { value: 'has_website', label: 'Has Website' },
    { value: 'complete', label: 'Complete Info' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#86868b';
      case 'contacted': return '#0071e3';
      case 'interested': return '#ff9500';
      case 'qualified': return '#34c759';
      case 'closed': return '#34c759';
      case 'rejected': return '#ff3b30';
      default: return '#86868b';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return '🆕';
      case 'contacted': return '📞';
      case 'interested': return '👀';
      case 'qualified': return '✨';
      case 'closed': return '✅';
      case 'rejected': return '❌';
      default: return '⚪';
    }
  };

  const columns = [
    {
      key: 'expand',
      title: '',
      width: '30px',
      render: (_: unknown, record: Business) => (
        <button
          onClick={() => toggleRowExpansion(record.id)}
          className="p-0.5 hover:bg-gray-100 rounded-full transition-colors duration-150"
        >
          {expandedRows.has(record.id) ? (
            <ChevronDown className="w-3.5 h-3.5 text-[#6b7280]" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-[#6b7280]" />
          )}
        </button>
      )
    },
    {
      key: 'selection',
      title: '',
      width: '30px',
      render: (_: unknown, record: Business) => (
        <input
          type="checkbox"
          checked={selectedBusinesses.includes(record.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedBusinesses([...selectedBusinesses, record.id]);
            } else {
              setSelectedBusinesses(selectedBusinesses.filter(id => id !== record.id));
            }
          }}
          className="w-3.5 h-3.5 text-[#0071e3] bg-white border-gray-300 rounded focus:ring-[#0071e3]/20"
        />
      )
    },
    {
      key: 'name',
      title: 'Business',
      render: (_: unknown, record: Business) => (
        <div className="py-0.5">
          <div className="text-[13px] font-medium text-[#1d1d1f] tracking-[-0.015em] mb-0.5 line-clamp-1">
            {record.name}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-[#6b7280] tracking-[-0.01em]">
            <MapPin className="w-2.5 h-2.5" />
            <span className="line-clamp-1">{record.areas?.name}, {record.areas?.cities?.name}</span>
          </div>
          {record.category && (
            <div className="inline-block bg-[rgba(0,113,227,0.08)] text-[#0071e3] px-1.5 py-0.5 rounded-md text-[10px] font-medium mt-1 line-clamp-1">
              {record.category}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'contact_info',
      title: 'Contact',
      width: '140px',
      render: (_: unknown, record: Business) => (
        <div className="py-0.5 space-y-0.5">
          {record.phone && (
            <div className="flex items-center gap-1 text-[11px] text-[#374151] tracking-[-0.01em]">
              <Phone className="w-2.5 h-2.5 text-[#6b7280]" />
              <a href={`tel:${record.phone}`} className="hover:text-[#0071e3] truncate max-w-[110px]">
                {record.phone}
              </a>
            </div>
          )}
          {record.website && (
            <div className="flex items-center gap-1 text-[11px] text-[#374151] tracking-[-0.01em]">
              <Globe className="w-2.5 h-2.5 text-[#6b7280]" />
              <a href={record.website} target="_blank" rel="noopener noreferrer" className="hover:text-[#0071e3] truncate max-w-[110px]">
                {record.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </a>
            </div>
          )}
          {!record.phone && !record.website && (
            <span className="text-[11px] text-[#9ca3af] tracking-[-0.01em] italic">No contact info</span>
          )}
        </div>
      )
    },
    {
      key: 'rating',
      title: 'Rating',
      width: '70px',
      render: (value: number, record: Business) => (
        <div className="py-0.5">
          {value ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-[#fbbf24] fill-current" />
                <span className="text-[12px] font-medium text-[#374151] tracking-[-0.015em]">
                  {value.toFixed(1)}
                </span>
              </div>
              {record.review_count ? (
                <div className="text-[10px] text-[#9ca3af] tracking-[-0.01em]">
                  {record.review_count} reviews
                </div>
              ) : null}
            </div>
          ) : (
            <span className="text-[11px] text-[#9ca3af] tracking-[-0.01em] italic">No rating</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      title: 'Status',
      width: '90px',
      render: (value: string) => (
        <div className="py-0.5">
          <div 
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium"
            style={{ 
              color: getStatusColor(value),
              backgroundColor: `${getStatusColor(value)}10`
            }}
          >
            <span>{getStatusIcon(value)}</span>
            <span className="capitalize">
              {value.replace('_', ' ')}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'last_contacted_at',
      title: 'Last Contact',
      width: '90px',
      render: (value: string) => value ? (
        <div className="flex items-center gap-1 text-[11px] text-[#6b7280] tracking-[-0.01em] py-0.5">
          <Calendar className="w-2.5 h-2.5" />
          <span>{new Date(value).toLocaleDateString()}</span>
        </div>
      ) : (
        <span className="text-[11px] text-[#9ca3af] italic tracking-[-0.01em] py-0.5">Never</span>
      )
    },
    {
      key: 'actions',
      title: '',
      width: '40px',
      render: (_: unknown, record: Business) => (
        <div className="flex justify-center py-0.5">
          <div className="relative group/menu">
            <button className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150">
              <MoreVertical className="w-3.5 h-3.5 text-[#6b7280]" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-10">
              <div className="py-1">
                {statusOptions.slice(1).map(status => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusChange(record.id, status.value as Business['status'])}
                    className="w-full text-left px-3 py-1.5 text-[11px] text-[#374151] hover:bg-gray-50 transition-colors duration-150"
                  >
                    <span className="inline-flex items-center gap-2">
                      <span style={{ color: getStatusColor(status.value as string) }}>
                        {getStatusIcon(status.value as string)}
                      </span>
                      <span>Mark as {status.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="px-1 py-1">
      <div className="bg-[rgba(255,255,255,0.75)] backdrop-blur-md rounded-xl border border-[rgba(0,0,0,0.06)] shadow-[0_2px_12px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-[rgba(0,0,0,0.06)]">
          <div>
            <h3 className="text-[20px] font-semibold text-[#1e293b] tracking-[-0.025em] leading-[1.2]">
              Business Data Management
            </h3>
            <p className="text-[13px] text-[#64748b] mt-0.5 tracking-[-0.01em]">
              View and manage collected business information
            </p>
          </div>
          <div className="flex gap-1.5">
            {selectedBusinesses.length > 0 && (
              <Button
                variant="secondary"
                onClick={() => setIsBulkActionsModalOpen(true)}
                icon={<CheckSquare className="w-3.5 h-3.5" />}
                className="text-[12px] px-2.5 py-1.5"
              >
                Bulk ({selectedBusinesses.length})
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={handleExport}
              icon={<Download className="w-3.5 h-3.5" />}
              className="text-[12px] px-2.5 py-1.5"
            >
              Export
            </Button>
            <Button
              variant="secondary"
              onClick={handleRefresh}
              loading={refreshing}
              icon={<RefreshCw className="w-3.5 h-3.5" />}
              className="text-[12px] px-2.5 py-1.5"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="p-4 border-b border-[rgba(0,0,0,0.06)] bg-gradient-to-r from-[#f8fafc] to-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.04)] px-3 py-2.5 text-center">
              <div className="text-[18px] font-semibold text-[#1e293b] tracking-[-0.02em]">
                {stats.total.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#64748b] tracking-[-0.01em] mt-0.5">Total Businesses</div>
            </div>
            <div className="bg-[#f0fdf4] rounded-lg shadow-sm border border-[rgba(22,163,74,0.1)] px-3 py-2.5 text-center">
              <div className="text-[18px] font-semibold text-[#16a34a] tracking-[-0.02em]">
                {(stats.by_status?.qualified || 0) + (stats.by_status?.closed || 0)}
              </div>
              <div className="text-[11px] text-[#15803d] tracking-[-0.01em] mt-0.5">Qualified/Closed</div>
            </div>
            <div className="bg-[#f0f9ff] rounded-lg shadow-sm border border-[rgba(2,132,199,0.1)] px-3 py-2.5 text-center">
              <div className="text-[18px] font-semibold text-[#0284c7] tracking-[-0.02em]">
                {stats.by_status?.contacted || 0}
              </div>
              <div className="text-[11px] text-[#0369a1] tracking-[-0.01em] mt-0.5">Contacted</div>
            </div>
            <div className="bg-[#f8fafc] rounded-lg shadow-sm border border-[rgba(100,116,139,0.1)] px-3 py-2.5 text-center">
              <div className="text-[18px] font-semibold text-[#475569] tracking-[-0.02em]">
                {stats.by_status?.new || 0}
              </div>
              <div className="text-[11px] text-[#64748b] tracking-[-0.01em] mt-0.5">New Leads</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-[rgba(0,0,0,0.06)] bg-[#fafafa]">
          <div className="flex flex-wrap gap-2 mb-2">
            <div className="flex-grow md:max-w-xs">
              <Input
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-3.5 h-3.5" />}
                className="text-[12px] py-2"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
                className="text-[12px] py-2 w-32"
              />
              <Select
                value={contactStatusFilter}
                onChange={(e) => setContactStatusFilter(e.target.value)}
                options={contactStatusOptions}
                className="text-[12px] py-2 w-40"
              />
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categoryOptions}
                className="text-[12px] py-2 w-40"
              />
            </div>
          </div>
          
          <div className="flex gap-1.5 items-center flex-wrap">
            <div className="flex gap-1.5">
              <Select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                options={ratingOptions}
                className="text-[12px] py-2 w-28"
              />
              <Select
                value={contactFilter}
                onChange={(e) => setContactFilter(e.target.value)}
                options={contactOptions}
                className="text-[12px] py-2 w-32"
              />
            </div>
            <div className="flex-grow"></div>
            <div className="inline-flex items-center gap-2 text-[11px] text-[#64748b] tracking-[-0.01em] px-3 py-1.5 bg-white rounded-full border border-[rgba(0,0,0,0.04)] shadow-sm">
              <Filter className="w-3 h-3" />
              <span className="font-medium">{businesses.length}</span> businesses found
            </div>
          </div>
        </div>

        <div className="p-3">
          <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.06)] shadow-sm overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-[#f8fafc] to-white border-b border-[rgba(0,0,0,0.06)] px-3 py-2.5">
              <div className="flex items-center">
                <div className="w-6 flex justify-center">
                  <div className="w-3.5 h-3.5"></div>
                </div>
                <div className="w-6 flex justify-center">
                  <input
                    type="checkbox"
                    checked={selectedBusinesses.length === businesses.length && businesses.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBusinesses(businesses.map(b => b.id));
                      } else {
                        setSelectedBusinesses([]);
                      }
                    }}
                    className="w-3.5 h-3.5 text-[#0071e3] bg-white border-gray-300 rounded focus:ring-[#0071e3]/10"
                  />
                </div>
                <div className="flex-1 grid grid-cols-6 gap-2 text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.05em]">
                  <div className="col-span-2 pl-1.5">Business</div>
                  <div>Contact</div>
                  <div>Rating</div>
                  <div>Status</div>
                  <div>Last Contact</div>
                </div>
                <div className="w-10 flex justify-center text-[10px] font-semibold text-[#64748b] uppercase tracking-[0.05em]">
                  
                </div>
              </div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-[rgba(0,0,0,0.04)]">
              {businesses.map((business) => (
                <div key={business.id}>
                  {/* Main Row - Clickable */}
                  <div 
                    className="flex items-center px-3 py-2.5 hover:bg-[#f8fafc] cursor-pointer transition-all duration-200"
                    onClick={() => toggleRowExpansion(business.id)}
                  >
                    {/* Expand Button */}
                    <div className="w-6 flex justify-center">
                      <div className={`p-0.5 rounded-full transition-colors duration-200 ${expandedRows.has(business.id) ? 'bg-[#e0f2fe]' : 'group-hover:bg-gray-100'}`}>
                        {expandedRows.has(business.id) ? (
                          <ChevronDown className="w-3 h-3 text-[#0284c7]" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-[#64748b]" />
                        )}
                      </div>
                    </div>

                    {/* Checkbox */}
                    <div className="w-6 flex justify-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedBusinesses.includes(business.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBusinesses([...selectedBusinesses, business.id]);
                          } else {
                            setSelectedBusinesses(selectedBusinesses.filter(id => id !== business.id));
                          }
                        }}
                        className="w-3.5 h-3.5 text-[#0071e3] bg-white border-gray-300 rounded focus:ring-[#0071e3]/10"
                      />
                    </div>

                    {/* Business Info */}
                    <div className="flex-1 grid grid-cols-6 gap-2 items-center">
                      {/* Name & Location */}
                      <div className="col-span-2">
                        <div className="text-[12px] font-medium text-[#1e293b] tracking-[-0.01em] leading-tight mb-0.5 line-clamp-1">
                          {business.name}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-[#64748b] tracking-[-0.01em]">
                          <MapPin className="w-2.5 h-2.5" />
                          <span className="line-clamp-1 max-w-[180px]">{business.areas?.name}, {business.areas?.cities?.name}</span>
                        </div>
                        {business.category && (
                          <div className="inline-block bg-[#f0f9ff] text-[#0284c7] px-1.5 py-0.5 rounded-md text-[9px] font-medium mt-0.5">
                            {business.category}
                          </div>
                        )}
                      </div>

                      {/* Contact */}
                      <div>
                        <div className="space-y-0.5">
                          {business.phone && (
                            <div className="flex items-center gap-1 text-[10px] text-[#334155] tracking-[-0.01em]">
                              <Phone className="w-2.5 h-2.5 text-[#64748b]" />
                              <a 
                                href={`tel:${business.phone}`} 
                                className="hover:text-[#0284c7] truncate max-w-[80px] transition-colors duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {business.phone}
                              </a>
                            </div>
                          )}
                          {business.website && (
                            <div className="flex items-center gap-1 text-[10px] text-[#334155] tracking-[-0.01em]">
                              <Globe className="w-2.5 h-2.5 text-[#64748b]" />
                              <a 
                                href={business.website} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="hover:text-[#0284c7] truncate max-w-[80px] transition-colors duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                              </a>
                            </div>
                          )}
                          {!business.phone && !business.website && (
                            <span className="text-[10px] text-[#94a3b8] tracking-[-0.01em] italic">No contact</span>
                          )}
                        </div>
                      </div>

                      {/* Rating */}
                      <div>
                        {business.rating ? (
                          <div>
                            <div className="flex items-center gap-0.5">
                              <Star className="w-2.5 h-2.5 text-[#f59e0b] fill-current" />
                              <span className="text-[11px] font-medium text-[#334155] tracking-[-0.01em]">
                                {business.rating.toFixed(1)}
                              </span>
                            </div>
                            {business.review_count && (
                              <div className="text-[9px] text-[#94a3b8] tracking-[-0.01em]">
                                {business.review_count} reviews
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#94a3b8] tracking-[-0.01em] italic">No rating</span>
                        )}
                      </div>

                      {/* Status */}
                      <div>
                        <div 
                          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-medium"
                          style={{ 
                            color: getStatusColor(business.status),
                            backgroundColor: `${getStatusColor(business.status)}10`
                          }}
                        >
                          <span>{getStatusIcon(business.status)}</span>
                          <span className="capitalize">
                            {business.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Last Contact */}
                      <div>
                        {business.last_contacted_at ? (
                          <div className="flex items-center gap-1 text-[10px] text-[#64748b] tracking-[-0.01em]">
                            <Calendar className="w-2.5 h-2.5" />
                            <span>{new Date(business.last_contacted_at).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#94a3b8] tracking-[-0.01em] italic">Never</span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                        <div className="group/actions relative">
                          <button className="p-0.5 hover:bg-gray-100 rounded-full transition-colors duration-200">
                            <MoreVertical className="w-3.5 h-3.5 text-[#64748b]" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-[rgba(0,0,0,0.08)] rounded-lg shadow-lg opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all duration-200 z-30">
                            <div className="py-1">
                              {statusOptions.slice(1).map(status => (
                                <button
                                  key={status.value}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusChange(business.id, status.value as Business['status']);
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[11px] text-[#334155] hover:bg-[#f1f5f9] transition-colors duration-150"
                                >
                                  <span className="inline-flex items-center gap-1.5">
                                    <span style={{ color: getStatusColor(status.value as string) }}>
                                      {getStatusIcon(status.value as string)}
                                    </span>
                                    <span>Mark as {status.label}</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Row */}
                  {expandedRows.has(business.id) && (
                    <div className="bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] border-t border-b border-[rgba(0,0,0,0.04)]">
                      <div className="px-5 py-4">
                        <div className="ml-16 grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Details */}
                          <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.04)] p-3.5">
                            <h4 className="text-[11px] font-semibold text-[#334155] tracking-[-0.015em] mb-3 flex items-center gap-2">
                              <div className="w-1 h-3.5 bg-[#0284c7] rounded-full"></div>
                              Business Details
                            </h4>
                            <div className="space-y-3 pl-3">
                              {business.address && (
                                <div>
                                  <div className="text-[10px] font-medium text-[#64748b] uppercase tracking-[0.05em] mb-1">Address</div>
                                  <div className="text-[11px] text-[#334155] leading-relaxed">{business.address}</div>
                                </div>
                              )}
                              {business.scrape_jobs?.keyword && (
                                <div>
                                  <div className="text-[10px] font-medium text-[#64748b] uppercase tracking-[0.05em] mb-1">Keyword</div>
                                  <div className="inline-block bg-[#e0f2fe] text-[#0284c7] px-2 py-1 rounded-md text-[10px] font-medium">
                                    {business.scrape_jobs.keyword}
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="text-[10px] font-medium text-[#64748b] uppercase tracking-[0.05em] mb-1">Added</div>
                                <div className="text-[11px] text-[#334155]">
                                  {new Date(business.created_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Contact Status */}
                          <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.04)] p-3.5">
                            <h4 className="text-[11px] font-semibold text-[#334155] tracking-[-0.015em] mb-3 flex items-center gap-2">
                              <div className="w-1 h-3.5 bg-[#10b981] rounded-full"></div>
                              Contact Status
                            </h4>
                            <div className="space-y-3 pl-3">
                              <div>
                                <div className="text-[10px] font-medium text-[#64748b] uppercase tracking-[0.05em] mb-1">Status</div>
                                <div className="text-[11px] text-[#334155] capitalize font-medium">
                                  <span 
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px]"
                                    style={{ 
                                      color: getStatusColor(business.status),
                                      backgroundColor: `${getStatusColor(business.status)}10`
                                    }}
                                  >
                                    {business.contact_status.replace('_', ' ')}
                                  </span>
                                </div>
                              </div>
                              {business.next_followup_at && (
                                <div>
                                  <div className="text-[10px] font-medium text-[#64748b] uppercase tracking-[0.05em] mb-1">Next Follow-up</div>
                                  <div className="text-[11px] text-[#f59e0b] font-medium flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(business.next_followup_at).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Notes & Activity */}
                          <div className="bg-white rounded-lg shadow-sm border border-[rgba(0,0,0,0.04)] p-3.5">
                            <h4 className="text-[11px] font-semibold text-[#334155] tracking-[-0.015em] mb-3 flex items-center gap-2">
                              <div className="w-1 h-3.5 bg-[#8b5cf6] rounded-full"></div>
                              Notes & Activity
                            </h4>
                            <div className="pl-3">
                              {business.notes && (
                                <div className="mb-3">
                                  <div className="text-[10px] font-medium text-[#64748b] uppercase tracking-[0.05em] mb-1">Notes</div>
                                  <div className="text-[11px] text-[#334155] bg-[#f8fafc] p-2.5 rounded-lg border border-[rgba(0,0,0,0.04)] leading-relaxed">
                                    {business.notes}
                                  </div>
                                </div>
                              )}
                              
                              {businessInteractions[business.id] && businessInteractions[business.id].length > 0 && (
                                <div>
                                  <div className="text-[10px] font-medium text-[#64748b] uppercase tracking-[0.05em] mb-1.5">Recent Activity</div>
                                  <div className="divide-y divide-[rgba(0,0,0,0.04)]">
                                    {businessInteractions[business.id].slice(0, 3).map(interaction => (
                                      <div key={interaction.id} className="text-[10px] text-[#334155] flex items-center justify-between py-1.5">
                                        <span className="capitalize font-medium flex items-center gap-1">
                                          <Mail className="w-2.5 h-2.5 text-[#8b5cf6]" />
                                          {interaction.action.replace('_', ' ')}
                                        </span>
                                        <span className="text-[#64748b]">
                                          {new Date(interaction.timestamp).toLocaleDateString()}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {!business.notes && (!businessInteractions[business.id] || businessInteractions[business.id].length === 0) && (
                                <div className="text-[11px] text-[#94a3b8] italic flex items-center justify-center h-20">
                                  No notes or activity yet
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {businesses.length === 0 && !loading && (
              <div className="text-center py-10 px-4">
                <div className="bg-[#f8fafc] rounded-full p-3 w-16 h-16 mx-auto mb-3">
                  <Building className="w-10 h-10 text-[#94a3b8] opacity-60" />
                </div>
                <div className="text-[13px] font-medium text-[#475569] tracking-[-0.01em]">No businesses found</div>
                <div className="text-[11px] text-[#94a3b8] mt-1">Try adjusting your filters or search criteria</div>
                <button 
                  onClick={handleRefresh} 
                  className="mt-4 text-[11px] font-medium text-[#0284c7] bg-[#f0f9ff] hover:bg-[#e0f2fe] px-3 py-1.5 rounded-full transition-colors duration-200 inline-flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Refresh data
                </button>
              </div>
            )}
            
            {loading && (
              <div className="text-center py-10 px-4">
                <div className="inline-block p-3">
                  <div className="w-8 h-8 border-2 border-[#e2e8f0] border-t-[#0284c7] rounded-full animate-spin"></div>
                </div>
                <div className="text-[13px] text-[#475569] tracking-[-0.01em] mt-2">Loading businesses...</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};