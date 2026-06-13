// Proxy file redirects legacy calls to our clean core/apiClient implementation
export {
  API_BASE_URL,
  getAuthToken,
  apiRequest,
  api
} from '../core/apiClient';
