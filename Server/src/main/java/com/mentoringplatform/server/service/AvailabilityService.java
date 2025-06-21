package com.mentoringplatform.server.service;

import com.mentoringplatform.server.dto.AvailabilitySlot;
import com.mentoringplatform.server.dto.MentorAvailabilityRequest;
import com.mentoringplatform.server.model.Availability;
import com.mentoringplatform.server.model.Session;
import com.mentoringplatform.server.model.User;
import com.mentoringplatform.server.repository.AvailabilityRepository;
import com.mentoringplatform.server.repository.SessionRepository;
import com.mentoringplatform.server.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AvailabilityService {

    private final AvailabilityRepository availabilityRepository;
    private final SessionRepository sessionRepository;
    private final UserRepository userRepository;

    public AvailabilityService(AvailabilityRepository availabilityRepository, SessionRepository sessionRepository, UserRepository userRepository) {
        this.availabilityRepository = availabilityRepository;
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    public List<AvailabilitySlot> getAvailableTimeSlots(MentorAvailabilityRequest request) {
        List<AvailabilitySlot> availableSlots = new ArrayList<>();
        
        // Get mentor's availability patterns
        List<Availability> mentorAvailabilities = availabilityRepository.findActiveAvailabilitiesByMentorId(request.getMentorId());
        
        // If no structured availability exists, try to get from user profile
        if (mentorAvailabilities.isEmpty()) {
            User mentor = userRepository.findById(request.getMentorId()).orElse(null);
            if (mentor != null && mentor.getAvailability() != null && !mentor.getAvailability().trim().isEmpty()) {
                // Create default availability based on profile availability
                mentorAvailabilities = createDefaultAvailabilityFromProfile(mentor);
            } else {
                // If no profile availability either, create default availability
                initializeDefaultAvailability(request.getMentorId());
                mentorAvailabilities = availabilityRepository.findActiveAvailabilitiesByMentorId(request.getMentorId());
            }
        }

        LocalDate currentDate = request.getStartDate();
        LocalDate endDate = request.getEndDate();
        
        while (!currentDate.isAfter(endDate)) {
            DayOfWeek dayOfWeek = currentDate.getDayOfWeek();
            
            // Find availabilities for this day of week
            List<Availability> dayAvailabilities = mentorAvailabilities.stream()
                    .filter(avail -> avail.getDayOfWeek() == dayOfWeek)
                    .collect(Collectors.toList());
            
            for (Availability availability : dayAvailabilities) {
                List<AvailabilitySlot> daySlots = generateTimeSlotsForAvailability(
                    currentDate, 
                    availability, 
                    request.getDurationMinutes(),
                    request.getMentorId()
                );
                availableSlots.addAll(daySlots);
            }
            
            currentDate = currentDate.plusDays(1);
        }
        
        return availableSlots;
    }

    private List<Availability> createDefaultAvailabilityFromProfile(User mentor) {
        List<Availability> availabilities = new ArrayList<>();
        
        // Parse the availability string from profile
        String availabilityStr = mentor.getAvailability().toLowerCase();
        
        // Default times based on common patterns
        LocalTime weekdayStart = LocalTime.of(9, 0); // 9:00 AM
        LocalTime weekdayEnd = LocalTime.of(17, 0);  // 5:00 PM
        LocalTime weekendStart = LocalTime.of(10, 0); // 10:00 AM
        LocalTime weekendEnd = LocalTime.of(16, 0);   // 4:00 PM
        
        // Try to parse specific times from availability string
        if (availabilityStr.contains("weekday") || availabilityStr.contains("weekdays")) {
            // Extract time information if available
            if (availabilityStr.contains("9") || availabilityStr.contains("am")) {
                weekdayStart = LocalTime.of(9, 0);
            }
            if (availabilityStr.contains("5") || availabilityStr.contains("pm")) {
                weekdayEnd = LocalTime.of(17, 0);
            }
        }
        
        if (availabilityStr.contains("weekend") || availabilityStr.contains("weekends")) {
            // Extract time information if available
            if (availabilityStr.contains("10") || availabilityStr.contains("am")) {
                weekendStart = LocalTime.of(10, 0);
            }
            if (availabilityStr.contains("4") || availabilityStr.contains("pm")) {
                weekendEnd = LocalTime.of(16, 0);
            }
        }
        
        // Create availability for weekdays
        for (DayOfWeek day : List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
                                   DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)) {
            Availability availability = new Availability();
            availability.setMentor(mentor);
            availability.setDayOfWeek(day);
            availability.setStartTime(weekdayStart);
            availability.setEndTime(weekdayEnd);
            availability.setAvailable(true);
            availabilities.add(availability);
        }
        
        // Create availability for weekends
        for (DayOfWeek day : List.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)) {
            Availability availability = new Availability();
            availability.setMentor(mentor);
            availability.setDayOfWeek(day);
            availability.setStartTime(weekendStart);
            availability.setEndTime(weekendEnd);
            availability.setAvailable(true);
            availabilities.add(availability);
        }
        
        return availabilities;
    }

    private List<AvailabilitySlot> generateTimeSlotsForAvailability(
            LocalDate date, 
            Availability availability, 
            Integer durationMinutes,
            Long mentorId) {
        
        List<AvailabilitySlot> slots = new ArrayList<>();
        
        LocalTime currentTime = availability.getStartTime();
        LocalTime endTime = availability.getEndTime();
        
        // Use 15-minute intervals for more granular slot generation
        // This allows for any duration to fit within the availability window
        int intervalMinutes = 15;
        
        while (currentTime.plusMinutes(durationMinutes).isBefore(endTime) || 
               currentTime.plusMinutes(durationMinutes).equals(endTime)) {
            
            LocalDateTime slotStart = LocalDateTime.of(date, currentTime);
            LocalDateTime slotEnd = slotStart.plusMinutes(durationMinutes);
            
            // Check if this slot conflicts with existing sessions
            boolean isAvailable = !hasSessionConflict(mentorId, slotStart, slotEnd);
            
            if (isAvailable) {
                AvailabilitySlot slot = new AvailabilitySlot();
                slot.setStartTime(slotStart);
                slot.setEndTime(slotEnd);
                slot.setAvailable(true);
                slot.setFormattedTime(formatTimeSlot(slotStart, slotEnd));
                slots.add(slot);
            }
            
            // Move to next slot (15-minute intervals for more flexibility)
            currentTime = currentTime.plusMinutes(intervalMinutes);
        }
        
        return slots;
    }

    private boolean hasSessionConflict(Long mentorId, LocalDateTime startTime, LocalDateTime endTime) {
        // Check for any sessions that overlap with the requested time slot
        // Include PENDING, CONFIRMED, and any other active sessions
        List<Session> conflictingSessions = sessionRepository.findSessionsForMentorInTimeRange(
            mentorId, 
            startTime.minusMinutes(30), 
            endTime.plusMinutes(30)
        );
        
        return conflictingSessions.stream().anyMatch(session -> {
            // Only consider sessions that are not cancelled or rejected
            if (session.getStatus().equals("CANCELLED") || session.getStatus().equals("REJECTED")) {
                return false;
            }
            
            LocalDateTime sessionEnd = session.getScheduledDateTime().plusMinutes(session.getDurationMinutes());
            
            // Check for overlap: new session starts before existing session ends AND new session ends after existing session starts
            return (startTime.isBefore(sessionEnd) && endTime.isAfter(session.getScheduledDateTime()));
        });
    }

    private String formatTimeSlot(LocalDateTime start, LocalDateTime end) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' h:mm a");
        return start.format(formatter) + " - " + end.format(DateTimeFormatter.ofPattern("h:mm a"));
    }

    // Method to initialize default availability for a mentor (if needed)
    public void initializeDefaultAvailability(Long mentorId) {
        // Check if mentor already has availability set
        List<Availability> existingAvailabilities = availabilityRepository.findByMentorIdOrderByDayOfWeekAscStartTimeAsc(mentorId);
        if (!existingAvailabilities.isEmpty()) {
            return; // Mentor already has availability set
        }
        
        // Create default availability for weekdays 9 AM - 5 PM
        for (DayOfWeek day : List.of(DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, 
                                   DayOfWeek.THURSDAY, DayOfWeek.FRIDAY)) {
            Availability availability = new Availability();
            availability.setMentor(new com.mentoringplatform.server.model.User() {{ setId(mentorId); }});
            availability.setDayOfWeek(day);
            availability.setStartTime(LocalTime.of(9, 0)); // 9:00 AM
            availability.setEndTime(LocalTime.of(17, 0));  // 5:00 PM
            availability.setAvailable(true);
            availabilityRepository.save(availability);
        }
        
        // Create default availability for weekends 10 AM - 4 PM (shorter hours)
        for (DayOfWeek day : List.of(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY)) {
            Availability availability = new Availability();
            availability.setMentor(new com.mentoringplatform.server.model.User() {{ setId(mentorId); }});
            availability.setDayOfWeek(day);
            availability.setStartTime(LocalTime.of(10, 0)); // 10:00 AM
            availability.setEndTime(LocalTime.of(16, 0));   // 4:00 PM
            availability.setAvailable(true);
            availabilityRepository.save(availability);
        }
    }
    
    // Method to set custom availability for a mentor
    public void setMentorAvailability(Long mentorId, DayOfWeek dayOfWeek, LocalTime startTime, LocalTime endTime, boolean isAvailable) {
        // Remove existing availability for this day
        List<Availability> existingAvailabilities = availabilityRepository.findByMentorIdAndDayOfWeekOrderByStartTimeAsc(mentorId, dayOfWeek);
        availabilityRepository.deleteAll(existingAvailabilities);
        
        if (isAvailable) {
            Availability availability = new Availability();
            availability.setMentor(new com.mentoringplatform.server.model.User() {{ setId(mentorId); }});
            availability.setDayOfWeek(dayOfWeek);
            availability.setStartTime(startTime);
            availability.setEndTime(endTime);
            availability.setAvailable(true);
            availabilityRepository.save(availability);
        }
    }
    
    // Method to get mentor's availability summary
    public String getMentorAvailabilitySummary(Long mentorId) {
        List<Availability> availabilities = availabilityRepository.findActiveAvailabilitiesByMentorId(mentorId);
        
        if (availabilities.isEmpty()) {
            // Try to get availability from user profile
            User mentor = userRepository.findById(mentorId).orElse(null);
            if (mentor != null && mentor.getAvailability() != null && !mentor.getAvailability().trim().isEmpty()) {
                return mentor.getAvailability();
            }
            return "No availability set";
        }
        
        StringBuilder summary = new StringBuilder();
        
        // Group by day type (weekdays vs weekends)
        List<Availability> weekdays = availabilities.stream()
            .filter(a -> a.getDayOfWeek().getValue() >= 1 && a.getDayOfWeek().getValue() <= 5)
            .collect(Collectors.toList());
            
        List<Availability> weekends = availabilities.stream()
            .filter(a -> a.getDayOfWeek().getValue() >= 6)
            .collect(Collectors.toList());
        
        if (!weekdays.isEmpty()) {
            summary.append("Weekdays: ");
            summary.append(formatTimeRange(weekdays.get(0).getStartTime(), weekdays.get(0).getEndTime()));
            summary.append(" | ");
        }
        
        if (!weekends.isEmpty()) {
            summary.append("Weekends: ");
            summary.append(formatTimeRange(weekends.get(0).getStartTime(), weekends.get(0).getEndTime()));
        }
        
        return summary.toString();
    }
    
    private String formatTimeRange(LocalTime start, LocalTime end) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("h:mm a");
        return start.format(formatter) + " - " + end.format(formatter);
    }
} 