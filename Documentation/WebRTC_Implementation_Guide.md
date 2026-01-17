# How WebRTC Works in This Mentoring Platform

## Overview

WebRTC (Web Real-Time Communication) in this mentoring platform enables peer-to-peer video calls between mentors and mentees. The implementation uses a **signaling server** (WebSocket) to coordinate the connection establishment, then establishes direct peer-to-peer communication for media streams.

## Architecture Components

### 1. **Frontend Components**
- **WebRTCService.ts**: Core WebRTC logic and signaling
- **VideoCall.jsx**: UI component for video call interface
- **WebSocket Connection**: STOMP over SockJS for signaling

### 2. **Backend Components**
- **SignalingController.java**: Handles WebRTC signaling messages
- **WebSocketConfig.java**: WebSocket configuration
- **STOMP Message Broker**: Routes signaling messages between peers

## Complete WebRTC Flow

### **Phase 1: Initialization**

**1. User Joins Session**
```typescript
// In VideoCall.jsx
const initializeCall = async () => {
  const username = getCurrentUser();
  const targetUser = isMentor ? sessionData?.menteeUsername : sessionData?.mentorUsername;
  
  // Connect to WebSocket signaling server
  const connected = await webRTCService.connect(username, roomId, targetUser);
}
```

**2. WebSocket Connection Setup**
```typescript
// In WebRTCService.ts
public async connect(username: string, sessionId: string, targetUser: string): Promise<boolean> {
  const socket = new SockJS('http://localhost:8080/ws');
  this.stompClient = Stomp.over(socket);
  
  this.stompClient.connect({}, () => {
    // Subscribe to personal signaling topic
    this.stompClient?.subscribe(`/topic/signal/${username}`, (msg) => {
      const data: SignalMessage = JSON.parse(msg.body);
      this.handleSignal(data);
    });
    
    // Send join message
    this.sendMessage({
      type: 'join',
      from: username,
      to: targetUser,
      sessionId: sessionId
    });
  });
}
```

**3. Media Stream Initialization**
```typescript
// Request camera and microphone access
const localStream = await webRTCService.initializeLocalStream();

// In WebRTCService.ts
public async initializeLocalStream(): Promise<MediaStream> {
  this.localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
  
  // Setup peer connection
  this.setupPeerConnection();
  
  // Add tracks to peer connection
  this.localStream.getTracks().forEach(track => {
    this.peerConnection?.addTrack(track, this.localStream!);
  });
}
```

### **Phase 2: Peer Connection Setup**

**1. RTCPeerConnection Creation**
```typescript
private setupPeerConnection(): void {
  // Create peer connection with ICE servers
  this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
  
  // Handle remote stream reception
  this.peerConnection.ontrack = (event) => {
    this.remoteStream = event.streams[0];
    if (this.onRemoteStream) {
      this.onRemoteStream(this.remoteStream);
    }
  };
  
  // Handle ICE candidate generation
  this.peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      this.sendMessage({
        type: 'candidate',
        from: this.username,
        to: this.targetUser,
        sessionId: this.sessionId,
        candidate: event.candidate.candidate,
        sdpMid: event.candidate.sdpMid,
        sdpMLineIndex: event.candidate.sdpMLineIndex
      });
    }
  };
}
```

**2. ICE Server Configuration**
```typescript
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};
```

### **Phase 3: Signaling Process**

**1. Offer Creation (Mentor Initiates)**
```typescript
// Mentor starts the call
await webRTCService.startCall(isMentor);

// In WebRTCService.ts
public async startCall(isMentor: boolean = false): Promise<void> {
  if (isMentor) {
    // Create WebRTC offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    // Send offer via WebSocket
    this.sendMessage({
      type: 'offer',
      from: this.username,
      to: this.targetUser,
      sessionId: this.sessionId,
      sdp: offer.sdp
    });
  }
}
```

**2. Backend Signaling Routing**
```java
// In SignalingController.java
@MessageMapping("/signal")
public void handleSignal(SignalMessage message) {
    // Route message to target user
    String targetUser = message.getTo();
    messagingTemplate.convertAndSend("/topic/signal/" + targetUser, message);
}
```

