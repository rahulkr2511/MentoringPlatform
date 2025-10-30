# Low-Level Design (LLD) - Mentoring Platform

## 1. Database Schema Design

### 1.1 Users Table
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

### 1.2 Sessions Table
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

-- Session status enum values: PENDING, CONFIRMED, REJECTED, CANCELLED, COMPLETED, NO_SHOW
```

### 1.3 Availability Table
```sql
CREATE TABLE availabilities (
    id BIGSERIAL PRIMARY KEY,
    mentor_id BIGINT REFERENCES users(id) NOT NULL,
    day_of_week VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE
);

-- Day of week enum values: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
```

## 2. API Design

### 2.1 Authentication APIs

#### 2.1.1 User Registration
```http
POST /monitoringPlatform/auth/signup
Content-Type: application/json

{
    "username": "string",
    "email": "string",
    "password": "string",
    "role": "MENTOR|MENTEE"
}

Response:
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "username": "string",
        "email": "string",
        "message": "User registered successfully"
    }
}
```

#### 2.1.2 User Login
```http
POST /monitoringPlatform/auth/login
Content-Type: application/json

{
    "username": "string",
    "password": "string"
}

Response:
{
    "success": true,
    "message": "Login successful",
    "data": {
        "token": "jwt_token",
        "username": "string",
        "email": "string",
        "roles": ["MENTOR|MENTEE"]
    }
}
```

### 2.2 Session Management APIs

#### 2.2.1 Book Session
```http
POST /monitoringPlatform/sessions/book
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
    "mentorId": 1,
    "scheduledDateTime": "2024-01-15T10:00:00Z",
    "durationMinutes": 60,
    "sessionType": "VIDEO_CALL",
    "notes": "string"
}

Response:
{
    "success": true,
    "message": "Session booked successfully",
    "data": {
        "id": 1,
        "mentorId": 1,
        "mentorName": "string",
        "mentorUsername": "string",
        "menteeId": 2,
        "menteeName": "string",
        "menteeUsername": "string",
        "scheduledDateTime": "2024-01-15T10:00:00Z",
        "durationMinutes": 60,
        "status": "PENDING",
        "sessionType": "VIDEO_CALL",
        "notes": "string",
        "createdAt": "2024-01-15T10:00:00Z",
        "updatedAt": "2024-01-15T10:00:00Z"
    }
}
```

#### 2.2.2 Get Available Time Slots
```http
POST /monitoringPlatform/sessions/availability
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
    "mentorId": 1,
    "startDate": "2024-01-15",
    "endDate": "2024-01-15",
    "durationMinutes": 60
}

Response:
{
    "success": true,
    "message": "Available time slots retrieved successfully",
    "data": [
        {
            "startTime": "2024-01-15T10:00:00Z",
            "endTime": "2024-01-15T11:00:00Z",
            "available": true,
            "formattedTime": "10:00 AM - 11:00 AM"
        }
    ]
}
```

### 2.3 Profile Management APIs

#### 2.3.1 Get All Mentors
```http
GET /monitoringPlatform/mentors
Authorization: Bearer <jwt_token>

Response:
{
    "success": true,
    "message": "Mentors retrieved successfully",
    "data": [
        {
            "id": 1,
            "username": "mentor1",
            "email": "mentor1@example.com",
            "name": "John Doe",
            "expertise": "Software Development",
            "availability": "Weekdays 9 AM - 5 PM",
            "hourlyRate": 50.00,
            "description": "Experienced software developer",
            "enabled": true
        }
    ]
}
```

#### 2.3.2 Get Mentor Profile
```http
GET /monitoringPlatform/mentor/profile
Authorization: Bearer <jwt_token>

Response:
{
    "success": true,
    "message": "Profile retrieved successfully",
    "data": {
        "name": "John Doe",
        "expertise": "Software Development",
        "availability": "Weekdays 9 AM - 5 PM",
        "hourlyRate": 50.00,
        "description": "Experienced software developer",
        "username": "mentor1",
        "email": "mentor1@example.com"
    }
}
```

#### 2.3.3 Update Mentor Profile
```http
PUT /monitoringPlatform/mentor/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
    "name": "John Doe",
    "expertise": "Software Development",
    "availability": "Weekdays 9 AM - 5 PM",
    "hourlyRate": 50.00,
    "description": "Experienced software developer"
}

