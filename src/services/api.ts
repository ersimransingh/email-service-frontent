import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async authenticate(username: string, password: string) {
    const response = await this.api.post('/authenticate', { username, password });
    return response.data;
  }

  // Verify token
  async verifyToken() {
    const response = await this.api.get('/authenticate');
    return response.data;
  }

  // Check email config
  async checkEmailConfig() {
    const response = await this.api.get('/check-email-config');
    return response.data;
  }

  // Test database connection
  async testConnection(data: {
    server: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    const response = await this.api.post('/test-connection', data);
    return response.data;
  }

  // Save email config
  async saveEmailConfig(data: {
    start_time: string;
    end_time: string;
    interval: number;
    interval_unit: string;
    db_request_timeout: number;
    db_connection_timeout: number;
    username: string;
    password: string;
  }) {
    const response = await this.api.post('/save-email-config', data);
    return response.data;
  }

  // Save database config
  async saveDatabaseConfig(data: {
    server: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    const response = await this.api.post('/save-config', data);
    return response.data;
  }

  // Get current config
  async getCurrentConfig() {
    const response = await this.api.get('/get-current-config');
    return response.data;
  }

  // Get dashboard data
  async getDashboard() {
    const response = await this.api.get('/dashboard');
    return response.data;
  }

  // Service control (start/stop)
  async serviceControl(action: 'start' | 'stop', user: string) {
    const response = await this.api.post('/service-control', { action, user });
    return response.data;
  }

  // Get certificate status
  async getCertificateStatus() {
    const response = await this.api.get('/certificate-status');
    return response.data;
  }
}

export default new ApiService();
