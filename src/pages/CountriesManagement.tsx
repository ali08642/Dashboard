import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Globe, Users, Target } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DataTable } from '../components/tables/DataTable';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { useCountries, useCountryMutation } from '../hooks/useOptimizedQuery';
import type { Country } from '../utils/types';

export const CountriesManagement: React.FC = () => {
  const { showNotification, hideNotification } = useApp();
  const { data: countries = [], isLoading, error } = useCountries();
  const countryMutation = useCountryMutation();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [deletingCountry, setDeleteingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({ name: '', iso_code: '' });

  const filteredCountries = useMemo(() => 
    countries.filter(country =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.iso_code.toLowerCase().includes(searchTerm.toLowerCase())
    ), [countries, searchTerm]
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

    try {
      if (editingCountry) {
        await countryMutation.mutateAsync({
          type: 'update',
          id: editingCountry.id,
          payload: {
            name: formData.name.trim(),
            iso_code: formData.iso_code.trim().toUpperCase()
          }
        });
        showNotification('success', 'Country Updated', 'Operation completed', 'Country updated successfully.');
      } else {
        await countryMutation.mutateAsync({
          type: 'create',
          payload: {
            name: formData.name.trim(),
            iso_code: formData.iso_code.trim().toUpperCase()
          }
        });
        showNotification('success', 'Country Added', 'Operation completed', 'Country added successfully.');
      }

      setIsEditModalOpen(false);
      setTimeout(hideNotification, 2000);
    } catch (error: any) {
      alert('Error saving country: ' + error.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingCountry) return;

    try {
      await countryMutation.mutateAsync({
        type: 'delete',
        id: deletingCountry.id
      });
      setIsConfirmModalOpen(false);
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
      key: 'iso_code',
      title: 'ISO Code',
      render: (value: string) => (
        <span className="bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-3 py-1.5 rounded-lg font-mono text-sm font-semibold border border-blue-200">
          {value}
        </span>
      )
    },
    {
      key: 'cities_count',
      title: 'Cities Count',
      render: (value: number) => (
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{value || 0}</div>
          <div className="text-xs text-gray-500">cities</div>
        </div>
      )
    },
    {
      key: 'cities_populated',
      title: 'Cities Populated',
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
      render: (_: any, record: Country) => (
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
                Countries Database Management
              </h1>
              <p className="text-lg text-gray-600">
                Manage countries and their geographical data for lead generation
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleAdd}
              icon={<Plus className="w-4 h-4" />}
              className="px-6 py-3"
            >
              Add Country
            </Button>
          </div>
        </div>

        {/* Enhanced Search */}
        <div className="p-8 bg-white border-t border-gray-200/60">
          <Input
            placeholder="Search countries by name or ISO code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Globe className="w-4 h-4" />}
            className="w-full"
          />
        </div>
      </div>

      {/* Enhanced Data Table */}
      <div className="surface overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredCountries}
          loading={isLoading}
          emptyText="No countries found"
        />
      </div>

      {/* Enhanced Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={editingCountry ? 'Edit Country' : 'Add New Country'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3">
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave} loading={countryMutation.isPending} className="px-6 py-3">
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-2xl p-6">
            <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Country Information
            </h4>
            <div className="text-sm text-blue-800">
              Enter the country details below. The ISO code should be a 2-letter country code (e.g., US, GB, PK).
            </div>
          </div>

          <div className="space-y-6">
            <Input
              label="Country Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter country name"
              className="w-full"
            />
            <Input
              label="ISO Code"
              value={formData.iso_code}
              onChange={(e) => setFormData({ ...formData, iso_code: e.target.value.toUpperCase() })}
              placeholder="e.g., US, GB, PK"
              maxLength={2}
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Country?</h3>
          <p className="text-gray-600 leading-relaxed">
            Are you sure you want to delete <strong>"{deletingCountry?.name}"</strong>? 
            This will also delete all associated cities and areas. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
};