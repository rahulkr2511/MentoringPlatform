package com.mentoringplatform.server.controller;

import com.mentoringplatform.server.dto.ApiResponse;
import com.mentoringplatform.server.dto.PushSubscriptionRequest;
import com.mentoringplatform.server.service.PushSubscriptionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/monitoringPlatform/push-subscriptions")
@CrossOrigin(origins = "*")
public class PushSubscriptionController {

    private final PushSubscriptionService pushSubscriptionService;

    public PushSubscriptionController(PushSubscriptionService pushSubscriptionService) {
        this.pushSubscriptionService = pushSubscriptionService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MENTOR', 'MENTEE')")
    public ResponseEntity<ApiResponse<Void>> registerSubscription(
            @Valid @RequestBody PushSubscriptionRequest request,
            Authentication authentication) {
        pushSubscriptionService.upsertSubscription(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success(null, "Subscription registered"));
    }
}
