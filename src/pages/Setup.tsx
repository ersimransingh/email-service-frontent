import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

const Setup = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  // Database Config
  const [server, setServer] = useState('');
  const [port, setPort] = useState<number>(1433);
  const [dbUser, setDbUser] = useState('');
  const [dbPassword, setDbPassword] = useState('');
  const [database, setDatabase] = useState('');

  // Email Config
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('22:00');
  const [interval, setInterval] = useState<number>(5);
  const [intervalUnit, setIntervalUnit] = useState<string>('minutes');
  const [dbRequestTimeout, setDbRequestTimeout] = useState<number>(30000);
  const [dbConnectionTimeout, setDbConnectionTimeout] = useState<number>(30000);

  const [connectionTested, setConnectionTested] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleTestConnection = async () => {
    setTestLoading(true);
    setMessage(null);

    try {
      const response = await apiService.testConnection({
        server,
        port,
        user: dbUser,
        password: dbPassword,
        database,
      });

      if (response.success) {
        setConnectionTested(true);
        setMessage({ type: 'success', text: 'Connection successful!' });
      } else {
        setConnectionTested(false);
        setMessage({ type: 'error', text: response.message || 'Connection failed' });
      }
    } catch (error: any) {
      setConnectionTested(false);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Connection test failed',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!connectionTested) {
      setMessage({ type: 'error', text: 'Please test the connection first' });
      return;
    }

    setSaveLoading(true);
    setMessage(null);

    try {
      // Save database config
      await apiService.saveDatabaseConfig({
        server,
        port,
        user: dbUser,
        password: dbPassword,
        database,
      });

      // Convert time format from HH:MM to HHMM
      const formatTime = (time: string) => time.replace(':', '');

      // Save email config
      await apiService.saveEmailConfig({
        start_time: formatTime(startTime),
        end_time: formatTime(endTime),
        interval,
        interval_unit: intervalUnit,
        db_request_timeout: dbRequestTimeout,
        db_connection_timeout: dbConnectionTimeout,
        username: user?.username || 'admin',
        password: dbPassword,
      });

      setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save configuration',
      });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 shadow">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Email Service Setup</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200'
                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Database Config Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Database Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Server</label>
              <input
                type="text"
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">DB User</label>
              <input
                type="text"
                value={dbUser}
                onChange={(e) => setDbUser(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                DB User Password
              </label>
              <input
                type="password"
                value={dbPassword}
                onChange={(e) => setDbPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Database</label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Email Config Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Email Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Interval</label>
              <input
                type="number"
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Interval Unit</label>
              <select
                value={intervalUnit}
                onChange={(e) => setIntervalUnit(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                DB Request Timeout
              </label>
              <input
                type="number"
                value={dbRequestTimeout}
                onChange={(e) => setDbRequestTimeout(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                DB Connection Timeout
              </label>
              <input
                type="number"
                value={dbConnectionTimeout}
                onChange={(e) => setDbConnectionTimeout(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleTestConnection}
            disabled={testLoading}
            className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {testLoading ? 'Testing...' : 'Test Connection'}
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={!connectionTested || saveLoading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {saveLoading ? 'Saving...' : 'Save Config'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Setup;
