# Client-Side API Integration

This document outlines the client-side changes made to handle the new standardized API response structure.

## Updated Services.ts

### New Type Definitions

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface SignupResponseData {
  username: string;
  email: string;
  message: string;
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
```

### Enhanced AuthService

The `AuthService` now includes additional methods:

```typescript
export const AuthService = {
  // Existing methods
  signup: async (userData: SignupRequest): Promise<ApiResponse<SignupResponseData>>
  login: async (credentials: LoginRequest): Promise<ApiResponse<LoginResponseData>>
  
  // New methods
  getCurrentUser: async (): Promise<ApiResponse<UserResponseData>>
  logout: (): void
  isAuthenticated: (): boolean
  getStoredUser: (): any
};
```

### Error Handling Utilities

```typescript
export const ErrorHandler = {
  getErrorMessage: (errorCode: string, defaultMessage?: string): string
  handleValidationErrors: (data: ValidationErrors): string
};
```

## Updated Components

### Login Component

The Login component now uses the new error handling utilities:

```javascript
// Before
if (response.error) {
  if (response.error.toLowerCase().includes('username') && response.error.toLowerCase().includes('exists')) {
    errorMessage = 'Username already exists';
  }
  // ... more manual error handling
}

// After
const errorMessage = ErrorHandler.getErrorMessage(response.error, 'Login failed');
```

### Dashboard Component

The Dashboard component now uses `AuthService` for better authentication handling:

```javascript
// Before
const storedUser = localStorage.getItem('user');
if (storedUser) {
  setUser(JSON.parse(storedUser));
}

// After
const storedUser = AuthService.getStoredUser();
if (storedUser) {
  setUser(storedUser);
} else if (AuthService.isAuthenticated()) {
  fetchCurrentUser();
}
```

## New Authentication Hook

### useAuth Hook

A new custom hook provides centralized authentication state management:

```javascript
import { useAuth } from '../hooks/useAuth';

const { user, isAuthenticated, isLoading, login, signup, logout } = useAuth();
```

### AuthProvider

Wrap your app with the AuthProvider to enable authentication context:

```javascript
import { AuthProvider } from '../hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      {/* Your app components */}
    </AuthProvider>
  );
}
```

## Error Code Mapping

The client now properly handles all server error codes:

| Error Code | User-Friendly Message |
|------------|----------------------|
| `INVALID_CREDENTIALS` | "Invalid username or password" |
| `USER_NOT_FOUND` | "User not found" |
| `USERNAME_EXISTS` | "Username already exists" |
| `EMAIL_EXISTS` | "Email already exists" |
| `VALIDATION_ERROR` | "Please check your input and try again" |
| `INTERNAL_SERVER_ERROR` | "An unexpected error occurred. Please try again later." |

## Validation Error Handling

For validation errors, the client can now display field-specific errors:

```javascript
if (response.error === 'VALIDATION_ERROR' && response.data) {
  errorMessage = ErrorHandler.handleValidationErrors(response.data);
} else {
  errorMessage = ErrorHandler.getErrorMessage(response.error, 'Signup failed');
}
```

## Benefits of the New Implementation

1. **Consistent Error Handling**: All errors are handled uniformly across the application
2. **Better User Experience**: User-friendly error messages instead of technical error codes
3. **Type Safety**: Proper TypeScript interfaces for all API responses
4. **Centralized Authentication**: Single source of truth for authentication state
5. **Automatic Token Management**: Automatic handling of authentication tokens
6. **Network Error Handling**: Proper handling of network failures and timeouts

## Usage Examples

### Using the Auth Hook

```javascript
import { useAuth } from '../hooks/useAuth';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async (credentials) => {
    const result = await login(credentials);
    if (result.success) {
      // Navigate to dashboard
    } else {
      // Handle error
      console.error(result.error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user.username}!</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <LoginForm onSubmit={handleLogin} />
      )}
    </div>
  );
}
```

### Direct Service Usage

```javascript
import { AuthService, ErrorHandler } from '../services/Services';

const handleSignup = async (userData) => {
  const response = await AuthService.signup(userData);
  
  if (response.success) {
    console.log('User created:', response.data);
  } else {
    const errorMessage = ErrorHandler.getErrorMessage(response.error);
    setError(errorMessage);
  }
};
``` 