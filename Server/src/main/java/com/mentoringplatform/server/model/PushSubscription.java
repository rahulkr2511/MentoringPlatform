package com.mentoringplatform.server.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(
        name = "push_subscriptions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_push_subscription_endpoint", columnNames = "endpoint")
        }
)
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    // Primary key so each subscription entry can be referenced or deactivated individually.
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    // Owning user; lets us fetch all endpoints that should receive a push.
    private User user;

    @Column(name = "endpoint", nullable = false, length = 1024)
    // Browser-provided push endpoint; required to address push messages.
    private String endpoint;

    @Column(name = "p256dh_key", nullable = false, length = 180)
    // Public encryption key needed to encrypt payloads per Web Push spec.
    private String p256dhKey;

    @Column(name = "auth_key", nullable = false, length = 48)
    // Auth secret accompanying the endpoint to validate sender identity.
    private String authKey;

    @Column(name = "is_active", nullable = false)
    // Flag toggled off if browser unsubscribes (e.g., 410 Gone) so we can skip sends.
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    // Audit timestamp for when this subscription was first registered.
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    // Tracks last refresh, helping identify stale subscriptions.
    private LocalDateTime updatedAt = LocalDateTime.now();

    public void touch() {
        this.updatedAt = LocalDateTime.now();
    }
}
