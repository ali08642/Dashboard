import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable } from '../components/tables/DataTable';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { countryApi } from '../utils/api';
import type { Country } from '../utils/types';

export const CountriesManagement: React.FC = () => {
  const { state, dispatch, showNotification, hideNotification } = useApp();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [deletingCountry, setDeleteingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({ name: '', iso_code: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCountries();
  }, []);

  const loadCountries = async () => {
    setLoading(true);
    try {
      const countries = await countryApi.getAll();
      dispatch({ type: 'SET_ALL_COUNTRIES', payload: countries });
    } catch (error) {
      console.error('Failed to load countries:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCountries = state.allCountries.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.iso_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingCountry(null);
    setFormData({ name: '', iso_code: '' });
    setIsEditModalOpen(true);
  };

  const handleEdit = (country: Country) => {
    setEditingCountry(country);
    setFormData({ name: country.name, iso_code: country.iso_code });
    setIsEditModalOpen(true);
  };

  const handleDelete = (country: Country) => {
    setDeleteingCountry(country);
    setIsConfirmModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.iso_code.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      if (editingCountry) {
        await countryApi.update(editingCountry.id, {
          name: formData.name.trim(),
          iso_code: formData.iso_code.trim().toUpperCase()
        });
        showNotification('success', 'Country Updated', 'Operation completed', 'Country updated successfully.');
      } else {
        await countryApi.create({
          name: formData.name.trim(),
          iso_code: formData.iso_code.trim().toUpperCase()
        });
        showNotification('success', 'Country Added', 'Operation completed', 'Country added successfully.');
      }

      setIsEditModalOpen(false);
      loadCountries();
      setTimeout(hideNotification, 2000);
    } catch (error: any) {
      alert('Error saving country: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCountry) return;

    try {
      await countryApi.delete(deletingCountry.id);
      setIsConfirmModalOpen(false);
      loadCountries();
      showNotification('success', 'Country Deleted', 'Operation completed', 'Country deleted successfully.');
      setTimeout(hideNotification, 2000);
    } catch (error: any) {
      alert('Error deleting country: ' + error.message);
    }
  };

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
      key: 'iso_code',
      title: 'ISO Code',
      render: (value: string) => (
        <span className="bg-[rgba(0,0,0,0.06)] px-2 py-1 rounded-md font-mono text-xs">
          {value}
        </span>
      )
    },
    {
      key: 'cities_count',
      title: 'Cities Count',
      render: (value: number) => value || 0
    },
    {
      key: 'cities_populated',
      title: 'Cities Populated',
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
      render: (_: any, record: Country) => (
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
            Countries Database Management
          </h3>
          <Button
            variant="primary"
            onClick={handleAdd}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Country
          </Button>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <Input
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <DataTable
            columns={columns}
            data={filteredCountries}
            loading={loading}
            emptyText="No countries found"
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingCountry ? 'Edit Country' : 'Add New Country'}
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
            label="Country Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter country name"
          />
          <Input
            label="ISO Code"
            value={formData.iso_code}
            onChange={(e) => setFormData({ ...formData, iso_code: e.target.value.toUpperCase() })}
            placeholder="e.g., US, GB, PK"
            maxLength={2}
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
          Are you sure you want to delete "{deletingCountry?.name}"? This will also delete all associated cities and areas.
        </p>
      </Modal>
    </div>
  );
};