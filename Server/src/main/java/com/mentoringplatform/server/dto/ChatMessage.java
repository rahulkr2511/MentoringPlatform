package com.mentoringplatform.server.dto;

import lombok.Data;

@Data
public class ChatMessage {
    private String sessionId;
    private String sender;        // userId or username
    private String content;       // message body
    private String timestamp;     // ISO format
} 