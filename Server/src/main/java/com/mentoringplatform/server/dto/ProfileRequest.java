package com.mentoringplatform.server.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ProfileRequest {
    
    @NotBlank(message = "Name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String name;
    
    @NotBlank(message = "Expertise is required")
    @Size(min = 5, max = 200, message = "Expertise must be between 5 and 200 characters")
    private String expertise;
    
    @NotBlank(message = "Availability is required")
    @Size(min = 5, max = 200, message = "Availability must be between 5 and 200 characters")
    private String availability;
    
    @NotNull(message = "Hourly rate is required")
    @Positive(message = "Hourly rate must be positive")
    private Double hourlyRate;
    
    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;
} 