**3. Answer Creation (Mentee Responds)**
```typescript
private async handleOffer(data: SignalMessage): Promise<void> {
  const offer = new RTCSessionDescription({
    type: 'offer',
    sdp: data.sdp
  });
  
  await this.peerConnection.setRemoteDescription(offer);
  
  // Create answer
  const answer = await this.peerConnection.createAnswer();
  await this.peerConnection.setLocalDescription(answer);
  
  // Send answer back
  this.sendMessage({
    type: 'answer',
    from: this.username,
    to: data.from,
    sessionId: this.sessionId,
    sdp: answer.sdp
  });
}
```

**4. Answer Processing (Mentor Receives)**
```typescript
private async handleAnswer(data: SignalMessage): Promise<void> {
  const answer = new RTCSessionDescription({
    type: 'answer',
    sdp: data.sdp
  });
  
  await this.peerConnection.setRemoteDescription(answer);
}
```

### **Phase 4: ICE Candidate Exchange**

**1. ICE Candidate Generation**
```typescript
// Automatically triggered when ICE candidates are discovered
this.peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    this.sendMessage({
      type: 'candidate',
      from: this.username,
      to: this.targetUser,
      sessionId: this.sessionId,
      candidate: event.candidate.candidate,
      sdpMid: event.candidate.sdpMid,
      sdpMLineIndex: event.candidate.sdpMLineIndex
    });
  }
};
```

**2. ICE Candidate Processing**
```typescript
private async handleCandidate(data: SignalMessage): Promise<void> {
  const candidate = new RTCIceCandidate({
    candidate: data.candidate,
    sdpMLineIndex: data.sdpMLineIndex,
    sdpMid: data.sdpMid
  });
  
  await this.peerConnection.addIceCandidate(candidate);
}
```

### **Phase 5: Media Stream Exchange**

**1. Remote Stream Reception**
```typescript
this.peerConnection.ontrack = (event) => {
  this.remoteStream = event.streams[0];
  if (this.onRemoteStream) {
    this.onRemoteStream(this.remoteStream);
  }
};
```

**2. Video Element Connection**
```typescript
// In VideoCall.jsx
webRTCService.setOnRemoteStream((stream) => {
  setRemoteStream(stream);
  if (remoteVideoRef.current) {
    remoteVideoRef.current.srcObject = stream;
  }
});
```

## Key Features

### **1. Session-Based Signaling**
- Each session has a unique `sessionId`
- Messages are scoped to session participants
- Prevents cross-session interference

### **2. Role-Based Call Initiation**
- **Mentor**: Initiates the call by creating an offer
- **Mentee**: Responds to the offer with an answer
- Clear role separation prevents conflicts

### **3. Media Controls**
```typescript
// Mute/Unmute
const handleMuteToggle = () => {
  const audioTrack = localStream.getAudioTracks()[0];
  audioTrack.enabled = !audioTrack.enabled;
  setIsMuted(!audioTrack.enabled);
};

// Video On/Off
const handleVideoToggle = () => {
  const videoTrack = localStream.getVideoTracks()[0];
  videoTrack.enabled = !videoTrack.enabled;
  setIsVideoOn(!videoTrack.enabled);
};

// Screen Sharing
const handleScreenShareToggle = async () => {
  const screenStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false
  });
  
  const videoTrack = screenStream.getVideoTracks()[0];
  const sender = webRTCService.getPeerConnection()?.getSenders()
    .find(s => s.track?.kind === 'video');
  
  if (sender) {
    sender.replaceTrack(videoTrack);
  }
};
```

### **4. Connection State Monitoring**
```typescript
// Monitor connection states
this.peerConnection.onconnectionstatechange = () => {
  const state = this.peerConnection?.connectionState;
  console.log('Connection state changed:', state);
};

this.peerConnection.oniceconnectionstatechange = () => {
  const state = this.peerConnection?.iceConnectionState;
  console.log('ICE connection state changed:', state);
};
```

### **5. Connection Resilience and Attempt Recreation**

This implementation includes robust reconnection and attempt recreation logic to maintain call stability:

- Deterministic initiator logic ensures only one side sends an offer when renegotiation is needed
- ICE restart is attempted on connection failure/disconnect to restore media flow
- Signaling reconnection uses exponential backoff with jitter and a configurable maximum attempts
- Peer connection is recreated if missing, and local tracks are re-added automatically
- Pending ICE candidates are buffered and processed after remote description is set

