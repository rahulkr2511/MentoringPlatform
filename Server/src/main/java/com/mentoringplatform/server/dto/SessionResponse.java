package com.mentoringplatform.server.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionResponse {
    private Long id;
    private Long mentorId;
    private String mentorName;
    private String mentorUsername;
    private Long menteeId;
    private String menteeName;
    private String menteeUsername;
    private LocalDateTime scheduledDateTime;
    private Integer durationMinutes;
    private String status;
    private String sessionType;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 