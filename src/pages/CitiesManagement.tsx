import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Building2, MapPin, Users, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable } from '../components/tables/DataTable';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { cityApi, countryApi } from '../utils/api';
import type { City } from '../utils/types';

export const CitiesManagement: React.FC = () => {
  const { state, dispatch, showNotification, hideNotification } = useApp();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [deletingCity, setDeletingCity] = useState<City | null>(null);
  const [formData, setFormData] = useState({ name: '', country_id: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cities, countries] = await Promise.all([
        cityApi.getAll(),
        countryApi.getAll()
      ]);
      dispatch({ type: 'SET_ALL_CITIES', payload: cities });
      dispatch({ type: 'SET_ALL_COUNTRIES', payload: countries });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCities = state.allCities.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (city.countries?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = !countryFilter || city.country_id.toString() === countryFilter;
    return matchesSearch && matchesCountry;
  });

  const handleAdd = () => {
    setEditingCity(null);
    setFormData({ name: '', country_id: '' });
    setIsEditModalOpen(true);
  };

  const handleEdit = (city: City) => {
    setEditingCity(city);
    setFormData({ name: city.name, country_id: city.country_id.toString() });
    setIsEditModalOpen(true);
  };

  const handleDelete = (city: City) => {
    setDeletingCity(city);
    setIsConfirmModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.country_id) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingCity) {
        await cityApi.update(editingCity.id, {
          name: formData.name.trim(),
          country_id: parseInt(formData.country_id)
        });
        showNotification('success', 'City Updated', 'Operation completed', 'City updated successfully.');
      } else {
        await cityApi.create({
          name: formData.name.trim(),
          country_id: parseInt(formData.country_id)
        });
        showNotification('success', 'City Added', 'Operation completed', 'City added successfully.');
      }

      setIsEditModalOpen(false);
      loadData();
      setTimeout(hideNotification, 2000);
    } catch (error: any) {
      alert('Error saving city: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCity) return;

    try {
      await cityApi.delete(deletingCity.id);
      setIsConfirmModalOpen(false);
      loadData();
      showNotification('success', 'City Deleted', 'Operation completed', 'City deleted successfully.');
      setTimeout(hideNotification, 2000);
    } catch (error: any) {
      alert('Error deleting city: ' + error.message);
    }
  };

  const countryOptions = [
    { value: '', label: 'All Countries' },
    ...state.allCountries.map(country => ({
      value: country.id.toString(),
      label: country.name
    }))
  ];

  const countryFormOptions = [
    { value: '', label: 'Select Country' },
    ...state.allCountries.map(country => ({
      value: country.id.toString(),
      label: country.name
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
      key: 'countries',
      title: 'Country',
      render: (value: any) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-gray-700">{value?.name || 'Unknown'}</span>
        </div>
      )
    },
    {
      key: 'areas_count',
      title: 'Areas Count',
      render: (value: number) => (
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{value || 0}</div>
          <div className="text-xs text-gray-500">areas</div>
        </div>
      )
    },
    {
      key: 'areas_populated',
      title: 'Areas Populated',
      render: (value: boolean) => value ? (
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="font-semibold text-sm">Yes</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-600">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="font-semibold text-sm">No</span>
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
      render: (_: any, record: City) => (
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
                Cities Database Management
              </h1>
              <p className="text-lg text-gray-600">
                Manage cities and their business areas for lead generation
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleAdd}
              icon={<Plus className="w-4 h-4" />}
              className="px-6 py-3"
            >
              Add City
            </Button>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="p-8 bg-white border-t border-gray-200/60">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Input
              placeholder="Search cities by name or country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              icon={<Building2 className="w-4 h-4" />}
              className="w-full"
            />
            <Select
              options={countryOptions}
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Enhanced Data Table */}
      <div className="surface overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredCities}
          loading={loading}
          emptyText="No cities found"
        />
      </div>

      {/* Enhanced Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingCity ? 'Edit City' : 'Add New City'}
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
              <Building2 className="w-5 h-5 text-blue-600" />
              City Information
            </h4>
            <div className="text-sm text-blue-800">
              Enter the city details below. The city will be associated with the selected country.
            </div>
          </div>

          <div className="space-y-6">
            <Input
              label="City Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter city name"
              className="w-full"
            />
            <Select
              label="Country"
              options={countryFormOptions}
              value={formData.country_id}
              onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete City?</h3>
          <p className="text-gray-600 leading-relaxed">
            Are you sure you want to delete <strong>"{deletingCity?.name}"</strong>? 
            This will also delete all associated areas. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};