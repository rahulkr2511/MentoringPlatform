package com.mentoringplatform.server.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "sessions")
public class Session {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentor_id", nullable = false)
    private User mentor;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mentee_id", nullable = false)
    private User mentee;
    
    @Column(name = "scheduled_date_time", nullable = false)
    private LocalDateTime scheduledDateTime;
    
    @Column(name = "duration_minutes", nullable = false)
    private Integer durationMinutes;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SessionStatus status = SessionStatus.PENDING;
    
    @Column(name = "session_type")
    private String sessionType = "VIDEO_CALL"; // VIDEO_CALL, CHAT, EMAIL
    
    @Column(name = "notes", length = 1000)
    private String notes;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum SessionStatus {
        PENDING,    // Waiting for mentor approval
        CONFIRMED,  // Mentor approved
        REJECTED,   // Mentor rejected
        CANCELLED,  // Cancelled by either party
        COMPLETED,  // Session completed
        NO_SHOW     // One party didn't show up
    }
} 