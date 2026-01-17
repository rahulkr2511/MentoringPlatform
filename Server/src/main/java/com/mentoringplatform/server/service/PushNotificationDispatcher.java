package com.mentoringplatform.server.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentoringplatform.server.config.PushProperties;
import com.mentoringplatform.server.dto.WebPushRequest;
import com.mentoringplatform.server.model.PushSubscription;
import com.mentoringplatform.server.model.User;
import com.mentoringplatform.server.model.UserNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.Executor;
import java.util.stream.Collectors;

/**
 * Dispatches domain notifications over Web Push using a dedicated thread pool.
 */
@Service
public class PushNotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(PushNotificationDispatcher.class);

    private final PushSubscriptionService pushSubscriptionService;
    private final WebPushGateway webPushGateway;
    private final ObjectMapper objectMapper;
    private final PushProperties pushProperties;
    private final Executor pushExecutor;

    public PushNotificationDispatcher(PushSubscriptionService pushSubscriptionService,
                                      WebPushGateway webPushGateway,
                                      ObjectMapper objectMapper,
                                      PushProperties pushProperties) {
        this.pushSubscriptionService = pushSubscriptionService;
        this.webPushGateway = webPushGateway;
        this.objectMapper = objectMapper;
        this.pushProperties = pushProperties;
        this.pushExecutor = buildExecutor();
    }

    public void dispatchSessionJoin(UserNotification notification,
                                    User recipient,
                                    String actorDisplayName) {
        log.info("🚀 [PushNotificationDispatcher] Starting dispatch for session join notification. NotificationId: {}, Recipient: {} (ID: {}), Actor: {}",
                notification.getId(), recipient.getUsername(), recipient.getId(), actorDisplayName);
        
        pushExecutor.execute(() -> {
            log.info("📋 [PushNotificationDispatcher] Executing push dispatch task for notification {}", notification.getId());
            
            if (!pushProperties.isDispatchEnabled()) {
                log.warn("⚠️ [PushNotificationDispatcher] Push dispatch disabled via configuration; skipping send for notification {}", notification.getId());
                return;
            }
            
            log.info("🔍 [PushNotificationDispatcher] Looking up active subscriptions for user {} (ID: {})", 
                    recipient.getUsername(), recipient.getId());
            
            List<PushSubscription> subscriptions =
                    pushSubscriptionService.getActiveSubscriptions(recipient.getId());
            
            log.info("📊 [PushNotificationDispatcher] Found {} active subscription(s) for user {} (ID: {})", 
                    subscriptions.size(), recipient.getUsername(), recipient.getId());
            
            if (subscriptions.isEmpty()) {
                log.warn("⚠️ [PushNotificationDispatcher] No active subscriptions for user {} (ID: {}); cannot send push notification", 
                        recipient.getUsername(), recipient.getId());
                return;
            }

            String payloadJson = buildSessionJoinPayload(notification, actorDisplayName);
            log.info("📦 [PushNotificationDispatcher] Built payload for notification {}: {}", notification.getId(), payloadJson);
            
            List<WebPushRequest> batch = subscriptions.stream()
                    .map(subscription -> {
                        log.info("🔗 [PushNotificationDispatcher] Creating push request for endpoint: {}", subscription.getEndpoint());
                        return WebPushRequest.builder()
                                .endpoint(subscription.getEndpoint())
                                .p256dhKey(subscription.getP256dhKey())
                                .authKey(subscription.getAuthKey())
                                .payload(payloadJson)
                                .ttlSeconds(null)
                                .build();
                    })
                    .collect(Collectors.toList());

            log.info("📤 [PushNotificationDispatcher] Sending batch of {} push notification(s) via webPushGateway", batch.size());
            webPushGateway.sendBatch(batch);
            log.info("✅ [PushNotificationDispatcher] Push dispatch completed for notification {}", notification.getId());
        });
    }

    private String buildSessionJoinPayload(UserNotification notification,
                                           String actorDisplayName) {
        SessionJoinPayload payload = new SessionJoinPayload();
        payload.setNotificationId(notification.getId());
        payload.setType(notification.getNotificationType().name());
        payload.setTitle(notification.getTitle());
        payload.setBody(notification.getBody());
        payload.setDeepLink(notification.getDeepLink());
        payload.setActorName(actorDisplayName);
        payload.setSessionId(notification.getSessionId());
        payload.setMeetingId(notification.getMeetingId());
        payload.setCreatedAt(notification.getCreatedAt());
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize session join payload for notification {}", notification.getId(), e);
            return "{}";
        }
    }

    private Executor buildExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setThreadNamePrefix("push-dispatcher-");
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(100);
        executor.initialize();
        return executor;
    }

    private static class SessionJoinPayload {
        private Long notificationId;
        private String type;
        private String title;
        private String body;
        private String deepLink;
        private String actorName;
        private Long sessionId;
        private Long meetingId;
        private java.time.LocalDateTime createdAt;

        public Long getNotificationId() {
            return notificationId;
        }

        public void setNotificationId(Long notificationId) {
            this.notificationId = notificationId;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getBody() {
            return body;
        }

        public void setBody(String body) {
            this.body = body;
        }

        public String getDeepLink() {
            return deepLink;
        }

        public void setDeepLink(String deepLink) {
            this.deepLink = deepLink;
        }

        public String getActorName() {
            return actorName;
        }

        public void setActorName(String actorName) {
            this.actorName = actorName;
        }

        public Long getSessionId() {
            return sessionId;
        }

        public void setSessionId(Long sessionId) {
            this.sessionId = sessionId;
        }

        public Long getMeetingId() {
            return meetingId;
        }

        public void setMeetingId(Long meetingId) {
            this.meetingId = meetingId;
        }

        public java.time.LocalDateTime getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(java.time.LocalDateTime createdAt) {
            this.createdAt = createdAt;
        }
    }
}
