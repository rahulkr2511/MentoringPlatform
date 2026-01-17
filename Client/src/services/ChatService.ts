import SockJS from 'sockjs-client';
import { CompatClient, Stomp } from '@stomp/stompjs';
import { WS_BASE_URL } from '../config/env';

export interface ChatMessage {
  sessionId: string;
  sender: string;        // userId or username
  content: string;       // message body
  timestamp: string;     // ISO format
}

export class ChatService {
  private stompClient: CompatClient | null = null;
  private isConnected = false;
  private sessionId = '';
  private username = '';
  private onMessageReceived: ((message: ChatMessage) => void) | null = null;

  constructor() {}

  public async connect(sessionId: string, username: string): Promise<boolean> {
    console.log('ChatService.connect called with sessionId:', sessionId, 'username:', username);
    
    if (this.isConnected && this.stompClient && this.stompClient.connected) {
      console.log('Chat service already connected');
      return true;
    }

    this.sessionId = sessionId;
    this.username = username;

    return new Promise((resolve) => {
      console.log('Creating SockJS connection...');
      const socket = new SockJS(WS_BASE_URL);
      this.stompClient = Stomp.over(socket);

      // Add authorization header
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      console.log('Connecting with headers:', headers);

      this.stompClient.connect(headers, () => {
        console.log('Chat WebSocket connected successfully');
        console.log('Subscribing to topic:', `/topic/chat/${sessionId}`);
        
        // Subscribe to chat topic for this session
        this.stompClient?.subscribe(`/topic/chat/${sessionId}`, (msg) => {
          console.log('Received chat message:', msg.body);
          const chatMessage: ChatMessage = JSON.parse(msg.body);
          if (this.onMessageReceived) {
            this.onMessageReceived(chatMessage);
          }
        });

        this.isConnected = true;
        resolve(true);
      }, (error) => {
        console.error('Chat WebSocket connection failed:', error);
        this.isConnected = false;
        resolve(false);
      });
    });
  }

  public disconnect(): void {
    if (this.stompClient) {
      this.stompClient.disconnect();
      this.stompClient = null;
    }
    this.isConnected = false;
  }

  public sendMessage(content: string): boolean {
    console.log('ChatService.sendMessage called with content:', content);
    console.log('Current state - stompClient:', !!this.stompClient, 'isConnected:', this.isConnected);
    
    if (!this.stompClient || !this.isConnected) {
      console.warn('Chat WebSocket not connected, cannot send message');
      return false;
    }

    const message: ChatMessage = {
      sessionId: this.sessionId,
      sender: this.username,
      content: content,
      timestamp: new Date().toISOString()
    };

    console.log('Sending chat message:', message);
    this.stompClient.send('/app/chat.send', {}, JSON.stringify(message));
    return true;
  }

  public setOnMessageReceived(callback: (message: ChatMessage) => void): void {
    this.onMessageReceived = callback;
  }

  public isConnectedToChat(): boolean {
    return this.isConnected && this.stompClient?.connected === true;
  }
}

// Export a singleton instance
export const chatService = new ChatService(); 