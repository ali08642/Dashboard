import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { AuthDebugPanel } from '../components/debug/AuthDebugPanel';
import { ArrowLeft, UserPlus, Bug } from 'lucide-react';

export const Signup: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user starts typing
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    console.log('Signup form submitted');

    try {
      const { authApi } = await import('../utils/api');
      await authApi.signup(formData.name, formData.email, formData.password);
      
      // Success - navigate to login with success message
      navigate('/login', { 
        state: { 
          message: 'Account created successfully! Please log in with your credentials.',
          type: 'success'
        }
      });
    } catch (err) {
      console.error('Signup error:', err);
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join the Lead Generation Dashboard
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your full name"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Create a password (min. 6 characters)"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              disabled={loading}
              className="w-full flex justify-center py-3 px-4"
              icon={<UserPlus className="w-4 h-4" />}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 transition-colors duration-200"
                disabled={loading}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </div>
        </form>

        <div className="text-center space-y-4">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
          
          {/* Debug Panel Toggle */}
          <button
            type="button"
            onClick={() => setShowDebugPanel(!showDebugPanel)}
            className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Bug className="w-3 h-3" />
            {showDebugPanel ? 'Hide' : 'Show'} Debug Panel
          </button>
        </div>

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mt-6">
            <AuthDebugPanel />
          </div>
        )}
      </div>
    </div>
  );
};
