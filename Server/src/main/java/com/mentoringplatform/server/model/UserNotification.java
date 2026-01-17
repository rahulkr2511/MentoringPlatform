package com.mentoringplatform.server.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "user_notifications")
public class UserNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // Primary key so individual notifications can be updated or removed.
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    // Recipient user; drawer queries use this relationship.
    private User user;

    @Column(name = "notification_type", nullable = false, length = 64)
    @Enumerated(EnumType.STRING)
    // Defines what triggered the notification and drives UI templating.
    private NotificationType notificationType;

    @Column(name = "title", nullable = false, length = 120)
    // Short heading shown in the drawer and desktop notification.
    private String title;

    @Column(name = "body", length = 512)
    // Optional descriptive text providing context about the event.
    private String body;

    @Column(name = "meeting_id")
    // Links back to the mentoring meeting, allowing filtering or dedupe.
    private Long meetingId;

    @Column(name = "session_id")
    // Associates join alerts with a specific live session.
    private Long sessionId;

    @Column(name = "actor_user_id")
    // Stores which participant triggered the notification (mentor or mentee).
    private Long actorUserId;

    @Column(name = "deep_link", length = 256)
    // SPA route used to navigate the user when they click the notification.
    private String deepLink;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    // Raw payload snapshot for auditability or re-rendering if needed.
    private String payloadJson;

    @Column(name = "is_read", nullable = false)
    // Read state powers unread badges and mark-as-read APIs.
    private boolean read = false;

    @Column(name = "created_at", nullable = false)
    // Timestamp to order notifications chronologically.
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    // Tracks latest state change (e.g., marked read) for sync purposes.
    private LocalDateTime updatedAt = LocalDateTime.now();

    public enum NotificationType {
        SESSION_JOIN,
        SESSION_UPDATE,
        MEETING_REMINDER
    }

    public void markRead() {
        this.read = true;
        this.updatedAt = LocalDateTime.now();
    }

    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
