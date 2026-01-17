# High-Level Design (HLD) - Mentoring Platform

## 1. System Overview

The Mentoring Platform is a web-based application that facilitates 1-on-1 video mentoring sessions between mentors and mentees. The system provides real-time video communication using WebRTC, session scheduling, user authentication, and role-based access control.

### 1.1 Key Features
- **User Authentication & Authorization**: JWT-based authentication with role-based access (MENTOR/MENTEE)
- **Session Management**: Booking, scheduling, and managing mentoring sessions
- **Real-time Video Communication**: WebRTC-based peer-to-peer video calls with WebSocket signaling
- **Real-time Chat Communication**: Session-based chat messaging with WebSocket
- **Mentor Discovery**: Browse and filter mentors by expertise, availability, and ratings
- **Availability Management**: Mentors can set their availability schedules
- **Session History**: Track past and upcoming sessions
- **Profile Management**: Mentors can manage their profiles with expertise, hourly rates, and descriptions

### 1.2 System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Spring Boot    │    │   PostgreSQL    │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   WebRTC        │    │   WebSocket     │
│   (P2P Video)   │    │   (STOMP)       │
└─────────────────┘    └─────────────────┘
```

## 2. System Components

### 2.1 Frontend (React Client)
- **Technology Stack**: React 19.1.0, TypeScript, SockJS, STOMP
- **Key Components**:
  - **App.js**: Main application with routing and authentication state
  - **Login.jsx**: Authentication interface with signup/login forms
  - **MenteeDashboard.jsx**: Mentee-specific dashboard with mentor discovery and booking
  - **MentorDashboard.jsx**: Mentor-specific dashboard with session management and profile
  - **VideoCall.jsx**: WebRTC video call interface with controls
  - **Chat.jsx**: Text chat component for messaging
  - **Services.ts**: API service layer for backend communication
  - **WebRTCService.ts**: WebRTC signaling and peer connection management

### 2.2 Backend (Spring Boot)
- **Technology Stack**: Spring Boot 3.2.3, Spring Security, Spring WebSocket, JPA
- **Key Components**:
  - **AuthController**: User registration, login, and authentication
  - **SessionController**: Session booking, management, and availability
  - **ProfileController**: Mentor profile management
  - **MenteeDashboardController**: Mentor discovery and listing
  - **SignalingController**: WebRTC signaling via WebSocket
  - **ChatController**: Real-time chat messaging
  - **WebSocketConfig**: STOMP WebSocket configuration

### 2.3 Database (PostgreSQL)
- **Schema**: Users, Sessions, Availability tables with JPA entities
- **Relationships**: Many-to-many and one-to-many relationships

### 2.4 Real-time Communication
- **WebRTC**: Peer-to-peer video/audio streaming with ICE servers
- **WebSocket**: STOMP protocol for WebRTC signaling and chat messaging
- **Signaling**: Offer/Answer exchange and ICE candidate handling
- **Chat Messaging**: Session-based real-time text messaging

#### Resilience & Attempt Recreation (WebRTC)
- Deterministic initiator for renegotiation to prevent glare
- Automatic ICE restart on `failed`/`disconnected` states
- Exponential backoff with jitter for signaling reconnect; capped attempts
- PeerConnection recreation with local track re-attachment if missing
- Buffered ICE candidates processed after remote description is set

## 3. User Roles & Permissions

### 3.1 Mentor Role
- **Capabilities**:
  - Set availability schedules
  - Accept/reject session requests
  - Join video calls as host
  - View session history
  - Manage profile and expertise
  - Update session status (CONFIRMED, REJECTED, COMPLETED)

### 3.2 Mentee Role
- **Capabilities**:
  - Browse and filter mentors
  - Book sessions with mentors
  - Join video calls as participant
  - View session history
  - Cancel sessions

## 4. Core Workflows

### 4.1 User Registration & Authentication
```
1. User registers with username, email, password, and role (MENTOR/MENTEE)
2. System validates input and creates user account with BCrypt password
3. User logs in with credentials
4. System validates credentials and issues JWT token
5. Client stores token and user data in localStorage
6. Dashboard routing based on user role
```

### 4.2 Session Booking Workflow
```
1. Mentee browses available mentors via /mentors endpoint
2. Mentee selects mentor and views availability via /sessions/availability
3. Mentee selects time slot and books session via /sessions/book
4. System creates session with PENDING status
5. Mentor can update session status via /sessions/{id}/status
6. Session status updated to CONFIRMED/REJECTED/COMPLETED
```

### 4.3 Video Call Workflow
```
1. User joins session at scheduled time
2. WebSocket connection established via STOMP over SockJS
3. WebRTC peer connection initialized with ICE servers
4. Local media stream obtained (audio/video)
5. Offer/Answer exchange via WebSocket signaling
6. ICE candidates exchanged for NAT traversal
7. Peer-to-peer media stream established
8. Video call proceeds with real-time communication
9. Connection resilience sequence (on failure/disconnect):
   9.1 Attempt ICE restart and renegotiate (deterministic initiator)
   9.2 If signaling disconnected, reconnect with exponential backoff
   9.3 Recreate RTCPeerConnection and re-add local tracks if needed
