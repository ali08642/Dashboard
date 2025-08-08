import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
      render: (value: number) => <strong>{value}</strong>
    },
    {
      key: 'name',
      title: 'Name'
    },
    {
      key: 'countries',
      title: 'Country',
      render: (value: any) => value?.name || 'Unknown'
    },
    {
      key: 'areas_count',
      title: 'Areas Count',
      render: (value: number) => value || 0
    },
    {
      key: 'areas_populated',
      title: 'Areas Populated',
      render: (value: boolean) => value ? (
        <span className="text-[#34c759]">✓ Yes</span>
      ) : (
        <span className="text-[#ff3b30]">✗ No</span>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: 'actions',
      title: 'Actions',
      width: '160px',
      render: (_: any, record: City) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => handleEdit(record)}
            className="px-3 py-1.5 text-xs"
            icon={<Edit2 className="w-3 h-3" />}
          >
            Edit
          </Button>
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

  return (
    <div>
      <div className="bg-[rgba(255,255,255,0.72)] backdrop-blur-md rounded-2xl border border-[rgba(0,0,0,0.08)] shadow-[0_2px_15px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="flex justify-between items-center p-7 border-b border-[rgba(0,0,0,0.08)]">
          <h3 className="text-xl font-semibold text-[#1d1d1f] tracking-[-0.025em]">
            Cities Database Management
          </h3>
          <Button
            variant="primary"
            onClick={handleAdd}
            icon={<Plus className="w-4 h-4" />}
          >
            Add City
          </Button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              placeholder="Search cities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              options={countryOptions}
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredCities}
            loading={loading}
            emptyText="No cities found"
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingCity ? 'Edit City' : 'Add New City'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="City Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter city name"
          />
          <Select
            label="Country"
            options={countryFormOptions}
            value={formData.country_id}
            onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
          />
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
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed">
          Are you sure you want to delete "{deletingCity?.name}"? This will also delete all associated areas.
        </p>
      </Modal>
    </div>
  );
};