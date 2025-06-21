package com.mentoringplatform.server.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AvailabilitySlot {
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean available;
    private String formattedTime;
} 