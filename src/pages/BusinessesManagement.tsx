import React, { useState, useCallback, useMemo } from 'react';
import { 
  Search,
  Download, 
  Star, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Building,
  Clock,
  Users,
  Target,
  Activity
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { BusinessTableSkeleton, SkeletonStats } from '../components/common/Skeleton';
import { useBusinesses, useBusinessStats, useBusinessMutation, useInteractionMutation, useBusinessInteractions, QUERY_KEYS } from '../hooks/useOptimizedQuery';
import { useQueryClient } from '@tanstack/react-query';
import { businessApi } from '../utils/api';
import type { Business, BusinessInteraction } from '../utils/types';

export const BusinessesManagement: React.FC = () => {
  const { showNotification, hideNotification } = useApp();
  const queryClient = useQueryClient();
  
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [contactStatusFilter, setContactStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [locationFilter] = useState<{
    country_id?: number;
    city_id?: number;
    area_id?: number;
  }>({});
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [contactFilter, setContactFilter] = useState<string>('all');
  
  // UI state
  const [selectedBusinesses, setSelectedBusinesses] = useState<number[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50); // Fixed page size for now
  
  // Optimized filters - only update when filters actually change
  const businessFilters = useMemo(() => {
    const filters: Record<string, unknown> = {};
    
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (contactStatusFilter !== 'all') filters.contact_status = contactStatusFilter;
    if (categoryFilter !== 'all') filters.category = categoryFilter;
    if (locationFilter.area_id) filters.area_id = locationFilter.area_id;
    if (ratingFilter !== 'all') filters.rating_min = parseFloat(ratingFilter);
    if (contactFilter === 'has_phone') filters.has_phone = true;
    if (contactFilter === 'has_website') filters.has_website = true;
    
    // Add pagination
    filters.limit = pageSize;
    filters.offset = (currentPage - 1) * pageSize;

    return filters;
  }, [searchTerm, statusFilter, contactStatusFilter, categoryFilter, locationFilter, ratingFilter, contactFilter, currentPage, pageSize]);

  // Use optimized queries
  const { data: businesses = [], isLoading, error: businessError } = useBusinesses(businessFilters);
  const { data: globalStats = { total: 0, by_status: {}, by_contact_status: {}, recent_count: 0 }, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useBusinessStats();

  // Ensure stats are fetched when component mounts
  React.useEffect(() => {
    console.log('BusinessesManagement component mounted, ensuring stats are loaded...');
    
    // Always trigger a fresh fetch on component mount to ensure data is loaded
    const timeoutId = setTimeout(() => {
      console.log('Triggering initial stats fetch...');
      refetchStats();
    }, 100); // Small delay to ensure component is fully mounted
    
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array = run only on mount
  
  // Additional check for empty stats
  React.useEffect(() => {
    if (!statsLoading && globalStats.total === 0 && !statsError) {
      console.log('Stats appear empty after loading, triggering refetch...');
      refetchStats();
    }
  }, [refetchStats, statsLoading, globalStats.total, statsError]);

  // Debug logging
  React.useEffect(() => {
    console.log('Stats state changed:');
    console.log('- Loading:', statsLoading);
    console.log('- Error:', statsError);
    console.log('- Data:', globalStats);
    
    if (globalStats && globalStats.total >= 0) {
      console.log('Stats updated - Total businesses:', globalStats.total);
      console.log('- By status:', globalStats.by_status);
      console.log('- By contact status:', globalStats.by_contact_status);
      
      // Also trigger a manual check for any pending queries
      if (globalStats.total > 0) {
        console.log('Stats loaded successfully with', globalStats.total, 'businesses');
      }
    }
    if (statsError) {
      console.error('Stats error:', statsError);
    }
  }, [globalStats, statsError, statsLoading]);
  const businessMutation = useBusinessMutation();
  const interactionMutation = useInteractionMutation();
  
  // Modal states
  const [businessInteractions, setBusinessInteractions] = useState<{ [key: number]: BusinessInteraction[] }>({});
  const [statusModal, setStatusModal] = useState<{
    open: boolean;
    business: Business | null;
    newStatus: Business['status'] | null;
    note: string;
    saving: boolean;
  }>({ open: false, business: null, newStatus: null, note: '', saving: false });

  // Inline edit states
  const [noteDrafts, setNoteDrafts] = useState<{ [key: number]: string }>({});
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [savingNoteId, setSavingNoteId] = useState<number | null>(null);
  const [contactDrafts, setContactDrafts] = useState<{ [key: number]: { contact_status: string; next_followup_at?: string } }>({});
  const [savingContactId, setSavingContactId] = useState<number | null>(null);
  const [assignedMarketerDrafts, setAssignedMarketerDrafts] = useState<{ [key: number]: string }>({});
  const [savingAssignedId, setSavingAssignedId] = useState<number | null>(null);

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    // Manually trigger a refetch of all business-related queries
    queryClient.invalidateQueries({ queryKey: ['businesses'] });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BUSINESS_STATS });
    
    // Force immediate refetch
    queryClient.refetchQueries({ queryKey: ['businesses'] });
    queryClient.refetchQueries({ queryKey: QUERY_KEYS.BUSINESS_STATS });
    
    showNotification('success', 'Refreshed', 'Business data updated', 'Business list and stats have been refreshed successfully.');
    setTimeout(hideNotification, 2000);
  };

  const toggleRowExpansion = (businessId: number) => {
    const newExpandedRows = new Set(expandedRows);
    
    if (expandedRows.has(businessId)) {
      newExpandedRows.delete(businessId);
    } else {
      newExpandedRows.add(businessId);
    }
    
    setExpandedRows(newExpandedRows);
  };

  // Use individual interaction hooks for expanded rows
  const useInteractionsForBusiness = (businessId: number) => {
    return useBusinessInteractions(businessId, expandedRows.has(businessId));
  };

  // Calculate total pages based on total businesses count
  const totalPages = Math.ceil((globalStats.total || 0) / pageSize);

  // Reset to page 1 when filters change
  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1);
    switch (filterType) {
      case 'search':
        setSearchTerm(value);
        break;
      case 'status':
        setStatusFilter(value);
        break;
      case 'contact_status':
        setContactStatusFilter(value);
        break;
      case 'category':
        setCategoryFilter(value);
        break;
      case 'rating':
        setRatingFilter(value);
        break;
      case 'contact':
        setContactFilter(value);
        break;
    }
  };

  const handleStatusChange = async (businessId: number, newStatus: Business['status']) => {
    const business = businesses.find(b => b.id === businessId) || null;
    setStatusModal({ open: true, business, newStatus, note: '', saving: false });
  };

  const submitStatusModal = async () => {
    if (!statusModal.business || !statusModal.newStatus) return;
    setStatusModal(prev => ({ ...prev, saving: true }));
    try {
      await businessMutation.mutateAsync({
        type: 'updateStatus',
        id: statusModal.business.id,
        payload: { status: statusModal.newStatus, notes: statusModal.note || undefined }
      });
      if (statusModal.note) {
        await interactionMutation.mutateAsync({
          type: 'addNote',
          businessId: statusModal.business.id,
          payload: { note: statusModal.note }
        });
      }
      showNotification('success', 'Status Updated', 'Business status changed', `Status updated to ${statusModal.newStatus}`);
      setTimeout(hideNotification, 2000);
      setStatusModal({ open: false, business: null, newStatus: null, note: '', saving: false });
    } catch (error) {
      console.error('Failed to update status:', error);
      showNotification('success', 'Update Failed', 'Failed to update status', 'Please try again.');
      setTimeout(hideNotification, 3000);
      setStatusModal(prev => ({ ...prev, saving: false }));
    }
  };

  const handleSaveNote = async (business: Business) => {
    const draft = noteDrafts[business.id] ?? '';
    setSavingNoteId(business.id);
    try {
      await businessMutation.mutateAsync({
        type: 'updateField',
        id: business.id,
        payload: { field: 'notes', value: draft }
      });
      if (draft && draft.trim().length > 0) {
        await interactionMutation.mutateAsync({
          type: 'addNote',
          businessId: business.id,
          payload: { note: draft }
        });
      }
      showNotification('success', 'Notes Saved', business.name, 'Notes have been updated.');
      setTimeout(hideNotification, 1500);
      setEditingNoteId(null);
    } catch (error) {
      console.error('Failed to save note:', error);
      showNotification('success', 'Save Failed', 'Failed to save notes', 'Please try again.');
      setTimeout(hideNotification, 2500);
    } finally {
      setSavingNoteId(null);
    }
  };

  const handleSaveContact = async (business: Business) => {
    const draft = contactDrafts[business.id] || { contact_status: business.contact_status, next_followup_at: business.next_followup_at };
    setSavingContactId(business.id);
    try {
      await businessMutation.mutateAsync({
        type: 'updateContactStatus',
        id: business.id,
        payload: { status: draft.contact_status, followupDate: draft.next_followup_at }
      });
      showNotification('success', 'Contact Updated', business.name, 'Contact status updated.');
      setTimeout(hideNotification, 1500);
    } catch (error) {
      console.error('Failed to update contact status:', error);
      showNotification('success', 'Update Failed', 'Failed to update contact status', 'Please try again.');
      setTimeout(hideNotification, 2500);
    } finally {
      setSavingContactId(null);
    }
  };

  const handleSaveAssignedMarketer = async (business: Business) => {
    const value = assignedMarketerDrafts[business.id];
    const marketerId = value === '' ? null : Number(value);
    setSavingAssignedId(business.id);
    try {
      await businessMutation.mutateAsync({
        type: 'updateField',
        id: business.id,
        payload: { field: 'assigned_marketer', value: marketerId }
      });
      showNotification('success', 'Assignment Updated', business.name, 'Assigned marketer updated.');
      setTimeout(hideNotification, 1500);
    } catch (error) {
      console.error('Failed to update assigned marketer:', error);
      showNotification('success', 'Update Failed', 'Failed to update assignment', 'Please try again.');
      setTimeout(hideNotification, 2500);
    } finally {
      setSavingAssignedId(null);
    }
  };

  const handleExport = async () => {
    try {
      const filters: Record<string, unknown> = {};
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
  // const uniqueCategories = useMemo(() => {
  //   const categories = businesses
  //     .map(b => b.category)
  //     .filter(Boolean)
  //     .filter((category, index, self) => self.indexOf(category) === index)
  //     .sort();
  //   return categories;
  // }, [businesses]);

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
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'cafe', label: 'Cafe' },
    { value: 'hotel', label: 'Hotel' },
  ];
  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: '4', label: '4+ Stars' },
    { value: '3', label: '3+ Stars' },
    { value: '2', label: '2+ Stars' },
    { value: '1', label: '1+ Stars' },
  ];
  const contactOptions = [
    { value: 'all', label: 'All Contact Info' },
    { value: 'has_phone', label: 'Has Phone' },
    { value: 'has_website', label: 'Has Website' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#6b7280';
      case 'contacted': return '#3b82f6';
      case 'interested': return '#f59e0b';
      case 'qualified': return '#10b981';
      case 'closed': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-black/5 overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-2xl">
                    <Building className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                      Business Dashboard
                    </h1>
                    <p className="text-primary-100 text-sm font-medium mt-0.5">
                      Manage leads, track interactions, and grow your business
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={handleExport}
                  icon={<Download className="w-4 h-4" />}
                  className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-300"
                >
                  Export Data
                </Button>
                <Button
                  variant="primary"
                  onClick={handleRefresh}
                  loading={isLoading || businessMutation.isPending}
                  icon={<RefreshCw className="w-4 h-4" />}
                  className="shadow-lg transition-all duration-300"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          </div>

          {/* Stats Cards */}
          <div className="px-8 py-6 bg-white/50 backdrop-blur-sm">
            {statsLoading || (globalStats.total === 0 && !statsError) ? (
              <SkeletonStats />
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-primary-600/10"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/25">
                      <Building className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-0.5">
                        {globalStats.total.toLocaleString()}
                      </div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Total Businesses
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-success-500/5 via-transparent to-success-600/10"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl shadow-lg shadow-success-500/25">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-0.5">
                        {(globalStats.by_status?.qualified || 0) + (globalStats.by_status?.closed || 0)}
                      </div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Qualified/Closed
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-success-500 to-success-600 h-1.5 rounded-full" style={{ width: `${globalStats.total ? Math.min(100, ((globalStats.by_status?.qualified || 0) + (globalStats.by_status?.closed || 0)) / globalStats.total * 100) : 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/10"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/25">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-0.5">
                        {globalStats.by_contact_status?.contacted || 0}
                      </div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Contacted
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full" style={{ width: `${globalStats.total ? Math.min(100, (globalStats.by_contact_status?.contacted || 0) / globalStats.total * 100) : 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="group relative overflow-hidden bg-gradient-to-br from-white to-gray-50/80 backdrop-blur-sm rounded-2xl border border-white/60 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-br from-warning-500/5 via-transparent to-warning-600/10"></div>
                <div className="relative p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gradient-to-br from-warning-500 to-warning-600 rounded-2xl shadow-lg shadow-warning-500/25">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900 mb-0.5">
                        {globalStats.by_status?.new || 0}
                      </div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        New Leads
                      </div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-warning-500 to-warning-600 h-1.5 rounded-full" style={{ width: `${globalStats.total ? Math.min(100, (globalStats.by_status?.new || 0) / globalStats.total * 100) : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
            )}
          </div>

          {/* Filters Bar */}
          <div className="px-8 pt-2 pb-6 bg-white/50 backdrop-blur-sm border-t border-white/40">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search by name, address, category..."
                  value={searchTerm}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[{ value: 'all', label: 'All Statuses' }, ...statusOptions.slice(1)]}
              />
              <Select
                value={contactStatusFilter}
                onChange={(e) => handleFilterChange('contact_status', e.target.value)}
                options={contactStatusOptions}
              />
              <Select
                value={categoryFilter}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                options={categoryOptions}
              />
              <Select
                value={ratingFilter}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                options={ratingOptions}
              />
              <Select
                value={contactFilter}
                onChange={(e) => handleFilterChange('contact', e.target.value)}
                options={contactOptions}
              />
            </div>
          </div>
        </div>

      {/* Business List */}
      {isLoading ? (
        <BusinessTableSkeleton rows={pageSize} />
      ) : (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur border-b border-gray-200 px-5 py-2">
          <div className="flex items-center">
            <div className="w-6 flex justify-center">
              <div className="w-4 h-4"></div>
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
                className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500/20"
              />
            </div>
            <div className="flex-1 grid grid-cols-6 gap-4 text-[11px] font-semibold text-gray-500 uppercase tracking-[0.08em]">
              <div className="col-span-2 pl-2">Business</div>
              <div>Contact</div>
              <div>Rating</div>
              <div>Status</div>
              <div>Last</div>
            </div>
            <div className="w-10 flex justify-center"></div>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {businesses.map((business) => (
            <div key={business.id} className="group">
              {/* Main Row */}
              <div 
                className={`flex items-center px-5 py-2.5 cursor-pointer transition-colors ${selectedBusinesses.includes(business.id) ? 'bg-primary-50/60' : 'hover:bg-gray-50'}`}
                onClick={() => toggleRowExpansion(business.id)}
              >
                {/* Expand Button */}
                <div className="w-6 flex justify-center">
                  <div className={`p-1 rounded-full transition-colors ${expandedRows.has(business.id) ? 'bg-blue-100' : 'group-hover:bg-gray-100'}`}>
                    {expandedRows.has(business.id) ? (
                      <ChevronDown className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
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
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500/20"
                  />
                </div>

                {/* Business Info */}
                <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                  {/* Name & Location */}
                  <div className="col-span-2">
                    <div className="text-[13px] font-semibold text-gray-900 leading-5 line-clamp-1">
                      {business.name}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1 max-w-[220px]">
                        {business.areas?.name}, {business.areas?.cities?.name}
                      </span>
                    </div>
                    {business.category && (
                      <span className="inline-block bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full text-[11px] font-medium mt-1">
                        {business.category}
                      </span>
                    )}
                  </div>

                  {/* Contact */}
                  <div className="text-[12px] text-gray-700">
                    <div className="space-y-0.5">
                      {business.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <a 
                            href={`tel:${business.phone}`} 
                            className="hover:text-blue-600 truncate max-w-[120px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {business.phone}
                          </a>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-gray-400" />
                          <a 
                            href={business.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:text-blue-600 truncate max-w-[140px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                          </a>
                        </div>
                      )}
                      {!business.phone && !business.website && (
                        <span className="text-[11px] text-gray-400 italic">No contact info</span>
                      )}
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="text-[12px]">
                    {business.rating ? (
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{business.rating.toFixed(1)}</span>
                        <div className="flex -mx-[1px]">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className={`${(business.rating || 0) >= i ? 'text-yellow-500 fill-current' : 'text-gray-300'} w-3 h-3 mx-[1px]`} />
                          ))}
                        </div>
                        {business.review_count && (
                          <span className="text-[11px] text-gray-400">{business.review_count}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">—</span>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <span 
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                      style={{ 
                        color: getStatusColor(business.status),
                        backgroundColor: `${getStatusColor(business.status)}0d`,
                        borderColor: `${getStatusColor(business.status)}66`
                      }}
                    >
                      <span>{getStatusIcon(business.status)}</span>
                      <span className="capitalize">{business.status.replace('_', ' ')}</span>
                    </span>
                  </div>

                  {/* Last Contact */}
                  <div>
                    {business.last_contacted_at ? (
                      <div className="flex items-center gap-1 text-[11px] text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(business.last_contacted_at).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-gray-400 italic">Never</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                    <div className="group/actions relative">
                      <button className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>
                       <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl opacity-0 invisible group-hover/actions:opacity-100 group-hover/actions:visible transition-all duration-200 z-30">
                        <div className="py-2">
                          {statusOptions.slice(1).map(status => (
                            <button
                              key={status.value}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusChange(business.id, status.value as Business['status']);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <span className="inline-flex items-center gap-2">
                                <span style={{ color: getStatusColor(status.value as string) }}>
                                  {getStatusIcon(status.value as string)}
                                </span>
                                <span>Mark as {status.label}</span>
                              </span>
                            </button>
                          ))}
                           <div className="my-1 border-t border-gray-100" />
                           <button
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingNoteId(business.id);
                               setNoteDrafts(prev => ({ ...prev, [business.id]: business.notes || '' }));
                             }}
                             className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                           >
                             Edit Notes
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Row */}
              {expandedRows.has(business.id) && (
                <div className="bg-gray-50">
                  <div className="px-5 py-3">
                    <div className="ml-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px] text-gray-700">
                      {/* Details */}
                      <div className="border border-gray-200 rounded-lg bg-white p-3">
                        <div className="text-[11px] uppercase tracking-[0.06em] text-gray-500 mb-2">Details</div>
                        {business.address && (
                          <div className="mb-2">
                            <div className="text-[11px] text-gray-500">Address</div>
                            <div className="text-gray-900">{business.address}</div>
                          </div>
                        )}
                        {(business.latitude !== undefined && business.longitude !== undefined) && (
                          <div className="mb-2">
                            <div className="text-[11px] text-gray-500">Coordinates</div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-900">{business.latitude}, {business.longitude}</span>
                              <a
                                href={`https://www.google.com/maps?q=${business.latitude},${business.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                Open map
                              </a>
                            </div>
                          </div>
                        )}
                        {business.scrape_jobs?.keyword && (
                          <div>
                            <div className="text-[11px] text-gray-500">Keyword</div>
                            <div className="inline-block bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                              {business.scrape_jobs.keyword}
                            </div>
                          </div>
                        )}
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                          <div>
                            <div>Created</div>
                            <div className="text-gray-900 text-[12px]">{new Date(business.created_at).toLocaleString()}</div>
                          </div>
                          <div>
                            <div>Updated</div>
                            <div className="text-gray-900 text-[12px]">{new Date(business.updated_at).toLocaleString()}</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <div className="text-[11px] text-gray-500">Assigned Marketer (ID)</div>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="number"
                              className="w-28 px-3 py-1.5 border border-gray-200 rounded-md text-[12px]"
                              value={assignedMarketerDrafts[business.id] ?? (business.assigned_marketer?.toString() ?? '')}
                              onChange={(e) => setAssignedMarketerDrafts(prev => ({ ...prev, [business.id]: e.target.value }))}
                            />
                            <Button
                              variant="secondary"
                              loading={savingAssignedId === business.id}
                              onClick={() => handleSaveAssignedMarketer(business)}
                              className="!px-3 !py-1.5 text-[12px]"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Contact Status */}
                      <div className="border border-gray-200 rounded-lg bg-white p-3">
                        <div className="text-[11px] uppercase tracking-[0.06em] text-gray-500 mb-2">Contact Status</div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border"
                            style={{ 
                              color: getStatusColor(business.status),
                              backgroundColor: `${getStatusColor(business.status)}0d`,
                              borderColor: `${getStatusColor(business.status)}66`
                            }}
                          >
                            {business.contact_status.replace('_', ' ')}
                          </span>
                          {business.next_followup_at && (
                            <span className="flex items-center gap-1 text-[11px] text-orange-600">
                              <Clock className="w-3 h-3" />
                              {new Date(business.next_followup_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <select
                            className="px-3 py-2 border border-gray-200 rounded-md text-[12px]"
                            value={(contactDrafts[business.id]?.contact_status) ?? business.contact_status}
                            onChange={(e) => setContactDrafts(prev => ({
                              ...prev,
                              [business.id]: {
                                contact_status: e.target.value,
                                next_followup_at: prev[business.id]?.next_followup_at ?? business.next_followup_at
                              }
                            }))}
                          >
                            {contactStatusOptions.slice(1).map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <input
                            type="date"
                            className="px-3 py-2 border border-gray-200 rounded-md text-[12px]"
                            value={(contactDrafts[business.id]?.next_followup_at || business.next_followup_at || '').slice(0,10)}
                            onChange={(e) => setContactDrafts(prev => ({
                              ...prev,
                              [business.id]: {
                                contact_status: prev[business.id]?.contact_status ?? business.contact_status,
                                next_followup_at: e.target.value ? new Date(e.target.value).toISOString() : undefined
                              }
                            }))}
                          />
                          <div className="flex items-center">
                            <Button
                              variant="secondary"
                              loading={savingContactId === business.id}
                              onClick={() => handleSaveContact(business)}
                              className="w-full !py-2 text-[12px]"
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="border border-gray-200 rounded-lg bg-white p-3">
                        <div className="text-[11px] uppercase tracking-[0.06em] text-gray-500 mb-2">Notes</div>
                        <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                          {editingNoteId === business.id ? (
                            <>
                              <textarea
                                className="w-full min-h-[96px] px-3 py-2 border border-gray-200 rounded-md text-[13px]"
                                value={noteDrafts[business.id] ?? business.notes ?? ''}
                                onChange={(e) => setNoteDrafts(prev => ({ ...prev, [business.id]: e.target.value }))}
                              />
                              <div className="mt-2 flex items-center gap-2">
                                <Button
                                  variant="primary"
                                  loading={savingNoteId === business.id}
                                  onClick={() => handleSaveNote(business)}
                                  className="!px-4 !py-2 text-[12px]"
                                >
                                  Save
                                </Button>
                                <Button
                                  variant="secondary"
                                  onClick={() => setEditingNoteId(null)}
                                  className="!px-4 !py-2 text-[12px]"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                {business.notes ? business.notes : <span className="text-gray-400 italic">No notes yet</span>}
                              </div>
                              <Button
                                variant="secondary"
                                onClick={() => {
                                  setEditingNoteId(business.id);
                                  setNoteDrafts(prev => ({ ...prev, [business.id]: business.notes || '' }));
                                }}
                                className="!px-3 !py-1.5 text-[12px]"
                              >
                                Edit
                              </Button>
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

          {selectedBusinesses.length > 0 && (
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-5 py-2.5 flex items-center justify-between">
              <div className="text-sm font-medium text-gray-800">{selectedBusinesses.length} selected</div>
              <button onClick={() => setSelectedBusinesses([])} className="text-sm text-primary-700 hover:underline">Clear selection</button>
            </div>
          )}
        </div>

        {businesses.length === 0 && !isLoading && (
          <div className="text-center py-16 px-4">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <Building className="w-10 h-10 text-gray-400" />
            </div>
            <div className="text-lg font-medium text-gray-900 mb-2">No businesses found</div>
            <div className="text-sm text-gray-500 mb-6">Try adjusting your filters or search criteria</div>
            <button 
              onClick={handleRefresh} 
              className="text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors duration-200 inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh data
            </button>
          </div>
        )}
        
        {isLoading && (
          <div className="text-center py-16 px-4">
            <div className="inline-block p-4">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
            <div className="text-lg text-gray-900 mt-4">Loading businesses...</div>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          disabled={isLoading || businessMutation.isPending}
        />
      </div>
      )}
        {/* Status update modal */}
        <Modal
          isOpen={statusModal.open}
          onClose={() => setStatusModal({ open: false, business: null, newStatus: null, note: '', saving: false })}
          title={statusModal.business ? `Update Status • ${statusModal.business.name}` : 'Update Status'}
          footer={(
            <>
              <Button
                variant="secondary"
                onClick={() => setStatusModal({ open: false, business: null, newStatus: null, note: '', saving: false })}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                loading={statusModal.saving}
                onClick={submitStatusModal}
                disabled={!statusModal.newStatus}
              >
                Save
              </Button>
            </>
          )}
          size="sm"
        >
          <div className="space-y-4">
            <div>
              <label className="block mb-1 text-[12px] text-gray-600">Status</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-[14px]"
                value={statusModal.newStatus || statusModal.business?.status || ''}
                onChange={(e) => setStatusModal(prev => ({ ...prev, newStatus: e.target.value as Business['status'] }))}
              >
                {statusOptions.slice(1).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 text-[12px] text-gray-600">Optional note</label>
              <textarea
                className="w-full min-h-[96px] px-3 py-2 border border-gray-200 rounded-md text-[14px]"
                placeholder="Add a note (optional)"
                value={statusModal.note}
                onChange={(e) => setStatusModal(prev => ({ ...prev, note: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      </div>
  );
};