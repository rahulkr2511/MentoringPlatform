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

interface SignupResponseData {
  username: string;
  email: string;
  message: string;
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

interface UserResponseData {
  token: string | null;
  username: string;
  email: string;
  roles: string[];
}

// Error types
interface ValidationErrors {
  [key: string]: string;
}

interface ErrorResponse {
  success: false;
  data?: ValidationErrors;
  message?: string;
  error: string;
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

    // The server now always returns the standardized ApiResponse structure
    return data;
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
  signup: async (userData: SignupRequest): Promise<ApiResponse<SignupResponseData>> => {
    return apiCall<SignupResponseData>('/auth/signup', {
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

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<UserResponseData>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<UserResponseData>('/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Logout user
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('token');
    return !!token;
  },

  // Get stored user data
  getStoredUser: (): any => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};

// Error handling utilities
export const ErrorHandler = {
  // Get user-friendly error message based on error code
  getErrorMessage: (errorCode: string, defaultMessage: string = 'An error occurred'): string => {
    const errorMessages: { [key: string]: string } = {
      'INVALID_CREDENTIALS': 'Invalid username or password',
      'USER_NOT_FOUND': 'User not found',
      'USERNAME_EXISTS': 'Username already exists',
      'EMAIL_EXISTS': 'Email already exists',
      'VALIDATION_ERROR': 'Please check your input and try again',
      'INTERNAL_SERVER_ERROR': 'An unexpected error occurred. Please try again later.',
    };

    return errorMessages[errorCode] || defaultMessage;
  },

  // Handle validation errors
  handleValidationErrors: (data: ValidationErrors): string => {
    const errors = Object.values(data);
    return errors.length > 0 ? errors[0] : 'Validation failed';
  },
};

// Export default
export default {
  AuthService,
  ErrorHandler,
}; 