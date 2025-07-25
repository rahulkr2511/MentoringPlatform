import SockJS from 'sockjs-client';
import { CompatClient, Stomp } from '@stomp/stompjs';

// WebRTC Configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ]
};

// Message types for signaling
export interface SignalMessage {
  type: 'offer' | 'answer' | 'candidate' | 'join' | 'leave';
  from: string;
  to: string;
  sessionId: string;
  sdp?: string;
  candidate?: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
}

// WebRTC Service Class
export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private stompClient: CompatClient | null = null;
  private isConnected = false;
  private username = '';
  private sessionId = '';
  private targetUser = '';
  private onLocalStream: ((stream: MediaStream) => void) | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChange: ((state: string) => void) | null = null;
  private onIceConnectionStateChange: ((state: string) => void) | null = null;
  private pendingCandidates: SignalMessage[] = [];

  constructor() {
    // Don't setup peer connection in constructor - wait until we have a stream
  }

  // Initialize WebSocket connection
  public async connect(username: string, sessionId: string, targetUser: string): Promise<boolean> {
    // If already connected, return true
    if (this.isConnected && this.stompClient && this.stompClient.connected) {
      console.log('Already connected to WebSocket');
      return true;
    }

    this.username = username;
    this.sessionId = sessionId;
    this.targetUser = targetUser;

    return new Promise((resolve) => {
      const socket = new SockJS('http://localhost:8080/ws');
      this.stompClient = Stomp.over(socket);

      this.stompClient.connect({}, () => {
        console.log('WebSocket connected successfully');
        
        // Subscribe to signaling messages
        this.stompClient?.subscribe(`/topic/signal/${username}`, (msg) => {
          console.log('Received message on topic:', `/topic/signal/${username}`);
          const data: SignalMessage = JSON.parse(msg.body);
          this.handleSignal(data);
        });

        // Send join message after a short delay to ensure connection is ready
        setTimeout(() => {
          this.sendMessage({
            type: 'join',
            from: username,
            to: targetUser,
            sessionId: sessionId
          });
        }, 100);

        this.isConnected = true;
        resolve(true);
      }, (error) => {
        console.error('WebSocket connection failed:', error);
        this.isConnected = false;
        resolve(false);
      });
    });
  }

  // Disconnect from WebSocket
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
    this.isConnected = false;
  }

  // Initialize local media stream
  public async initializeLocalStream(): Promise<MediaStream> {
    try {
      console.log('Requesting media devices...');
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      console.log('Local stream obtained:', this.localStream);
      console.log('Local stream tracks:', this.localStream.getTracks());

      // Setup peer connection after we have the stream
      this.setupPeerConnection();

      // Add local stream tracks to peer connection
      if (this.peerConnection && this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
        console.log('Local tracks added to peer connection');
      }

      if (this.onLocalStream) {
        console.log('Calling onLocalStream callback');
        this.onLocalStream(this.localStream);
      } else {
        console.warn('No onLocalStream callback set');
      }

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  // Start call (create and send offer)
  public async startCall(isMentor: boolean = false): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized. Make sure to call initializeLocalStream() first.');
    }
    
    if (!this.localStream) {
      throw new Error('Local stream not initialized. Make sure to call initializeLocalStream() first.');
    }

    try {
      // Mentor initiates the call, mentee responds
      if (isMentor) {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.sendMessage({
          type: 'offer',
          from: this.username,
          to: this.targetUser,
          sessionId: this.sessionId,
          sdp: offer.sdp
        });
      }
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  // Handle incoming signals
  private async handleSignal(data: SignalMessage): Promise<void> {
    try {
      console.log('Received signal:', data.type, 'from:', data.from, 'to:', data.to);
      
      switch (data.type) {
        case 'join':
          console.log('User joined:', data.from);
          break;
          
        case 'offer':
          await this.handleOffer(data);
          break;
          
        case 'answer':
          await this.handleAnswer(data);
          break;
          
        case 'candidate':
          await this.handleCandidate(data);
          break;
          
        case 'leave':
          console.log('User left:', data.from);
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  }

  private async handleOffer(data: SignalMessage): Promise<void> {
    try {
      console.log('Handling offer from:', data.from);
      
      if (!this.peerConnection) {
        console.warn('Peer connection not initialized');
        return;
      }

      // Check if we already have a remote description
      if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type === 'offer') {
        console.log('Already have remote offer, ignoring duplicate');
        return;
      }

      const offer = new RTCSessionDescription({
        type: 'offer',
        sdp: data.sdp
      });

      await this.peerConnection.setRemoteDescription(offer);
      console.log('Remote description set successfully');
      
      // Process any pending candidates
      await this.processPendingCandidates();

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      this.sendMessage({
        type: 'answer',
        from: this.username,
        to: data.from,
        sessionId: this.sessionId,
        sdp: answer.sdp
      });

      console.log('Answer sent to:', data.from);
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleAnswer(data: SignalMessage): Promise<void> {
    try {
      console.log('Handling answer from:', data.from);
      
      if (!this.peerConnection) {
        console.warn('Peer connection not initialized');
        return;
      }

      // Check if we already have a remote description
      if (this.peerConnection.remoteDescription && this.peerConnection.remoteDescription.type === 'answer') {
        console.log('Already have remote answer, ignoring duplicate');
        return;
      }

      const answer = new RTCSessionDescription({
        type: 'answer',
        sdp: data.sdp
      });

      await this.peerConnection.setRemoteDescription(answer);
      console.log('Remote answer set successfully');
      
      // Process any pending candidates
      await this.processPendingCandidates();
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private async processPendingCandidates(): Promise<void> {
    if (!this.pendingCandidates.length || !this.peerConnection) {
      return;
    }

    console.log('Processing pending candidates:', this.pendingCandidates.length);
    
    for (const candidateData of this.pendingCandidates) {
      try {
        const candidate = new RTCIceCandidate({
          candidate: candidateData.candidate,
          sdpMLineIndex: candidateData.sdpMLineIndex,
          sdpMid: candidateData.sdpMid
        });

        await this.peerConnection.addIceCandidate(candidate);
        console.log('Pending ICE candidate added successfully');
      } catch (error) {
        console.error('Error adding pending ICE candidate:', error);
      }
    }

    this.pendingCandidates = [];
  }

  private async handleCandidate(data: SignalMessage): Promise<void> {
    try {
      console.log('Handling ICE candidate from:', data.from);
      
      if (!this.peerConnection) {
        console.warn('Peer connection not initialized');
        return;
      }

      // Check if peer connection is in a valid state to add candidates
      if (this.peerConnection.remoteDescription) {
        const candidate = new RTCIceCandidate({
          candidate: data.candidate,
          sdpMLineIndex: data.sdpMLineIndex,
          sdpMid: data.sdpMid
        });

        await this.peerConnection.addIceCandidate(candidate);
        console.log('ICE candidate added successfully');
      } else {
        console.log('Remote description not set yet, storing candidate');
        // Store candidate for later if remote description isn't set yet
        if (!this.pendingCandidates) {
          this.pendingCandidates = [];
        }
        this.pendingCandidates.push(data);
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  // Setup peer connection with event handlers
  private setupPeerConnection(): void {
    console.log('Setting up peer connection');
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      console.log('Remote stream tracks:', event.streams[0]?.getTracks());
      this.remoteStream = event.streams[0];
      if (this.onRemoteStream) {
        console.log('Calling onRemoteStream callback');
        this.onRemoteStream(this.remoteStream);
      } else {
        console.warn('No onRemoteStream callback set');
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('Sending ICE candidate');
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

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state changed:', state);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(state || 'unknown');
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('ICE connection state changed:', state);
      if (this.onIceConnectionStateChange) {
        this.onIceConnectionStateChange(state || 'unknown');
      }
    };
  }

  // Send message via WebSocket
  private sendMessage(message: SignalMessage): void {
    if (this.stompClient && this.isConnected && this.stompClient.connected) {
      console.log('Sending signal:', message.type, 'from:', message.from, 'to:', message.to);
      this.stompClient.send('/app/signal', {}, JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  // Set callbacks
  public setOnLocalStream(callback: (stream: MediaStream) => void): void {
    console.log('Setting onLocalStream callback');
    this.onLocalStream = callback;
  }

  public setOnRemoteStream(callback: (stream: MediaStream) => void): void {
    console.log('Setting onRemoteStream callback');
    this.onRemoteStream = callback;
  }

  public setOnConnectionStateChange(callback: (state: string) => void): void {
    this.onConnectionStateChange = callback;
  }

  public setOnIceConnectionStateChange(callback: (state: string) => void): void {
    this.onIceConnectionStateChange = callback;
  }

  // Get current streams
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // Get peer connection
  public getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  // Stop all tracks
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

  // Check if connected
  public isWebSocketConnected(): boolean {
    return this.isConnected;
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService(); 
