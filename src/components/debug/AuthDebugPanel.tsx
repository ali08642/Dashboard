import React, { useState } from 'react';
import { Button } from '../common/Button';
import { AlertCircle, CheckCircle, XCircle, Settings } from 'lucide-react';

export const AuthDebugPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuthSettings = async () => {
    setLoading(true);
    setTestResults(null);

    try {
      const { supabase } = await import('../../utils/supabase');
      
      // Test 1: Check if we can connect to Supabase
      const connectionTest = await supabase.from('admins').select('count', { count: 'exact' });
      
      // Test 2: Try a test signup to see what happens
      const testEmail = `test-${Date.now()}@demo.com`;
      const testPassword = 'test123456';
      
      console.log('Testing signup with:', testEmail);
      const signupResult = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
      });

      // Test 3: Try to login immediately (this will fail if email confirmation is required)
      let loginResult = null;
      if (signupResult.data.user && !signupResult.error) {
        console.log('Testing immediate login...');
        loginResult = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });
      }

      setTestResults({
        connection: {
          success: !connectionTest.error,
          error: connectionTest.error?.message,
          adminCount: connectionTest.count
        },
        signup: {
          success: !signupResult.error,
          error: signupResult.error?.message,
          userCreated: !!signupResult.data.user,
          emailConfirmed: signupResult.data.user?.email_confirmed_at,
          userId: signupResult.data.user?.id
        },
        login: loginResult ? {
          success: !loginResult.error,
          error: loginResult.error?.message,
          canLoginImmediately: !loginResult.error
        } : null
      });

      // Cleanup: Delete the test user if possible
      if (signupResult.data.user?.id) {
        try {
          await supabase.auth.admin.deleteUser(signupResult.data.user.id);
          console.log('Cleaned up test user');
        } catch (cleanupError) {
          console.log('Could not cleanup test user (this is normal)');
        }
      }

    } catch (error) {
      setTestResults({
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Auth Debug Panel</h3>
      </div>

      <div className="mb-4">
        <Button
          onClick={testAuthSettings}
          loading={loading}
          disabled={loading}
          className="w-full"
          variant="outline"
        >
          {loading ? 'Testing Auth Settings...' : 'Test Auth Configuration'}
        </Button>
      </div>

      {testResults && (
        <div className="space-y-4">
          {testResults.error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Test Failed</span>
              </div>
              <p className="text-red-700 text-sm">{testResults.error}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Connection Test */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.connection.success)}
                  <span className="font-medium">Database Connection</span>
                </div>
                <span className="text-sm text-gray-600">
                  {testResults.connection.success ? 
                    `✓ Connected (${testResults.connection.adminCount} admins)` : 
                    `✗ ${testResults.connection.error}`
                  }
                </span>
              </div>

              {/* Signup Test */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                <div className="flex items-center gap-2">
                  {getStatusIcon(testResults.signup.success)}
                  <span className="font-medium">Signup Test</span>
                </div>
                <span className="text-sm text-gray-600">
                  {testResults.signup.success ? 
                    `✓ User created ${testResults.signup.emailConfirmed ? '(confirmed)' : '(unconfirmed)'}` : 
                    `✗ ${testResults.signup.error}`
                  }
                </span>
              </div>

              {/* Login Test */}
              {testResults.login && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.login.success)}
                    <span className="font-medium">Immediate Login Test</span>
                  </div>
                  <span className="text-sm text-gray-600">
                    {testResults.login.success ? 
                      '✓ Can login immediately' : 
                      `✗ ${testResults.login.error}`
                    }
                  </span>
                </div>
              )}

              {/* Recommendations */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {!testResults.login?.success && (
                        <li>• Disable "Enable email confirmations" in Supabase Authentication settings for demo mode</li>
                      )}
                      {testResults.connection.adminCount === 0 && (
                        <li>• Run the database migration SQL to update your admin table structure</li>
                      )}
                      {testResults.signup.success && testResults.login?.success && (
                        <li>• ✅ Your auth configuration is working correctly for demo mode!</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        This panel tests your Supabase auth configuration by creating a temporary test user.
      </div>
    </div>
  );
};