Response:
{
    "success": true,
    "message": "Profile updated successfully",
    "data": {
        "name": "John Doe",
        "expertise": "Software Development",
        "availability": "Weekdays 9 AM - 5 PM",
        "hourlyRate": 50.00,
        "description": "Experienced software developer",
        "username": "mentor1",
        "email": "mentor1@example.com"
    }
}
```

## 3. WebSocket Communication Protocol

### 3.1 WebRTC Signaling Message Types
```typescript
interface SignalMessage {
    type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
    from: string;
    to: string;
    sessionId: string;
    sdp?: string;
    candidate?: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
}
```

### 3.2 Chat Message Types
```typescript
interface ChatMessage {
    sessionId: string;
    sender: string;        // userId or username
    content: string;       // message body
    timestamp: string;     // ISO format
}
```

### 3.3 WebSocket Endpoints
```java
// WebSocket Configuration
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig {
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
    
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/app");
        registry.enableSimpleBroker("/topic");
    }
}
```

### 3.4 Signaling Controller
```java
@Controller
public class SignalingController {
    
    @MessageMapping("/signal")
    public void handleSignal(SignalMessage message) {
        // Route message to target user
        String targetUser = message.getTo();
        messagingTemplate.convertAndSend("/topic/signal/" + targetUser, message);
    }
}
```

### 3.5 Chat Controller
```java
@Controller
public class ChatController {
    
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload ChatMessage message) {
        // Broadcast message to all participants in the session
        messagingTemplate.convertAndSend("/topic/chat/" + message.getSessionId(), message);
    }
}
```

## 4. Frontend Component Architecture

### 4.1 Chat Component Structure
```jsx
// Chat.jsx - Real-time Chat Component
const Chat = ({ sessionId, participantName, isMentor, currentUsername, sessionData }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    
    // WebSocket connection and message handling
    useEffect(() => {
        if (sessionId) {
            chatService.connect(sessionId, currentUsername);
            chatService.setOnMessageReceived((message) => {
                setMessages(prev => [...prev, message]);
            });
        }
    }, [sessionId]);
    
    // Message sending functionality
    const handleSendMessage = () => {
        if (newMessage.trim() && isConnected) {
            chatService.sendMessage(newMessage.trim());
            setNewMessage('');
        }
    };
    
    return (
        <div className="chat-panel">
            <div className="chat-header">
                <h4>Chat with {participantName}</h4>
                <div className="chat-status">
                    <span className={`status-indicator ${isConnected ? 'online' : 'offline'}`}></span>
                    <span>{isConnected ? 'Connected' : 'Connecting...'}</span>
                </div>
            </div>
            
            <div className="chat-messages">
                {messages.map((message) => (
                    <div key={message.id} className={`chat-message ${
                        message.sender === currentUsername ? 'own-message' : 'other-message'
                    }`}>
                        <div className="message-sender">
                            {message.sender === currentUsername ? 'You' : message.sender}
                        </div>
                        <div className="message-content">
                            <span className="message-text">{message.text}</span>
                            <span className="message-time">{formatTime(message.timestamp)}</span>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="chat-input">
                <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                />
                <button onClick={handleSendMessage} disabled={!newMessage.trim() || !isConnected}>
                    Send
                </button>
            </div>
        </div>
    );
};
```

### 4.2 Chat Service Architecture
```typescript
// ChatService.ts - WebSocket Chat Service
export class ChatService {
    private stompClient: CompatClient | null = null;
    private isConnected = false;
    private sessionId = '';
    private username = '';
    private onMessageReceived: ((message: ChatMessage) => void) | null = null;

    public async connect(sessionId: string, username: string): Promise<boolean> {
        const socket = new SockJS('http://localhost:8080/ws');
        this.stompClient = Stomp.over(socket);
        
        return new Promise((resolve) => {
            this.stompClient?.connect({}, () => {
                // Subscribe to chat topic for this session
                this.stompClient?.subscribe(`/topic/chat/${sessionId}`, (msg) => {
                    const chatMessage: ChatMessage = JSON.parse(msg.body);
                    if (this.onMessageReceived) {
                        this.onMessageReceived(chatMessage);
                    }
                });
                
                this.isConnected = true;
                resolve(true);
            });
        });
    }

    public sendMessage(content: string): boolean {
        if (!this.stompClient || !this.isConnected) return false;
        
        const message: ChatMessage = {
            sessionId: this.sessionId,
            sender: this.username,
            content: content,
            timestamp: new Date().toISOString()
        };
        
        this.stompClient.send('/app/chat.send', {}, JSON.stringify(message));
        return true;
    }
}
```

### 4.3 App Component Structure
```jsx
// App.js - Main Application Component
function App() {
    const [currentView, setCurrentView] = useState('home');
    const [userData, setUserData] = useState(null);
    
    // Authentication state management
    // Route between Home, Login, and Dashboard views
}
```

### 4.2 Dashboard Components

#### 4.2.1 MenteeDashboard Component
```jsx
const MenteeDashboard = ({ userData, onLogout }) => {
    const [currentView, setCurrentView] = useState('mentors');
    const [mentors, setMentors] = useState([]);
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    
    // State management for:
    // - Mentor listing and filtering
    // - Session booking modal
    // - Video call integration
    // - Session management
}
```

#### 4.2.2 MentorDashboard Component
```jsx
const MentorDashboard = ({ userData, onLogout }) => {
    const [upcomingSessions, setUpcomingSessions] = useState([]);
    const [availability, setAvailability] = useState([]);
    
    // State management for:
    // - Session approval/rejection
    // - Availability management
    // - Video call hosting
}
```

### 4.3 Video Call Component
```jsx
const VideoCall = ({ selectedMentor, roomId, onEndCall, isMentor, sessionData }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOn, setIsVideoOn] = useState(true);
    
    // WebRTC integration
    // Media stream management
    // Call controls (mute, video toggle, screen share)
}
```

## 5. WebRTC Service Implementation

### 5.1 WebRTC Service Class
```typescript
export class WebRTCService {
    private peerConnection: RTCPeerConnection | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private stompClient: CompatClient | null = null;
    
    // ICE Server Configuration
    private readonly ICE_SERVERS = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ]
    };
    
    // Core methods:
    // - connect(username, sessionId, targetUser)
    // - initializeLocalStream()
    // - startCall(isMentor)
    // - handleSignal(data)
    // - disconnect()
}
```

### 5.2 WebRTC Connection Flow
```typescript
// 1. Initialize WebSocket connection
await webRTCService.connect(username, roomId, targetUser);

