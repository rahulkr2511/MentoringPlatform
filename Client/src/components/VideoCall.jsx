import React, { useState, useRef, useEffect } from 'react';
import Chat from './Chat';
import '../styles/Dashboard.css';

const VideoCall = ({ 
  selectedMentor, 
  roomId, 
  onEndCall, 
  isMentor = false 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Simulate video stream initialization
  useEffect(() => {
    // In a real implementation, this would initialize WebRTC streams
    // For now, we'll simulate the video elements
    const timer = setTimeout(() => {
      setLocalStream('local');
      setRemoteStream('remote');
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  const handleVideoToggle = () => {
    setIsVideoOn(!isVideoOn);
  };

  const handleScreenShareToggle = () => {
    setIsScreenSharing(!isScreenSharing);
  };

  const handleEndCall = () => {
    if (onEndCall) {
      onEndCall();
    }
  };

  return (
    <div className="video-call-container">
      <div className="video-call-header">
        <div className="header-left">
          <h3>
            {isMentor 
              ? `Video Session with Mentee` 
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
            {localStream && isVideoOn ? (
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
                  backgroundColor: '#000'
                }}
              >
                <source src="" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="video-placeholder">
                <p>Your Video Stream</p>
                <p>Camera and microphone access required</p>
                {!isVideoOn && <div className="video-off-overlay">Camera Off</div>}
              </div>
            )}
            <div className="video-controls">
              <button 
                className={`btn mute-btn ${isMuted ? 'active' : ''}`}
                onClick={handleMuteToggle}
                aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
              >
                <span className="shine-effect"></span>
                <span className="tooltip-text">{isMuted ? 'Click to unmute microphone' : 'Click to mute microphone'}</span>
                {isMuted ? '🔇' : '🎤'}
              </button>
              <button 
                className={`btn video-btn ${!isVideoOn ? 'active' : ''}`}
                onClick={handleVideoToggle}
                aria-label={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                <span className="shine-effect"></span>
                <span className="tooltip-text">{isVideoOn ? 'Click to turn off camera' : 'Click to turn on camera'}</span>
                {isVideoOn ? '📹' : '📷'}
              </button>
              <button 
                className={`btn screen-btn ${isScreenSharing ? 'active' : ''}`}
                onClick={handleScreenShareToggle}
                aria-label={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
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
              >
                <source src="" type="video/webm" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="video-placeholder">
                <p>{isMentor ? 'Mentee Video Stream' : 'Mentor Video Stream'}</p>
                <p>Waiting for {isMentor ? 'mentee' : 'mentor'} to join...</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="chat-section">
          <Chat 
            sessionId={roomId}
            participantName={isMentor ? "Mentee" : selectedMentor?.name}
            isMentor={isMentor}
          />
        </div>
      </div>
    </div>
  );
};

export default VideoCall; 