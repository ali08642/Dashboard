import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
      render: (value: number) => <strong>{value}</strong>
    },
    {
      key: 'name',
      title: 'Name'
    },
    {
      key: 'cities',
      title: 'City',
      render: (value: any) => value?.name || 'Unknown'
    },
    {
      key: 'cities',
      title: 'Country',
      render: (value: any) => value?.countries?.name || 'Unknown'
    },
    {
      key: 'last_scraped_at',
      title: 'Last Scraped',
      render: (value: string) => value ? 
        new Date(value).toLocaleDateString() : 
        <span className="text-[#86868b]">Never</span>
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
      render: (_: any, record: Area) => (
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
            Areas Database Management
          </h3>
          <Button
            variant="primary"
            onClick={handleAdd}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Area
          </Button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Input
              placeholder="Search areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              options={cityOptions}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredAreas}
            loading={loading}
            emptyText="No areas found"
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingArea ? 'Edit Area' : 'Add New Area'}
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
            label="Area Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter area name"
          />
          <Select
            label="City"
            options={cityFormOptions}
            value={formData.city_id}
            onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
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
          Are you sure you want to delete "{deletingArea?.name}"?
        </p>
      </Modal>
    </div>
  );
};