// 2. Initialize local media stream
const localStream = await webRTCService.initializeLocalStream();

// 3. Set up callbacks for stream handling
webRTCService.setOnLocalStream((stream) => {
    setLocalStream(stream);
    localVideoRef.current.srcObject = stream;
});

webRTCService.setOnRemoteStream((stream) => {
    setRemoteStream(stream);
    remoteVideoRef.current.srcObject = stream;
});

// 4. Start the call (mentor initiates, mentee responds)
await webRTCService.startCall(isMentor);
```

### 5.3 Connection Resilience & Attempt Recreation (Detailed)

#### 5.3.1 Deterministic Initiator
- Function: `isDeterministicInitiator()` compares `username` vs `targetUser` to ensure only one side creates an offer during renegotiation
- Function: `trySendOfferIfInitiator()` sends an SDP offer only if signaling state is `stable`, no remote description exists, and this side is the initiator

```463:488:Client/src/services/WebRTCService.ts
private async trySendOfferIfInitiator(): Promise<void> {
  if (!this.peerConnection || !this.localStream) return;
  if (this.peerConnection.signalingState !== 'stable') return;
  if (this.peerConnection.remoteDescription) return;
  if (!this.isDeterministicInitiator()) return;
  if (this.hasSentOffer) return;
  const offer = await this.peerConnection.createOffer();
  await this.peerConnection.setLocalDescription(offer);
  this.hasSentOffer = true;
  this.sendMessage({ type: 'offer', from: this.username, to: this.targetUser, sessionId: this.sessionId, sdp: offer.sdp });
}
```

#### 5.3.2 ICE Restart and PeerConnection Recreation
- Function: `tryIceRestart()` attempts `createOffer({ iceRestart: true })` and re-sends an offer
- If `peerConnection` is null but `localStream` exists, it calls `setupPeerConnection()` and re-adds all local tracks before attempting restart

```528:551:Client/src/services/WebRTCService.ts
public async tryIceRestart(): Promise<void> {
  if (!this.peerConnection) {
    if (this.localStream) {
      this.setupPeerConnection();
      this.localStream.getTracks().forEach(track => this.peerConnection?.addTrack(track, this.localStream!));
    } else {
      return;
    }
  }
  const offer = await this.peerConnection.createOffer({ iceRestart: true });
  await this.peerConnection.setLocalDescription(offer);
  this.sendMessage({ type: 'offer', from: this.username, to: this.targetUser, sessionId: this.sessionId, sdp: offer.sdp });
}
```

#### 5.3.3 Signaling Reconnection with Exponential Backoff
- Function: `scheduleReconnect()` backs off exponentially with base delay and jitter, limited by `maxReconnectAttempts`
- After successful reconnect, it attempts `tryIceRestart()` to renegotiate media paths

```490:526:Client/src/services/WebRTCService.ts
private scheduleReconnect(): void {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) return;
  if (this.reconnectTimer) return;
  const backoff = this.reconnectDelayBaseMs * Math.pow(2, this.reconnectAttempts);
  const jitter = Math.floor(Math.random() * 300);
  const delay = backoff + jitter;
  this.reconnectTimer = setTimeout(async () => {
    this.reconnectTimer = null;
    this.reconnectAttempts++;
    if (this.lastConnectParams) {
      const ok = await this.connect(this.lastConnectParams.username, this.lastConnectParams.sessionId, this.lastConnectParams.targetUser);
      if (ok) {
        await this.tryIceRestart().catch(() => {});
      }
    }
  }, delay) as unknown as number;
}
```

#### 5.3.4 Pending ICE Candidate Buffering
- Property: `pendingCandidates: SignalMessage[]`
- Behavior: If remote description is not set when a candidate arrives, buffer it; process in `processPendingCandidates()` after remote description is applied

```323:346:Client/src/services/WebRTCService.ts
private async processPendingCandidates(): Promise<void> {
  if (!this.pendingCandidates.length || !this.peerConnection) return;
  for (const candidateData of this.pendingCandidates) {
    const candidate = new RTCIceCandidate({
      candidate: candidateData.candidate,
      sdpMLineIndex: candidateData.sdpMLineIndex,
      sdpMid: candidateData.sdpMid
    });
    await this.peerConnection.addIceCandidate(candidate);
  }
  this.pendingCandidates = [];
}
```

#### 5.3.5 State Change Triggers
- On `connectionState` or `iceConnectionState` becoming `failed`/`disconnected`, the service triggers `tryIceRestart()` and may schedule signaling reconnect if needed

```414:445:Client/src/services/WebRTCService.ts
this.peerConnection.onconnectionstatechange = () => {
  const state = this.peerConnection?.connectionState;
  if (state === 'failed' || state === 'disconnected') {
    this.tryIceRestart().catch(() => {});
    if (!this.isConnected) this.scheduleReconnect();
  }
};
this.peerConnection.oniceconnectionstatechange = () => {
  const state = this.peerConnection?.iceConnectionState;
  if (state === 'failed' || state === 'disconnected') {
    this.tryIceRestart().catch(() => {});
  }
};
```

#### 5.3.6 Configuration Parameters
- `maxReconnectAttempts = 5`
- `reconnectDelayBaseMs = 1000`
- `pendingCandidates` buffer size: unbounded in code, expected to be small due to short window

## 6. Service Layer Implementation

### 6.1 Authentication Service
```typescript
export class AuthService {
    private static readonly API_BASE_URL = 'http://localhost:8080/monitoringPlatform/auth';
    