```23:48:Client/src/services/WebRTCService.ts
// Decide initiator deterministically by comparing usernames
private isDeterministicInitiator(): boolean {
  if (!this.username || !this.targetUser) return false;
  return this.username.localeCompare(this.targetUser) < 0;
}
```

```540:556:Client/src/services/WebRTCService.ts
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

```490:526:Client/src/services/WebRTCService.ts
// Exponential backoff reconnect for signaling
private scheduleReconnect(): void {
  if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    return;
  }
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

## Message Types

### **Signaling Messages**
```typescript
interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
  from: string;        // Sender username
  to: string;          // Receiver username
  sessionId: string;   // Session identifier
  sdp?: string;        // Session Description Protocol
  candidate?: string;  // ICE candidate
  sdpMid?: string;     // SDP media ID
  sdpMLineIndex?: number; // SDP media line index
}
```

### **Message Flow**
1. **join**: User joins session
2. **offer**: Mentor creates and sends offer
3. **answer**: Mentee responds with answer
4. **candidate**: ICE candidates exchanged (multiple)
5. **leave**: User leaves session

## WebSocket Configuration

### **Backend Configuration**
```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    
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

### **Frontend Connection**
```typescript
// Connect to WebSocket endpoint
const socket = new SockJS('http://localhost:8080/ws');
this.stompClient = Stomp.over(socket);

// Subscribe to personal topic
this.stompClient?.subscribe(`/topic/signal/${username}`, (msg) => {
  const data: SignalMessage = JSON.parse(msg.body);
  this.handleSignal(data);
});

// Send messages to application destination
this.stompClient.send('/app/signal', {}, JSON.stringify(message));
```

## NAT Traversal

### **ICE Servers**
- **STUN Servers**: Help discover public IP addresses
- **Google STUN**: Free, reliable servers for NAT traversal
- **No TURN Server**: Current limitation for restrictive firewalls

### **ICE Process**
1. **Host Candidates**: Local network interfaces
2. **Server Reflexive**: Public IP via STUN servers
3. **Candidate Exchange**: Multiple candidates tested
4. **Best Path Selection**: Optimal connection chosen

## Error Handling

### **Connection Failures**
```typescript
// Handle connection state changes
this.peerConnection.onconnectionstatechange = () => {
  const state = this.peerConnection?.connectionState;
  
  switch (state) {
    case 'failed':
      console.log('Connection failed');
      // Attempt reconnection
      break;
    case 'disconnected':
      console.log('Connection lost');
      // Handle disconnection
      break;
  }
};
```

### **Media Device Errors**
```typescript
try {
  this.localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });
} catch (error) {
  if (error.name === 'NotAllowedError') {
    throw new Error('Camera/microphone access denied');
  } else if (error.name === 'NotFoundError') {
    throw new Error('No camera/microphone found');
  }
}
```

## Cleanup and Resource Management

### **Stream Cleanup**
```typescript
public stopStreams(): void {
  if (this.localStream) {
    this.localStream.getTracks().forEach(track => track.stop());
    this.localStream = null;
  }
  if (this.remoteStream) {
    this.remoteStream.getTracks().forEach(track => track.stop());
    this.remoteStream = null;
  }
  if (this.peerConnection) {
    this.peerConnection.close();
    this.peerConnection = null;
  }
}
```

### **WebSocket Disconnection**
```typescript
public disconnect(): void {
  if (this.stompClient) {
    this.sendMessage({
      type: 'leave',
      from: this.username,
      to: this.targetUser,
      sessionId: this.sessionId
    });
    this.stompClient.disconnect();
    this.stompClient = null;
  }
}
```

## Current Limitations

1. **No TURN Server**: Cannot handle restrictive firewalls
2. **Limited Reconnection Scope**: Reconnect covers signaling and ICE restart, but no TURN fallback
3. **No Quality Adaptation**: No adaptive bitrate based on network
4. **No Recording**: No session recording capability
5. **Basic Error Handling**: Limited error recovery mechanisms

## Summary

The WebRTC implementation in this mentoring platform provides:

- **Peer-to-peer video calls** between mentors and mentees
- **WebSocket signaling** for connection coordination
- **Session-based communication** with proper isolation
- **Media controls** (mute, video toggle, screen sharing)
- **Connection monitoring** and state management
- **Resource cleanup** and proper disconnection

The system successfully establishes direct peer-to-peer connections for efficient video communication while using a signaling server only for the initial handshake process.

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mentor        │    │   Signaling     │    │   Mentee        │
│   (Browser)     │    │   Server        │    │   (Browser)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. WebSocket Connect  │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │ 2. Join Session       │                       │
         ├──────────────────────►│                       │
         │                       │                       │
         │ 3. GetUserMedia()     │                       │
         │ (Camera/Mic Access)   │                       │
         │                       │                       │
         │ 4. Create Offer       │                       │
         ├──────────────────────►│ 5. Forward Offer      │
         │                       ├──────────────────────►│
         │                       │                       │
         │                       │ 6. Send Answer        │
         │ 7. Receive Answer     ◄──────────────────────┤
         ◄───────────────────────│                       │
         │                       │                       │
         │ 8. ICE Candidates     │                       │
         │ (Multiple Exchange)   │                       │
         │                       │                       │
         │                       │                       │
         │ 9. Direct P2P         │                       │
         │ Video/Audio Stream    │                       │
         ├──────────────────────────────────────────────►│
         │                       │                       │
         │                       │                       │
         │                       │                       │
```

