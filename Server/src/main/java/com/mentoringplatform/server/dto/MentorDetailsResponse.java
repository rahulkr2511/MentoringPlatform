package com.mentoringplatform.server.dto;

import lombok.Data;

@Data
public class MentorDetailsResponse {
    private Long id;
    private String username;
    private String email;
    private String name;
    private String expertise;
    private String availability;
    private Double hourlyRate;
    private String description;
    private boolean enabled;
} 