```

### 4.4 Chat Communication Workflow
```
1. User joins session and chat component initializes
2. WebSocket connection established for chat messaging
3. Chat service connects to session-specific topic
4. Real-time message exchange between participants
5. Messages displayed with sender identification and timestamps
6. Chat persists throughout the session duration
```

## 5. Data Flow

### 5.1 Authentication Flow
```
Client → AuthController → UserService → UserRepository → Database
Client ← AuthController ← JwtTokenProvider ← UserService ← Database
```

### 5.2 Session Management Flow
```
Client → SessionController → SessionService → SessionRepository → Database
Client ← SessionController ← SessionResponse ← SessionService ← Database
```

### 5.3 WebRTC Signaling Flow
```
Client A → WebSocket → SignalingController → WebSocket → Client B
Client A ← WebSocket ← SignalingController ← WebSocket ← Client B
```

### 5.4 Chat Messaging Flow
```
Client A → WebSocket → ChatController → WebSocket → Client B
Client A ← WebSocket ← ChatController ← WebSocket ← Client B
```

## 6. Security Architecture

### 6.1 Authentication
- **JWT Tokens**: Stateless authentication with configurable expiration
- **Password Encryption**: BCrypt password hashing
- **Role-based Access**: Spring Security with method-level authorization

### 6.2 Authorization
- **API Protection**: @PreAuthorize annotations for endpoint security
- **Role Validation**: MENTOR/MENTEE role-based access control
- **Session Validation**: Users can only access their own sessions

### 6.3 CORS Configuration
- **Cross-origin Support**: Configured for development and production
- **WebSocket Security**: STOMP over WebSocket with authentication

## 7. API Endpoints

### 7.1 Authentication Endpoints
- `POST /monitoringPlatform/auth/signup` - User registration
- `POST /monitoringPlatform/auth/login` - User authentication
- `GET /monitoringPlatform/auth/me` - Get current user

### 7.2 Session Management Endpoints
- `POST /monitoringPlatform/sessions/book` - Book a session
- `POST /monitoringPlatform/sessions/availability` - Get available slots
- `GET /monitoringPlatform/sessions/upcoming` - Get upcoming sessions
- `GET /monitoringPlatform/sessions/history` - Get session history
- `PUT /monitoringPlatform/sessions/{id}/status` - Update session status
- `PUT /monitoringPlatform/sessions/{id}/cancel` - Cancel session

### 7.3 Profile Management Endpoints
- `GET /monitoringPlatform/mentors` - Get all mentors
- `GET /monitoringPlatform/mentor/profile` - Get mentor profile
- `PUT /monitoringPlatform/mentor/profile` - Update mentor profile

### 7.4 WebSocket Endpoints
- `/ws` - WebSocket connection endpoint
- `/app/signal` - WebRTC signaling messages
- `/app/chat.send` - Chat messages
- `/topic/chat/{sessionId}` - Chat message subscription topic

## 8. Database Schema

### 8.1 Users Table
```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    full_name VARCHAR(255),
    expertise VARCHAR(255),
    availability TEXT,
    hourly_rate DECIMAL(10,2),
    description TEXT
);

CREATE TABLE user_roles (
    user_id BIGINT REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role)
);
```

### 8.2 Sessions Table
```sql
CREATE TABLE sessions (
    id BIGSERIAL PRIMARY KEY,
    mentor_id BIGINT REFERENCES users(id) NOT NULL,
    mentee_id BIGINT REFERENCES users(id) NOT NULL,
    scheduled_date_time TIMESTAMP NOT NULL,
    duration_minutes INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    session_type VARCHAR(50) DEFAULT 'VIDEO_CALL',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.3 Availability Table
```sql
CREATE TABLE availabilities (
    id BIGSERIAL PRIMARY KEY,
    mentor_id BIGINT REFERENCES users(id) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);
```

## 9. Scalability Considerations

### 9.1 Horizontal Scaling
- **Stateless Backend**: Spring Boot applications can be scaled horizontally
- **Database Scaling**: PostgreSQL can be scaled with read replicas
- **WebSocket Scaling**: STOMP broker can be clustered

### 9.2 Performance Optimization
- **Connection Pooling**: Database connection pooling
- **Caching**: Session and user data caching
- **CDN**: Static assets delivery via CDN

## 10. Deployment Architecture

### 10.1 Development Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Dev     │    │  Spring Boot    │    │   PostgreSQL    │
│   (Port 3000)   │◄──►│   (Port 8080)   │◄──►│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 10.2 Production Environment
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx/        │    │  Load Balancer  │    │   PostgreSQL    │
│   CDN           │◄──►│   (Spring Boot  │◄──►│   (Primary +    │
└─────────────────┘    │   Instances)    │    │   Replicas)     │
                       └─────────────────┘    └─────────────────┘
```

## 11. Technology Stack Summary

### 11.1 Frontend
- **Framework**: React 19.1.0
- **Language**: TypeScript/JavaScript
- **WebSocket**: SockJS + STOMP
- **WebRTC**: Native browser APIs
- **Build Tool**: Create React App
- **State Management**: React hooks and localStorage

### 11.2 Backend
- **Framework**: Spring Boot 3.2.3
- **Language**: Java 17
- **Security**: Spring Security + JWT
- **Database**: JPA + PostgreSQL
- **WebSocket**: Spring WebSocket + STOMP

### 11.3 Database
- **RDBMS**: PostgreSQL
- **ORM**: Hibernate (JPA)
- **Connection**: JDBC

### 11.4 DevOps
- **Build**: Maven
- **Container**: Docker (docker-compose.yml)
- **Version Control**: Git

## 12. Future Enhancements

### 12.1 Planned Features
- **Payment Integration**: Stripe/PayPal for session payments
- **File Sharing**: Document sharing during sessions
- **Recording**: Session recording with consent
- **Analytics**: Session analytics and reporting
- **Mobile App**: React Native mobile application

### 12.2 Technical Improvements
- **Microservices**: Break down into smaller services
- **Message Queue**: Redis/RabbitMQ for async processing
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack integration
- **Testing**: Comprehensive unit and integration tests 