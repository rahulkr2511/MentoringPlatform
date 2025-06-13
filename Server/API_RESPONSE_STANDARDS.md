# API Response Standards

This document outlines the standardized response structure for all APIs in the Mentoring Platform.

## Response Structure

All API responses follow a consistent structure using the `ApiResponse<T>` wrapper:

```json
{
  "success": boolean,
  "data": T,
  "message": string,
  "error": string
}
```

### Fields Description

- **success**: Boolean indicating if the request was successful
- **data**: The actual response data (can be any type)
- **message**: Human-readable success message
- **error**: Error code for failed requests

## Success Responses

### Signup Response
```json
{
  "success": true,
  "data": {
    "username": "john_doe",
    "email": "john@example.com",
    "message": "User registered successfully"
  },
  "message": "User registered successfully",
  "error": null
}
```

### Login Response
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "john_doe",
    "email": "john@example.com",
    "roles": ["USER"]
  },
  "message": "Login successful",
  "error": null
}
```

### Get Current User Response
```json
{
  "success": true,
  "data": {
    "token": null,
    "username": "john_doe",
    "email": "john@example.com",
    "roles": ["USER"]
  },
  "message": "User details retrieved successfully",
  "error": null
}
```

## Error Responses

### HTTP Status Codes

- **200 OK**: Successful GET requests
- **201 Created**: Successful POST requests (e.g., signup)
- **400 Bad Request**: Validation errors
- **401 Unauthorized**: Invalid credentials
- **404 Not Found**: User not found
- **409 Conflict**: Resource already exists (username/email)
- **500 Internal Server Error**: Unexpected errors

### Error Response Examples

#### Invalid Credentials (401)
```json
{
  "success": false,
  "data": null,
  "message": null,
  "error": "INVALID_CREDENTIALS"
}
```

#### User Not Found (404)
```json
{
  "success": false,
  "data": null,
  "message": "User not found with username: john_doe",
  "error": "USER_NOT_FOUND"
}
```

#### Username Already Exists (409)
```json
{
  "success": false,
  "data": null,
  "message": "Username is already taken!",
  "error": "USERNAME_EXISTS"
}
```

#### Email Already Exists (409)
```json
{
  "success": false,
  "data": null,
  "message": "Email is already in use!",
  "error": "EMAIL_EXISTS"
}
```

#### Validation Errors (400)
```json
{
  "success": false,
  "data": {
    "username": "Username is required",
    "email": "Invalid email format",
    "password": "Password must be at least 6 characters"
  },
  "message": "Validation failed",
  "error": "VALIDATION_ERROR"
}
```

#### Internal Server Error (500)
```json
{
  "success": false,
  "data": null,
  "message": "An unexpected error occurred",
  "error": "INTERNAL_SERVER_ERROR"
}
```

## Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `INVALID_CREDENTIALS` | Invalid username or password | 401 |
| `USER_NOT_FOUND` | User not found | 404 |
| `USERNAME_EXISTS` | Username already taken | 409 |
| `EMAIL_EXISTS` | Email already in use | 409 |
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `INTERNAL_SERVER_ERROR` | Unexpected server error | 500 |

## Implementation Notes

1. All endpoints now return `ResponseEntity<ApiResponse<T>>` for consistency
2. Proper HTTP status codes are set for all responses
3. Global exception handler catches and formats all exceptions
4. Custom exceptions provide specific error codes and messages
5. Validation errors include field-specific error details in the data field 