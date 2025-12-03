import { dashboardAPI, api } from './api';

export const dashboardService = {
  // Load complete dashboard data
  loadDashboard: async () => {
    try {
      console.log('🔄 Loading dashboard data...');
      
      // Test connection first
      const connectionOk = await api.testConnection();
      if (!connectionOk) {
        throw new Error('Cannot connect to server');
      }
      
      // Test authentication
      const authOk = await api.testAuth();
      if (!authOk) {
        throw new Error('Authentication failed');
      }
      
      // Load dashboard summary
      const summary = await dashboardAPI.getSummary();
      console.log('✅ Dashboard data loaded successfully');
      return summary;
      
    } catch (error) {
      console.error('❌ Dashboard loading failed:', error);
      throw error;
    }
  },

  // Load quick stats for dashboard cards
  loadQuickStats: async () => {
    try {
      return await dashboardAPI.getQuickStats();
    } catch (error) {
      console.error('❌ Quick stats loading failed:', error);
      throw error;
    }
  },

  // Debug all endpoints
  debugAllEndpoints: async () => {
    try {
      const results = await api.debugEndpoints();
      console.log('🔧 Debug Results:', results);
      return results;
    } catch (error) {
      console.error('❌ Debug failed:', error);
      throw error;
    }
  }
};

export default dashboardService;