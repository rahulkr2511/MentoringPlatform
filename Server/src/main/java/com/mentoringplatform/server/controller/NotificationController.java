package com.mentoringplatform.server.controller;

import com.mentoringplatform.server.dto.ApiResponse;
import com.mentoringplatform.server.model.UserNotification;
import com.mentoringplatform.server.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/monitoringPlatform/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MENTOR', 'MENTEE')")
    public ResponseEntity<ApiResponse<List<UserNotification>>> getNotifications(Authentication authentication) {
        List<UserNotification> notifications = notificationService.getLatestNotifications(authentication.getName(), 50);
        return ResponseEntity.ok(ApiResponse.success(notifications, "Notifications retrieved"));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('MENTOR', 'MENTEE')")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable Long id, Authentication authentication) {
        notificationService.markAsRead(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Notification marked as read"));
    }

    @PostMapping("/mark-all-read")
    @PreAuthorize("hasAnyRole('MENTOR', 'MENTEE')")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success(null, "All notifications marked as read"));
    }
}
