package com.mentoringplatform.server.repository;

import com.mentoringplatform.server.model.Session;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    
    // Find sessions by mentor
    List<Session> findByMentorIdOrderByScheduledDateTimeDesc(Long mentorId);
    
    // Find sessions by mentee
    List<Session> findByMenteeIdOrderByScheduledDateTimeDesc(Long menteeId);
    
    // Find upcoming sessions for a user (as mentor or mentee)
    @Query("SELECT s FROM Session s WHERE (s.mentor.id = :userId OR s.mentee.id = :userId) " +
           "AND s.scheduledDateTime >= :now AND s.status IN ('PENDING', 'CONFIRMED') " +
           "ORDER BY s.scheduledDateTime ASC")
    List<Session> findUpcomingSessionsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    // Find past sessions for a user
    @Query("SELECT s FROM Session s WHERE (s.mentor.id = :userId OR s.mentee.id = :userId) " +
           "AND s.scheduledDateTime < :now ORDER BY s.scheduledDateTime DESC")
    List<Session> findPastSessionsByUserId(@Param("userId") Long userId, @Param("now") LocalDateTime now);
    
    // Find sessions by status for a user
    @Query("SELECT s FROM Session s WHERE (s.mentor.id = :userId OR s.mentee.id = :userId) " +
           "AND s.status = :status ORDER BY s.scheduledDateTime DESC")
    List<Session> findSessionsByUserIdAndStatus(@Param("userId") Long userId, @Param("status") Session.SessionStatus status);
    
    // Find sessions for a mentor in a time range (for conflict detection)
    @Query("SELECT s FROM Session s WHERE s.mentor.id = :mentorId " +
           "AND s.scheduledDateTime BETWEEN :startTime AND :endTime " +
           "ORDER BY s.scheduledDateTime ASC")
    List<Session> findSessionsForMentorInTimeRange(@Param("mentorId") Long mentorId, 
                                                   @Param("startTime") LocalDateTime startTime, 
                                                   @Param("endTime") LocalDateTime endTime);
    
    // Find active sessions for a mentor in a time range (for availability display)
    @Query("SELECT s FROM Session s WHERE s.mentor.id = :mentorId " +
           "AND s.status IN ('PENDING', 'CONFIRMED') " +
           "AND s.scheduledDateTime BETWEEN :startTime AND :endTime " +
           "ORDER BY s.scheduledDateTime ASC")
    List<Session> findActiveSessionsForMentorInTimeRange(@Param("mentorId") Long mentorId, 
                                                         @Param("startTime") LocalDateTime startTime, 
                                                         @Param("endTime") LocalDateTime endTime);
} 