    static async login(username: string, password: string): Promise<ApiResponse<AuthResponse>> {
        const response = await fetch(`${this.API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        return response.json();
    }
    
    static async signup(signupData: SignupRequest): Promise<ApiResponse<SignupResponse>> {
        const response = await fetch(`${this.API_BASE_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupData)
        });
        return response.json();
    }
    
    static getStoredToken(): string | null {
        return localStorage.getItem('token');
    }
    
    static logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
}
```

### 6.2 Session Service
```typescript
export class SessionService {
    private static readonly API_BASE_URL = 'http://localhost:8080/monitoringPlatform/sessions';
    
    static async bookSession(bookingRequest: SessionBookingRequest): Promise<ApiResponse<SessionResponse>> {
        const response = await fetch(`${this.API_BASE_URL}/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AuthService.getStoredToken()}`
            },
            body: JSON.stringify(bookingRequest)
        });
        return response.json();
    }
    
    static async getUpcomingSessions(): Promise<ApiResponse<SessionResponse[]>> {
        const response = await fetch(`${this.API_BASE_URL}/upcoming`, {
            headers: {
                'Authorization': `Bearer ${AuthService.getStoredToken()}`
            }
        });
        return response.json();
    }
}
```

## 7. Security Implementation

### 7.1 JWT Token Provider
```java
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private long jwtExpiration;
    
    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        return Jwts.builder()
                .setSubject(Long.toString(userPrincipal.getId()))
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(SignatureAlgorithm.HS512, jwtSecret)
                .compact();
    }
    
    public Long getUserIdFromJWT(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(jwtSecret)
                .parseClaimsJws(token)
                .getBody();
        
        return Long.parseLong(claims.getSubject());
    }
    
    public boolean validateToken(String authToken) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(authToken);
            return true;
        } catch (SignatureException ex) {
            // Invalid JWT signature
            return false;
        } catch (MalformedJwtException ex) {
            // Invalid JWT token
            return false;
        } catch (ExpiredJwtException ex) {
            // Expired JWT token
            return false;
        } catch (UnsupportedJwtException ex) {
            // Unsupported JWT token
            return false;
        } catch (IllegalArgumentException ex) {
            // JWT claims string is empty
            return false;
        }
    }
}
```

### 7.2 Security Configuration
```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/monitoringPlatform/auth/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
```

## 8. Error Handling

### 8.1 Global Exception Handler
```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<String>> handleGlobalException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred: " + ex.getMessage()));
    }
    
    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<String>> handleUserAlreadyExists(UserAlreadyExistsException ex) {
        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<String>> handleValidationErrors(MethodArgumentNotValidException ex) {
        String errorMessage = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed: " + errorMessage));
    }
}
```

### 8.2 Frontend Error Handling
```typescript
// API Response wrapper
interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    error?: string;
}

