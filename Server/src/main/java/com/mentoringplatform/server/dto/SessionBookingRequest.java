package com.mentoringplatform.server.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SessionBookingRequest {
    
    @NotNull(message = "Mentor ID is required")
    private Long mentorId;
    
    @NotNull(message = "Scheduled date and time is required")
    private LocalDateTime scheduledDateTime;
    
    @NotNull(message = "Duration is required")
    @Min(value = 15, message = "Minimum session duration is 15 minutes")
    @Max(value = 240, message = "Maximum session duration is 4 hours")
    private Integer durationMinutes;
    
    private String sessionType = "VIDEO_CALL";
    
    private String notes;
} 