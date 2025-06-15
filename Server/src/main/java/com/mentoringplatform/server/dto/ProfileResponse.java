package com.mentoringplatform.server.dto;

import lombok.Data;

@Data
public class ProfileResponse {
    private String name;
    private String expertise;
    private String availability;
    private Double hourlyRate;
    private String description;
    private String username;
    private String email;
} 