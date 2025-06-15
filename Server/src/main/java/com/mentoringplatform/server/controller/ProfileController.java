package com.mentoringplatform.server.controller;

import com.mentoringplatform.server.dto.ApiResponse;
import com.mentoringplatform.server.dto.ProfileRequest;
import com.mentoringplatform.server.dto.ProfileResponse;
import com.mentoringplatform.server.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/monitoringPlatform/mentor/profile")
@CrossOrigin(origins = "*")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfile(Authentication authentication) {
        try {
            String username = authentication.getName();
            ProfileResponse profile = profileService.getProfile(username);
            return ResponseEntity.ok(ApiResponse.success(profile, "Profile retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve profile: " + e.getMessage()));
        }
    }

    @PutMapping
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @Valid @RequestBody ProfileRequest profileRequest,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            ProfileResponse updatedProfile = profileService.updateProfile(username, profileRequest);
            return ResponseEntity.ok(ApiResponse.success(updatedProfile, "Profile updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to update profile: " + e.getMessage()));
        }
    }
} 