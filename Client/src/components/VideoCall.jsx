import React, { useState, useRef, useEffect } from 'react';
import { AuthService } from '../services/Services.ts';
import { webRTCService } from '../services/WebRTCService.ts';
import Chat from './Chat';
import { useNotificationContext } from '../contexts/NotificationContext';
import '../styles/Dashboard.css';

const VideoCall = ({ 
  selectedMentor, 
  roomId, 
  onEndCall, 
  isMentor = false,
  sessionData = null
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const { showError } = useNotificationContext();

  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Get current user
  const getCurrentUser = () => {
    const storedUser = AuthService.getStoredUser();
    console.log('Stored user data:', storedUser);
    console.log('Current user from AuthService:', storedUser ? storedUser.username : 'unknown');
    return storedUser ? storedUser.username : 'unknown';
  };

  // Initialize WebRTC connection only when roomId is provided (session joined)
  useEffect(() => {
    let isInitialized = false;

    const initializeCall = async () => {
      if (!roomId || isInitialized) return;

      try {
        const username = getCurrentUser();
        // Use session data to determine target user - use actual usernames, not display names
        let targetUser;
        if (isMentor) {
          // For mentor, target should be the mentee's username
          targetUser = sessionData?.menteeUsername || 'mentee';
        } else {
          // For mentee, target should be the mentor's username  
          targetUser = sessionData?.mentorUsername || 'mentor';
        }

        // Validate that the current user matches the expected user for this session
        const expectedUsername = isMentor ? sessionData?.mentorUsername : sessionData?.menteeUsername;
        if (username !== expectedUsername) {
          console.error('User mismatch!', {
            currentUser: username,
            expectedUser: expectedUsername,
            isMentor,
            sessionData
          });
          
          // Show user-friendly error message
          const errorMessage = `Authentication Error: You are logged in as "${username}" but this session requires "${expectedUsername}". Please log out and log in with the correct account.`;
          showError(errorMessage);
          
          // Clear authentication and redirect to login
          AuthService.logout();
          window.location.href = '/';
          return;
        }

        console.log('Initializing call:', {
          username,
          roomId,
          targetUser,
          isMentor,
          sessionData
        });

        // Debug session data structure
        console.log('Session data details:', {
          mentorUsername: sessionData?.mentorUsername,
          menteeUsername: sessionData?.menteeUsername,
          mentorName: sessionData?.mentorName,
          menteeName: sessionData?.menteeName
        });

        // Debug authentication
        console.log('Authentication debug:', {
          isMentor,
          currentUsername: username,
          expectedMenteeUsername: sessionData?.menteeUsername,
          expectedMentorUsername: sessionData?.mentorUsername,
          localStorage: {
            user: localStorage.getItem('user'),
            token: localStorage.getItem('token') ? 'present' : 'missing'
          }
        });

        // Connect to WebSocket
        const connected = await webRTCService.connect(username, roomId, targetUser);
        if (!connected) {
          throw new Error('Failed to connect to signaling server');
        }

        // Set up callbacks
        webRTCService.setOnLocalStream((stream) => {
          console.log('Local stream received:', stream);
          setLocalStream(stream);
          // Ensure video element is connected to stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
            console.log('Local video element connected to stream');
          } else {
            console.warn('Local video ref not available');
          }
        });

        webRTCService.setOnRemoteStream((stream) => {
          console.log('Remote stream received:', stream);
          setRemoteStream(stream);
          // Ensure video element is connected to stream
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
            console.log('Remote video element connected to stream');
          } else {
            console.warn('Remote video ref not available');
          }
        });

        // Initialize local media stream (this also sets up the peer connection)
        const localStream = await webRTCService.initializeLocalStream();
        console.log('Local stream initialized:', localStream);
        
        // Manually set the local stream if callback didn't work
        if (!localStream) {
          console.warn('No local stream received from service');
        } else {
          setLocalStream(localStream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = localStream;
            console.log('Manually connected local video element');
          }
        }

        // Start the call (mentor initiates, mentee responds)
        await webRTCService.startCall(isMentor);

        isInitialized = true;

      } catch (error) {
        console.error('Error initializing call:', error);
      }
    };

    // Only initialize if we have a roomId (meaning a session was joined)
    if (roomId) {
      initializeCall();
    }

    // Cleanup on unmount or when roomId changes
    return () => {
      if (isInitialized) {
        webRTCService.disconnect();
        webRTCService.stopStreams();
      }
    };
  }, [roomId, isMentor, selectedMentor]);

  // Ensure video elements are connected to streams when they change
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      console.log('Connecting local stream to video element');
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('Connecting remote stream to video element');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Handle video element reconnection when video is turned back on
  useEffect(() => {
    if (isVideoOn && localStream && localVideoRef.current) {
      console.log('Reconnecting video element - video turned back on');
      localVideoRef.current.srcObject = localStream;
    }
  }, [isVideoOn, localStream]);

  // Debug stream states
  useEffect(() => {
    console.log('Stream states updated:', {
      localStream: !!localStream,
      remoteStream: !!remoteStream,
      isVideoOn,
      isMuted
    });
  }, [localStream, remoteStream, isVideoOn, isMuted]);

  const handleMuteToggle = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleVideoToggle = () => {
    console.log('Video toggle clicked. Current state:', { isVideoOn, hasLocalStream: !!localStream });
    
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        const newEnabledState = !videoTrack.enabled;
        console.log('Toggling video track from', videoTrack.enabled, 'to', newEnabledState);
        
        videoTrack.enabled = newEnabledState;
        setIsVideoOn(newEnabledState);
        
        // If video is being turned back on, ensure video element is connected
        if (newEnabledState && localVideoRef.current) {
          console.log('Reconnecting video element after toggle');
          // Small delay to ensure the video element is ready
          setTimeout(() => {
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStream;
              console.log('Video element reconnected after delay');
            }
          }, 100);
        }
      } else {
        console.warn('No video track found in local stream');
      }
    } else {
      console.warn('No local stream available for video toggle');
    }
  };

  const handleScreenShareToggle = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });

        // Replace video track with screen share
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = webRTCService.getPeerConnection()?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        setIsScreenSharing(true);
      } else {
        // Restore camera video
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = webRTCService.getPeerConnection()?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        setIsScreenSharing(false);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  };

  const handleEndCall = () => {
    webRTCService.disconnect();
    webRTCService.stopStreams();
    if (onEndCall) {
      onEndCall();
    }
  };



  // Debug logging for participant names
  console.log('VideoCall component debug:', {
    isMentor,
    selectedMentor,
    participantName: isMentor ? (selectedMentor?.name || "Mentee") : selectedMentor?.name,
    sessionData: sessionData ? {
      mentorUsername: sessionData.mentorUsername,
      menteeUsername: sessionData.menteeUsername,
      mentorName: sessionData.mentorName,
      menteeName: sessionData.menteeName
    } : null
  });

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <div className="header-left">
          <h3>
            {isMentor 
              ? `Video Session with ${selectedMentor?.name || 'Mentee'}` 
              : `Video Session with ${selectedMentor?.name || 'Mentor'}`
            }
          </h3>
          <div className="call-info">
            <span className="call-status">Active</span>
          </div>
        </div>
        <div className="header-right">
          <button 
            className="btn btn-danger"
            onClick={handleEndCall}
          >
            End Call
          </button>
        </div>
      </div>
      
      <div className="video-call-content">
        <div className="video-streams">
          <div className="video-stream">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="video-element"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  backgroundColor: '#000',
                  display: isVideoOn ? 'block' : 'none'
                }}
                onLoadedMetadata={() => console.log('Local video loaded metadata')}
                onCanPlay={() => console.log('Local video can play')}
                onError={(e) => console.error('Local video error:', e)}
              />
            ) : null}
            
            {(!localStream || !isVideoOn) && (
              <div className="video-placeholder">
                <p>Your Video Stream</p>
                <p>Camera and microphone access required</p>
                {!isVideoOn && localStream && <div className="video-off-overlay">Camera Off</div>}
                {!localStream && <div className="no-stream">No local stream available</div>}
              </div>
            )}
            <div className="video-controls">
              <button 
                className={`btn mute-btn ${isMuted ? 'active' : ''}`}
                onClick={handleMuteToggle}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                disabled={!localStream}
              >
                <span className="shine-effect"></span>
                <span className="tooltip-text">{isMuted ? 'Click to unmute microphone' : 'Click to mute microphone'}</span>
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button 
                className={`btn video-btn ${!isVideoOn ? 'active' : ''}`}
                onClick={handleVideoToggle}
                aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                disabled={!localStream}
              >
                <span className="shine-effect"></span>
                <span className="tooltip-text">{isVideoOn ? 'Click to turn off camera' : 'Click to turn on camera'}</span>
                {isVideoOn ? '📹' : '📷'}
              </button>
              <button 
                className={`btn screen-btn ${isScreenSharing ? 'active' : ''}`}
                onClick={handleScreenShareToggle}
                aria-label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
                disabled={!localStream}
              >
                <span className="shine-effect"></span>
                <span className="tooltip-text">{isScreenSharing ? 'Click to stop screen sharing' : 'Click to share your screen'}</span>
                {isScreenSharing ? '🖥️' : '💻'}
              </button>
            </div>
          </div>
          
          <div className="video-stream">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="video-element"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  backgroundColor: '#000'
                }}
                onLoadedMetadata={() => console.log('Remote video loaded metadata')}
                onCanPlay={() => console.log('Remote video can play')}
                onError={(e) => console.error('Remote video error:', e)}
              />
            ) : (
              <div className="video-placeholder">
                <p>{isMentor ? 'Mentee Video Stream' : 'Mentor Video Stream'}</p>
                <p>Waiting for {isMentor ? 'mentee' : 'mentor'} to join...</p>
                <div className="no-stream">No remote stream available</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="chat-section">
          <Chat 
            sessionId={sessionData?.id?.toString() || roomId}
            participantName={isMentor ? (selectedMentor?.name || "Mentee") : selectedMentor?.name}
            isMentor={isMentor}
            currentUsername={getCurrentUser()?.username || AuthService.getStoredUser()?.username}
            sessionData={sessionData}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCall;