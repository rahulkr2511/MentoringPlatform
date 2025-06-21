package com.mentoringplatform.server.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class MentorAvailabilityRequest {
    private Long mentorId;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer durationMinutes = 60; // Default 1 hour slots
} 