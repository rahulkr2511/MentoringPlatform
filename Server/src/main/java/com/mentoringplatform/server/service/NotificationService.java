package com.mentoringplatform.server.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mentoringplatform.server.model.Session;
import com.mentoringplatform.server.model.User;
import com.mentoringplatform.server.model.UserNotification;
import com.mentoringplatform.server.repository.UserNotificationRepository;
import com.mentoringplatform.server.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public NotificationService(UserNotificationRepository notificationRepository,
                               UserRepository userRepository,
                               ObjectMapper objectMapper) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public UserNotification createSessionJoinNotification(Session session,
                                                          User actor,
                                                          User recipient,
                                                          String messageBody) {
        UserNotification notification = new UserNotification();
        notification.setUser(recipient);
        notification.setNotificationType(UserNotification.NotificationType.SESSION_JOIN);
        String actorDisplayName = actor.getName() != null ? actor.getName() : actor.getUsername();
        notification.setTitle(actorDisplayName + " joined the session");
        notification.setBody(messageBody);
        notification.setMeetingId(session.getId());
        notification.setSessionId(session.getId());
        notification.setActorUserId(actor.getId());
        notification.setDeepLink("/sessions/" + session.getId());
        notification.setCreatedAt(LocalDateTime.now());
        notification.setUpdatedAt(LocalDateTime.now());
        try {
            notification.setPayloadJson(objectMapper.writeValueAsString(buildPayload(session, actor, actorDisplayName)));
        } catch (JsonProcessingException ex) {
            log.warn("Failed to serialize notification payload for session {}", session.getId(), ex);
        }
        return notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<UserNotification> getLatestNotifications(String username, int limit) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(user.getId());
    }

    @Transactional
    public void markAsRead(String username, Long notificationId) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        UserNotification notification = notificationRepository.findByIdAndUserId(notificationId, user.getId())
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        notification.markRead();
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        List<UserNotification> notifications = notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(user.getId());
        notifications.forEach(UserNotification::markRead);
        notificationRepository.saveAll(notifications);
    }

    private SessionNotificationPayload buildPayload(Session session, User actor, String actorDisplayName) {
        SessionNotificationPayload payload = new SessionNotificationPayload();
        payload.setSessionId(session.getId());
        payload.setMeetingId(session.getId());
        payload.setActorUserId(actor.getId());
        payload.setActorName(actorDisplayName);
        payload.setActorRoles(actor.getRoles());
        payload.setMeetingUrl("/sessions/" + session.getId());
        payload.setScheduledDateTime(session.getScheduledDateTime());
        return payload;
    }

    private static class SessionNotificationPayload {
        private Long sessionId;
        private Long meetingId;
        private Long actorUserId;
        private String actorName;
        private java.util.Set<String> actorRoles;
        private String meetingUrl;
        private LocalDateTime scheduledDateTime;

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

        public Long getActorUserId() {
            return actorUserId;
        }

        public void setActorUserId(Long actorUserId) {
            this.actorUserId = actorUserId;
        }

        public String getActorName() {
            return actorName;
        }

        public void setActorName(String actorName) {
            this.actorName = actorName;
        }

        public java.util.Set<String> getActorRoles() {
            return actorRoles;
        }

        public void setActorRoles(java.util.Set<String> actorRoles) {
            this.actorRoles = actorRoles;
        }

        public String getMeetingUrl() {
            return meetingUrl;
        }

        public void setMeetingUrl(String meetingUrl) {
            this.meetingUrl = meetingUrl;
        }

        public LocalDateTime getScheduledDateTime() {
            return scheduledDateTime;
        }

        public void setScheduledDateTime(LocalDateTime scheduledDateTime) {
            this.scheduledDateTime = scheduledDateTime;
        }
    }
}
