package com.mentoringplatform.server.controller;

import com.mentoringplatform.server.dto.ApiResponse;
import com.mentoringplatform.server.dto.SessionBookingRequest;
import com.mentoringplatform.server.dto.SessionResponse;
import com.mentoringplatform.server.model.Session;
import com.mentoringplatform.server.service.SessionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/monitoringPlatform/sessions")
@CrossOrigin(origins = "*")
public class SessionController {

    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/book")
    @PreAuthorize("hasRole('MENTEE')")
    public ResponseEntity<ApiResponse<SessionResponse>> bookSession(
            @Valid @RequestBody SessionBookingRequest request,
            Authentication authentication) {
        try {
            String menteeUsername = authentication.getName();
            SessionResponse session = sessionService.bookSession(menteeUsername, request);
            return ResponseEntity.ok(ApiResponse.success(session, "Session booked successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to book session: " + e.getMessage()));
        }
    }

    @GetMapping("/upcoming")
    @PreAuthorize("hasAnyRole('MENTOR', 'MENTEE')")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getUpcomingSessions(Authentication authentication) {
        try {
            String username = authentication.getName();
            List<SessionResponse> sessions = sessionService.getUpcomingSessions(username);
            return ResponseEntity.ok(ApiResponse.success(sessions, "Upcoming sessions retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve upcoming sessions: " + e.getMessage()));
        }
    }

    @GetMapping("/history")
    @PreAuthorize("hasAnyRole('MENTOR', 'MENTEE')")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getSessionHistory(Authentication authentication) {
        try {
            String username = authentication.getName();
            List<SessionResponse> sessions = sessionService.getPastSessions(username);
            return ResponseEntity.ok(ApiResponse.success(sessions, "Session history retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to retrieve session history: " + e.getMessage()));
        }
    }

    @PutMapping("/{sessionId}/status")
    @PreAuthorize("hasRole('MENTOR')")
    public ResponseEntity<ApiResponse<SessionResponse>> updateSessionStatus(
            @PathVariable Long sessionId,
            @RequestParam Session.SessionStatus status,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            SessionResponse session = sessionService.updateSessionStatus(sessionId, status, username);
            return ResponseEntity.ok(ApiResponse.success(session, "Session status updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to update session status: " + e.getMessage()));
        }
    }

    @PutMapping("/{sessionId}/cancel")
    @PreAuthorize("hasAnyRole('MENTOR', 'MENTEE')")
    public ResponseEntity<ApiResponse<SessionResponse>> cancelSession(
            @PathVariable Long sessionId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            SessionResponse session = sessionService.cancelSession(sessionId, username);
            return ResponseEntity.ok(ApiResponse.success(session, "Session cancelled successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to cancel session: " + e.getMessage()));
        }
    }
} 