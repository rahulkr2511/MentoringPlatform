package com.mentoringplatform.server.dto;

import lombok.Data;

@Data
public class SignalMessage {
    private String type; // "offer", "answer", "candidate", "join", "leave"
    private String from;
    private String to;
    private String sessionId;
    private String sdp;
    private String candidate;
    private String sdpMid;
    private Integer sdpMLineIndex;
} 