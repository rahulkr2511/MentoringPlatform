package com.mentoringplatform.server.controller;

import com.mentoringplatform.server.dto.ApiResponse;
import com.mentoringplatform.server.dto.MentorDetailsResponse;
import com.mentoringplatform.server.service.MentorService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/monitoringPlatform/mentee")
@CrossOrigin(origins = "*")
public class MenteeDashboardController {

    private final MentorService mentorService;

    public MenteeDashboardController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @GetMapping("/mentors")
    @PreAuthorize("hasRole('MENTEE')")
    public ResponseEntity<ApiResponse<List<MentorDetailsResponse>>> getAvailableMentors() {
        try {
            List<MentorDetailsResponse> mentors = mentorService.getAllAvailableMentors();
            return ResponseEntity.ok(ApiResponse.success(mentors, "Available mentors retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve mentors: " + e.getMessage()));
        }
    }

    @GetMapping("/mentors/all")
    @PreAuthorize("hasRole('MENTEE')")
    public ResponseEntity<ApiResponse<List<MentorDetailsResponse>>> getAllMentors() {
        try {
            List<MentorDetailsResponse> mentors = mentorService.getAllMentors();
            return ResponseEntity.ok(ApiResponse.success(mentors, "All mentors retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve mentors: " + e.getMessage()));
        }
    }
} 