// Error handling in components
const handleApiCall = async (apiFunction: () => Promise<ApiResponse<any>>) => {
    try {
        setIsLoading(true);
        const response = await apiFunction();
        
        if (response.success) {
            // Handle success
            setData(response.data);
        } else {
            // Handle API error
            console.error('API Error:', response.error);
            alert(response.error || 'An error occurred');
        }
    } catch (error) {
        // Handle network/technical error
        console.error('Network Error:', error);
        alert('Network error. Please try again.');
    } finally {
        setIsLoading(false);
    }
};
```

## 9. Configuration Management

### 9.1 Application Properties
```properties
# Server Configuration
server.port=8080

# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/mentoringdb
spring.datasource.username=rahulkr
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update

# JWT Configuration
jwt.secret=your-secret-key-should-be-very-long-and-secure-in-production
jwt.expiration=86400000

# Logging Configuration
logging.level.org.springframework.security=DEBUG
logging.level.com.mentoringplatform=DEBUG
```

### 9.2 Docker Configuration
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: mentoringdb
      POSTGRES_USER: rahulkr
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  server:
    build: ./Server
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/mentoringdb
      SPRING_DATASOURCE_USERNAME: rahulkr
      SPRING_DATASOURCE_PASSWORD: password

volumes:
  postgres_data:
```

## 10. Testing Strategy

### 10.1 Unit Testing
```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {
    
    @Mock
    private UserRepository userRepository;
    
    @Mock
    private PasswordEncoder passwordEncoder;
    
    @InjectMocks
    private UserService userService;
    
    @Test
    void createUser_Success() {
        // Given
        User user = new User();
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setPassword("password");
        
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        
        // When
        User result = userService.createUser(user);
        
        // Then
        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        verify(passwordEncoder).encode("password");
        verify(userRepository).save(user);
    }
}
```

### 10.2 Integration Testing
```java
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AuthControllerIntegrationTest {
    
    @Autowired
    private TestRestTemplate restTemplate;
    
    @Test
    void login_Success() {
        // Given
        AuthRequest request = new AuthRequest("testuser", "password");
        
        // When
        ResponseEntity<ApiResponse<AuthResponse>> response = restTemplate.postForEntity(
            "/monitoringPlatform/auth/login",
            request,
            new ParameterizedTypeReference<ApiResponse<AuthResponse>>() {}
        );
        
        // Then
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody().isSuccess());
        assertNotNull(response.getBody().getData().getToken());
    }
}
```

## 11. Performance Considerations

### 11.1 Database Optimization
- **Indexes**: Create indexes on frequently queried columns
- **Connection Pooling**: Configure HikariCP for optimal connection management
- **Query Optimization**: Use JPA projections for selective data fetching

### 11.2 Frontend Optimization
- **Code Splitting**: Implement React.lazy() for component lazy loading
- **Memoization**: Use React.memo() and useMemo() for expensive computations
- **Bundle Optimization**: Configure webpack for optimal bundle size

### 11.3 WebRTC Optimization
- **ICE Server Configuration**: Use multiple STUN/TURN servers for better connectivity
- **Media Constraints**: Optimize video/audio quality based on network conditions
- **Connection Monitoring**: Implement connection quality monitoring and fallback mechanisms 