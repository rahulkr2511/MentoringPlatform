package com.mentoringplatform.server.repository;

import com.mentoringplatform.server.model.Availability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.DayOfWeek;
import java.util.List;

@Repository
public interface AvailabilityRepository extends JpaRepository<Availability, Long> {
    
    // Find all availabilities for a mentor
    List<Availability> findByMentorIdOrderByDayOfWeekAscStartTimeAsc(Long mentorId);
    
    // Find availabilities for a specific day of week
    List<Availability> findByMentorIdAndDayOfWeekOrderByStartTimeAsc(Long mentorId, DayOfWeek dayOfWeek);
    
    // Find active availabilities for a mentor
    @Query("SELECT a FROM Availability a WHERE a.mentor.id = :mentorId AND a.isAvailable = true ORDER BY a.dayOfWeek ASC, a.startTime ASC")
    List<Availability> findActiveAvailabilitiesByMentorId(@Param("mentorId") Long mentorId);
} 