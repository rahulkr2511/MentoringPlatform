// API Base URL
const API_BASE_URL = 'http://localhost:8080/monitoringPlatform';

// Types for API responses
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface SignupRequest {
  username: string;
  email: string;
  password: string;
}

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponseData {
  token: string;
  username: string;
  email: string;
  roles: string[];
}

interface LoginResponse {
  success: boolean;
  data: LoginResponseData;
  message: string;
  error: string | null;
}

// Helper function for API calls
const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'An error occurred',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
};

// Authentication Services
export const AuthService = {
  // Signup user
  signup: async (userData: SignupRequest): Promise<ApiResponse<any>> => {
    return apiCall<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponseData>> => {
    return apiCall<LoginResponseData>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
};

// Export default
export default {
  AuthService,
}; 