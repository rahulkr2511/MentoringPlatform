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
  role: string; // "MENTOR" or "MENTEE"
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

// Profile types
interface ProfileRequest {
  name: string;
  expertise: string;
  availability: string;
  hourlyRate: number;
  description: string;
}

interface ProfileResponseData {
  name: string;
  expertise: string;
  availability: string;
  hourlyRate: number;
  description: string;
  username: string;
  email: string;
}

// Mentor types
interface MentorDetailsResponse {
  id: number;
  username: string;
  email: string;
  name: string;
  expertise: string;
  availability: string;
  hourlyRate: number;
  description: string;
  enabled: boolean;
}

// Session types
interface SessionBookingRequest {
  mentorId: number;
  scheduledDateTime: string; // ISO string
  durationMinutes: number;
  sessionType?: string;
  notes?: string;
}

interface SessionResponse {
  id: number;
  mentorId: number;
  mentorName: string;
  mentorUsername: string;
  menteeId: number;
  menteeName: string;
  menteeUsername: string;
  scheduledDateTime: string;
  durationMinutes: number;
  status: string;
  sessionType: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// Availability types
interface AvailabilitySlot {
  startTime: string; // ISO string
  endTime: string; // ISO string
  available: boolean;
  formattedTime: string;
}

interface MentorAvailabilityRequest {
  mentorId: number;
  startDate: string; // YYYY-MM-DD format
  endDate: string; // YYYY-MM-DD format
  durationMinutes?: number;
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

// Profile Services
export const ProfileService = {
  // Get mentor profile
  getProfile: async (): Promise<ApiResponse<ProfileResponseData>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<ProfileResponseData>('/mentor/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Update mentor profile
  updateProfile: async (profileData: ProfileRequest): Promise<ApiResponse<ProfileResponseData>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<ProfileResponseData>('/mentor/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
  },
};

// Mentor Services
export const MentorService = {
  // Get all available mentors (with profiles)
  getAvailableMentors: async (): Promise<ApiResponse<MentorDetailsResponse[]>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<MentorDetailsResponse[]>('/mentee/mentors', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get all mentors (including those without profiles)
  getAllMentors: async (): Promise<ApiResponse<MentorDetailsResponse[]>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<MentorDetailsResponse[]>('/mentee/mentors/all', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Session Services
export const SessionService = {
  // Book a new session
  bookSession: async (bookingRequest: SessionBookingRequest): Promise<ApiResponse<SessionResponse>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<SessionResponse>('/sessions/book', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(bookingRequest),
    });
  },

  // Get upcoming sessions
  getUpcomingSessions: async (): Promise<ApiResponse<SessionResponse[]>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<SessionResponse[]>('/sessions/upcoming', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get session history
  getSessionHistory: async (): Promise<ApiResponse<SessionResponse[]>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<SessionResponse[]>('/sessions/history', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Update session status (for mentors)
  updateSessionStatus: async (sessionId: number, status: string): Promise<ApiResponse<SessionResponse>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<SessionResponse>(`/sessions/${sessionId}/status?status=${status}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Cancel session
  cancelSession: async (sessionId: number): Promise<ApiResponse<SessionResponse>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<SessionResponse>(`/sessions/${sessionId}/cancel`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get available time slots for a mentor
  getAvailableTimeSlots: async (request: MentorAvailabilityRequest): Promise<ApiResponse<AvailabilitySlot[]>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<AvailabilitySlot[]>('/sessions/availability', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(request),
    });
  },

  // Get mentor availability summary
  getMentorAvailabilitySummary: async (mentorId: number): Promise<ApiResponse<string>> => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'No authentication token found',
      };
    }

    return apiCall<string>(`/sessions/availability/${mentorId}/summary`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
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
  ProfileService,
  MentorService,
  SessionService,
  ErrorHandler,
}; 