import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';

interface DashboardData {
  database: {
    connected: boolean;
    server: string;
    database: string;
    last_checked: string;
    response_time: number;
    message?: string;
  };
  schedule: {
    start_time: string;
    end_time: string;
    interval: number;
    interval_unit: string;
    is_active: boolean;
    within_schedule: boolean;
    next_run: string | null;
  };
  service: {
    status: string;
    started_at: string;
    last_activity: string;
    next_run: string;
    is_processing: boolean;
    email_stats: {
      total_processed: number;
      total_sent: number;
      total_failed: number;
      pending_count: number;
    };
  };
}

interface CertificateStatus {
  success: boolean;
  available: boolean;
  token_present: boolean;
  certificate_found: boolean;
  token_label: string | null;
  slot_id: number | null;
  certificate_id: string | null;
  certificate_subject: string | null;
  certificate_not_valid_before: string | null;
  certificate_not_valid_after: string | null;
  library_path: string;
  error?: string;
}

interface ConfigData {
  success: boolean;
  config: {
    database: {
      exists: boolean;
      config: {
        server: string;
        port: number;
        user: string;
        password: string;
        database: string;
      };
    };
    email: {
      exists: boolean;
      config: {
        start_time: string;
        end_time: string;
        interval: number;
        interval_unit: string;
        db_request_timeout: number;
        db_connection_timeout: number;
        username: string;
        password: string;
      };
    };
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { logout, user } = useAuth();

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [certificateStatus, setCertificateStatus] = useState<CertificateStatus | null>(null);
  const [configData, setConfigData] = useState<ConfigData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [dashboard, certificate] = await Promise.all([
        apiService.getDashboard(),
        apiService.getCertificateStatus(),
      ]);

      setDashboardData(dashboard);
      setCertificateStatus(certificate);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to fetch dashboard data',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const config = await apiService.getCurrentConfig();
      setConfigData(config);
    } catch (error: any) {
      console.error('Error fetching config:', error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleServiceControl = async (action: 'start' | 'stop') => {
    setActionLoading(true);
    setMessage(null);

    try {
      const response = await apiService.serviceControl(action, user?.username || 'admin');
      if (response.success) {
        setMessage({ type: 'success', text: response.message });
        await fetchData();
      } else {
        setMessage({ type: 'error', text: response.message || `Failed to ${action} service` });
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || `Failed to ${action} service`,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditConfig = async () => {
    await fetchConfig();
    setShowConfigModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Email Service Dashboard
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleEditConfig}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Edit Config
            </button>
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
      </div>

      <div className="max-w-7xl mx-auto p-6">
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

        {/* Service Control */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Service Control
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                Status:{' '}
                <span
                  className={`font-semibold ${
                    dashboardData?.service.status === 'running'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {dashboardData?.service.status}
                </span>
              </p>
              {dashboardData?.service.started_at && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Started: {moment(dashboardData.service.started_at).format('LLL')}
                </p>
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => handleServiceControl('start')}
                disabled={
                  dashboardData?.service.status === 'running' || actionLoading
                }
                className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                Start
              </button>
              <button
                onClick={() => handleServiceControl('stop')}
                disabled={
                  dashboardData?.service.status !== 'running' || actionLoading
                }
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
              >
                Stop
              </button>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Total Processed
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {dashboardData?.service.email_stats.total_processed || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Total Sent
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {dashboardData?.service.email_stats.total_sent || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Total Failed
            </h3>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {dashboardData?.service.email_stats.total_failed || 0}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Pending
            </h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {dashboardData?.service.email_stats.pending_count || 0}
            </p>
          </div>
        </div>

        {/* Database Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Database Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                Connection:{' '}
                <span
                  className={`font-semibold ${
                    dashboardData?.database.connected
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {dashboardData?.database.connected ? 'Connected' : 'Disconnected'}
                </span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Server: {dashboardData?.database.server}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Database: {dashboardData?.database.database}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last Checked:{' '}
                {dashboardData?.database.last_checked
                  ? moment(dashboardData.database.last_checked).format('LLL')
                  : 'N/A'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Response Time: {dashboardData?.database.response_time}ms
              </p>
            </div>
          </div>
          {dashboardData?.database.message && !dashboardData?.database.connected && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
              {dashboardData.database.message}
            </div>
          )}
        </div>

        {/* Schedule Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Schedule Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                Active Time: {dashboardData?.schedule.start_time} -{' '}
                {dashboardData?.schedule.end_time}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Interval: {dashboardData?.schedule.interval}{' '}
                {dashboardData?.schedule.interval_unit}
              </p>
            </div>
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                Within Schedule:{' '}
                <span
                  className={`font-semibold ${
                    dashboardData?.schedule.within_schedule
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {dashboardData?.schedule.within_schedule ? 'Yes' : 'No'}
                </span>
              </p>
              {dashboardData?.service.next_run && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Next Run: {moment(dashboardData.service.next_run).format('LLL')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Certificate Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            USB Certificate Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-700 dark:text-gray-300">
                Available:{' '}
                <span
                  className={`font-semibold ${
                    certificateStatus?.available
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {certificateStatus?.available ? 'Yes' : 'No'}
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Token Present:{' '}
                <span
                  className={`font-semibold ${
                    certificateStatus?.token_present
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {certificateStatus?.token_present ? 'Yes' : 'No'}
                </span>
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                Certificate Found:{' '}
                <span
                  className={`font-semibold ${
                    certificateStatus?.certificate_found
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {certificateStatus?.certificate_found ? 'Yes' : 'No'}
                </span>
              </p>
            </div>
            <div>
              {certificateStatus?.token_label && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Token Label: {certificateStatus.token_label}
                </p>
              )}
              {certificateStatus?.certificate_subject && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Subject: {certificateStatus.certificate_subject}
                </p>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Library: {certificateStatus?.library_path}
              </p>
            </div>
          </div>
          {certificateStatus?.error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
              {certificateStatus.error}
            </div>
          )}
        </div>
      </div>

      {/* Config Modal */}
      {showConfigModal && configData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Current Configuration
                </h2>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Database Configuration
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded space-y-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    Server: {configData.config.database.config.server}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Port: {configData.config.database.config.port}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    User: {configData.config.database.config.user}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Database: {configData.config.database.config.database}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                  Email Configuration
                </h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded space-y-2">
                  <p className="text-gray-700 dark:text-gray-300">
                    Start Time: {configData.config.email.config.start_time}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    End Time: {configData.config.email.config.end_time}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Interval: {configData.config.email.config.interval}{' '}
                    {configData.config.email.config.interval_unit}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    DB Request Timeout: {configData.config.email.config.db_request_timeout}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    DB Connection Timeout:{' '}
                    {configData.config.email.config.db_connection_timeout}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowConfigModal(false);
                    navigate('/setup');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Edit Configuration
                </button>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