## Implementation Files

### Frontend Files
- `Client/src/services/WebRTCService.ts` - Core WebRTC logic
- `Client/src/components/VideoCall.jsx` - Video call UI component
- `Client/src/services/Services.ts` - API service layer

### Backend Files
- `Server/src/main/java/com/mentoringplatform/server/controller/SignalingController.java` - Signaling controller
- `Server/src/main/java/com/mentoringplatform/server/config/WebSocketConfig.java` - WebSocket configuration
- `Server/src/main/java/com/mentoringplatform/server/dto/SignalMessage.java` - Signaling message DTO

## Dependencies

### Frontend Dependencies
```json
{
  "sockjs-client": "^1.6.1",
  "@stomp/stompjs": "^7.0.0"
}
```

### Backend Dependencies
```xml
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-websocket</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-messaging</artifactId>
</dependency>
```

## Testing WebRTC

### Manual Testing Steps
1. **Start the application** with both frontend and backend running
2. **Create two user accounts** - one mentor, one mentee
3. **Book a session** as mentee with the mentor
4. **Join the session** from both accounts
5. **Verify video/audio** is working in both directions
6. **Test media controls** (mute, video toggle, screen share)
7. **Test connection states** and error handling

### Browser Compatibility
- **Chrome**: Full WebRTC support
- **Firefox**: Full WebRTC support
- **Safari**: WebRTC support (may require HTTPS)
- **Edge**: Full WebRTC support

### Network Requirements
- **HTTPS**: Required for getUserMedia() in production
- **STUN Servers**: Must be accessible for NAT traversal
- **WebSocket**: Must be able to connect to signaling server
- **Bandwidth**: Minimum 1 Mbps for video calls

## Troubleshooting

### Common Issues

**1. Camera/Microphone Access Denied**
- Ensure HTTPS in production
- Check browser permissions
- Verify device availability

**2. WebSocket Connection Failed**
- Check server is running on port 8080
- Verify CORS configuration
- Check firewall settings

**3. ICE Connection Failed**
- Verify STUN servers are accessible
- Check network configuration
- Consider TURN server for restrictive networks

**4. No Remote Stream**
- Check signaling message flow
- Verify peer connection state
- Check browser console for errors

### Debug Tools
- **Browser DevTools**: Network tab for WebSocket messages
- **Console Logs**: Detailed logging in WebRTCService
- **WebRTC Stats**: Use `peerConnection.getStats()` for connection metrics
- **Network Inspector**: Check ICE candidate exchange

## Future Enhancements

### Planned Features
1. **TURN Server Integration**: Handle restrictive firewalls
2. **Connection Quality Monitoring**: Adaptive bitrate
3. **Session Recording**: Record video calls with consent
4. **Reconnection Logic**: Automatic reconnection on failures
5. **Mobile Support**: React Native implementation

### Performance Optimizations
1. **Connection Pooling**: Reuse WebSocket connections
2. **Message Compression**: Reduce signaling overhead
3. **Quality Adaptation**: Dynamic quality based on network
4. **Caching**: Cache ICE candidates and SDP offers
5. **Monitoring**: Real-time connection quality metrics
