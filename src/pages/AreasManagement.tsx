import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Building2, Target, Calendar } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable } from '../components/tables/DataTable';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { areaApi, cityApi } from '../utils/api';
import type { Area } from '../utils/types';

export const AreasManagement: React.FC = () => {
  const { state, dispatch, showNotification, hideNotification } = useApp();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deletingArea, setDeletingArea] = useState<Area | null>(null);
  const [formData, setFormData] = useState({ name: '', city_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [areas, cities] = await Promise.all([
        areaApi.getAll(),
        cityApi.getAll()
      ]);
      dispatch({ type: 'SET_ALL_AREAS', payload: areas });
      dispatch({ type: 'SET_ALL_CITIES', payload: cities });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAreas = state.allAreas.filter(area => {
    const matchesSearch = area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (area.cities?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = !cityFilter || area.city_id.toString() === cityFilter;
    return matchesSearch && matchesCity;
  });

  const handleAdd = () => {
    setEditingArea(null);
    setFormData({ name: '', city_id: '' });
    setIsEditModalOpen(true);
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setFormData({ name: area.name, city_id: area.city_id.toString() });
    setIsEditModalOpen(true);
  };

  const handleDelete = (area: Area) => {
    setDeletingArea(area);
    setIsConfirmModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.city_id) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingArea) {
        await areaApi.update(editingArea.id, {
          name: formData.name.trim(),
          city_id: parseInt(formData.city_id)
        });
        showNotification('success', 'Area Updated', 'Operation completed', 'Area updated successfully.');
      } else {
        await areaApi.create({
          name: formData.name.trim(),
          city_id: parseInt(formData.city_id)
        });
        showNotification('success', 'Area Added', 'Operation completed', 'Area added successfully.');
      }

      setIsEditModalOpen(false);
      loadData();
      setTimeout(hideNotification, 2000);
    } catch (error: any) {
      alert('Error saving area: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingArea) return;

    try {
      await areaApi.delete(deletingArea.id);
      setIsConfirmModalOpen(false);
      loadData();
      showNotification('success', 'Area Deleted', 'Operation completed', 'Area deleted successfully.');
      setTimeout(hideNotification, 2000);
    } catch (error: any) {
      alert('Error deleting area: ' + error.message);
    }
  };



  const cityOptions = [
    { value: '', label: 'All Cities' },
    ...state.allCities.map(city => ({
      value: city.id.toString(),
      label: `${city.name} (${city.countries?.name || 'Unknown'})`
    }))
  ];

  const cityFormOptions = [
    { value: '', label: 'Select City' },
    ...state.allCities.map(city => ({
      value: city.id.toString(),
      label: `${city.name} (${city.countries?.name || 'Unknown'})`
    }))
  ];

  const columns = [
    {
      key: 'id',
      title: 'ID',
      width: '80px',
      render: (value: number) => <strong className="text-gray-900">{value}</strong>
    },
    {
      key: 'name',
      title: 'Name',
      render: (value: string) => (
        <div className="font-semibold text-gray-900">{value}</div>
      )
    },
    {
      key: 'cities',
      title: 'City',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{value?.name || 'Unknown'}</span>
        </div>
      )
    },
    {
      key: 'cities',
      title: 'Country',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{value?.countries?.name || 'Unknown'}</span>
        </div>
      )
    },
    {
      key: 'last_scraped_at',
      title: 'Last Scraped',
      render: (value: string) => value ? (
        <div className="flex items-center gap-2 text-green-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">{new Date(value).toLocaleDateString()}</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
          <span className="text-sm">Never</span>
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (value: string) => (
        <div className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '180px',
      render: (_: any, record: Area) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => handleEdit(record)}
            className="px-3 py-2 text-sm"
            icon={<Edit2 className="w-4 h-4" />}
          >
            Edit
          </Button>
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
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-white to-gray-50/50 backdrop-blur-xl rounded-3xl border border-gray-200/60 shadow-lg overflow-hidden">
        <div className="p-8 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                Areas Database Management
              </h1>
              <p className="text-lg text-gray-600">
                Manage business areas and their scraping status for lead generation
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleAdd}
              icon={<Plus className="w-4 h-4" />}
              className="px-6 py-3"
            >
              Add Area
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="p-8 bg-white border-t border-gray-200/60">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Input
              placeholder="Search areas by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<MapPin className="w-4 h-4" />}
              className="w-full"
            />
            <Select
              options={cityOptions}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Data Table */}
      <div className="surface overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredAreas}
          loading={loading}
          emptyText="No areas found"
        />
      </div>

      {/* Enhanced Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingArea ? 'Edit Area' : 'Add New Area'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving} className="px-6 py-3">
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-2xl p-6">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              Area Information
            </h4>
            <div className="text-sm text-blue-800">
              Enter the area details below. The area will be associated with the selected city for business lead generation.
            </div>
          </div>

          <div className="space-y-6">
            <Input
              label="Area Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter area name"
              className="w-full"
            />
            <Select
              label="City"
              options={cityFormOptions}
              value={formData.city_id}
              onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
              className="w-full"
            />
          </div>
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
              Delete
            </Button>
          </>
        }
      >
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Area?</h3>
          <p className="text-gray-600 leading-relaxed">
            Are you sure you want to delete <strong>"{deletingArea?.name}"</strong>? 
            This action cannot be undone.
          </p>
        </div>
      </Modal>


    </div>
  );
};